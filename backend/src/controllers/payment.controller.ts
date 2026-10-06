import type { PoolClient } from "pg";
import { query, withTransaction } from "../config";
import type {
  ListPaymentsQuery,
  SubmitPaymentBody,
  VerifyPaymentBody,
} from "../schemas";
import {
  AppError,
  asyncHandler,
  authUser,
  getBody,
  getParams,
  getQuery,
  notFound,
  sendPage,
  enqueueOrder,
  sendSuccess,
  getOrderAccess,
  requireCafeteriaAccess,
  refreshDailyAnalytics,
  Where,
  pagedQuery,
} from "../utils";

const BASE_COLS = `p.id, p.order_id, p.payment_method, p.amount, p.status, p.transaction_id, p.verified_at,
  p.created_at, p.updated_at, o.status AS order_status`;
const STAFF_COLS = `${BASE_COLS}, p.staff_note, p.verified_by`;

const fetchPayment = async (
  where: string,
  param: number,
  staffSide: boolean,
  client?: PoolClient,
) => {
  const { rows } = await query(
    `SELECT ${staffSide ? STAFF_COLS : BASE_COLS} FROM payments p JOIN orders o ON o.id = p.order_id WHERE ${where} = $1`,
    [param],
    client,
  );
  if (!rows[0]) throw notFound("Payment");
  return rows[0];
};

export const getOrderPayment = asyncHandler(async (req, res) => {
  const { orderId } = getParams<{ orderId: number }>(req);
  const { order, staffSide } = await getOrderAccess(authUser(req), orderId);
  const payment = await fetchPayment("p.order_id", orderId, staffSide);
  const cafe = await query<{
    name: string;
    payment_instructions: string | null;
  }>("SELECT name, payment_instructions FROM cafeterias WHERE id = $1", [
    order.cafeteria_id,
  ]);
  const orderpayment = cafe.rows[0];
  if (!orderpayment) throw new AppError(500, "Failed to create order payment");

  sendSuccess(
    res,
    {
      ...payment,
      cafeteria_name: orderpayment.name,
      payment_instructions: orderpayment.payment_instructions,
    },
    "Payment retrieved",
  );
});

export const getPayment = asyncHandler(async (req, res) => {
  const { id } = getParams<{ id: number }>(req);
  const ref = await query<{ order_id: number }>(
    "SELECT order_id FROM payments WHERE id = $1",
    [id],
  );
  if (!ref.rows[0]) throw notFound("Payment");
  const { staffSide } = await getOrderAccess(
    authUser(req),
    ref.rows[0].order_id,
  );
  sendSuccess(
    res,
    await fetchPayment("p.id", id, staffSide),
    "Payment retrieved",
  );
});

// The customer records the external payment reference; the payment stays pending until staff verify it
export const submitPayment = asyncHandler(async (req, res) => {
  const user = authUser(req);
  const b = getBody<SubmitPaymentBody>(req);

  const owner = await query<{ user_id: number }>(
    "SELECT user_id FROM orders WHERE id = $1",
    [b.orderId],
  );
  if (!owner.rows[0] || owner.rows[0].user_id !== user.id)
    throw notFound("Order");

  const paymentId = await withTransaction(async (client) => {
    const o = await client.query<{ status: string }>(
      "SELECT status FROM orders WHERE id = $1 FOR UPDATE",
      [b.orderId],
    );
    const paymentid = o.rows[0];
    if (!paymentid) throw new AppError(500, "Failed to create payment ID");
    if (paymentid.status !== "not_paid")
      throw new AppError(
        409,
        `Order is ${paymentid.status}; payment details can no longer be submitted`,
      );
    const p = await client.query<{
      id: number;
      status: string;
      payment_method: string;
    }>(
      "SELECT id, status, payment_method FROM payments WHERE order_id = $1 FOR UPDATE",
      [b.orderId],
    );
    if (!p.rows[0]) throw notFound("Payment");
    if (!["pending", "failed"].includes(p.rows[0].status))
      throw new AppError(409, `Payment is already ${p.rows[0].status}`);
    const method = b.paymentMethod ?? p.rows[0].payment_method;
    if (method !== "cash" && !b.transactionId) {
      throw new AppError(
        400,
        "A payment reference (transactionId) is required for card and UPI payments",
      );
    }
    await client.query(
      `UPDATE payments SET payment_method = $1, transaction_id = $2, status = 'pending', staff_note = NULL,
              verified_by = NULL, verified_at = NULL WHERE id = $3`,
      [method, b.transactionId ?? null, p.rows[0].id],
    );
    return p.rows[0].id;
  });
  sendSuccess(
    res,
    await fetchPayment("p.id", paymentId, false),
    "Payment details submitted; awaiting staff verification",
    201,
  );
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const user = authUser(req);
  const { id } = getParams<{ id: number }>(req);
  const b = getBody<VerifyPaymentBody>(req);

  const pre = await query<{ order_id: number; cafeteria_id: number }>(
    "SELECT p.order_id, o.cafeteria_id FROM payments p JOIN orders o ON o.id = p.order_id WHERE p.id = $1",
    [id],
  );
  if (!pre.rows[0]) throw notFound("Payment");
  const { order_id: orderId, cafeteria_id: cafeteriaId } = pre.rows[0];
  await requireCafeteriaAccess(user, cafeteriaId, "staff");
  await withTransaction(async (client) => {
    // Lock order first, then payment (same order as cancel) to avoid deadlocks.
    const o = await client.query<{ status: string }>(
      "SELECT status FROM orders WHERE id = $1 FOR UPDATE",
      [orderId],
    );
    const p = await client.query<{
      status: string;
      payment_method: string;
      transaction_id: string | null;
    }>(
      "SELECT status, payment_method, transaction_id FROM payments WHERE id = $1 FOR UPDATE",
      [id],
    );
    const order = o.rows[0];
    if (!order) throw new AppError(500, "Order not found");
    const transaction = p.rows[0];
    if (!transaction) throw new AppError(500, "Payment not found");
    if (transaction.status !== "pending") {
      throw new AppError(409, `Payment is already ${transaction.status}`);
    }
    if (order.status !== "not_paid") {
      throw new AppError(409, `Order is already ${order.status}`);
    }
    if (!b.verified) {
      await client.query(
        "UPDATE payments SET status = 'failed', staff_note = $1, verified_by = $2, verified_at = NOW() WHERE id = $3",
        [b.note ?? null, user.id, id],
      );
      return;
    }

    const reference = b.transactionId ?? transaction.transaction_id;
    if (transaction.payment_method !== "cash" && !reference) {
      throw new AppError(
        400,
        "A payment reference is required to verify card and UPI payments",
      );
    }
    await client.query(
      `UPDATE payments
       SET status = 'success',
           transaction_id = $1,
           staff_note = $2,
           verified_by = $3,
           verified_at = NOW()
       WHERE id = $4`,
      [reference ?? null, b.note ?? null, user.id, id],
    );
    await client.query("UPDATE orders SET status = 'paid' WHERE id = $1", [
      orderId,
    ]);
    await enqueueOrder(client, cafeteriaId, orderId);
    await refreshDailyAnalytics(client, orderId);
  });
  sendSuccess(
    res,
    await fetchPayment("p.id", id, true),
    b.verified
      ? "Payment verified; order is now paid and queued"
      : "Payment rejected",
  );
});

export const listPayments = asyncHandler(async (req, res) => {
  const q = getQuery<ListPaymentsQuery>(req);
  const w = new Where();
  if (q.status) w.add("p.status = ?", q.status);
  if (q.method) w.add("p.payment_method = ?", q.method);
  if (q.cafeteriaId) w.add("o.cafeteria_id = ?", q.cafeteriaId);
  const { rows, total } = await pagedQuery({
    select: `${STAFF_COLS}, o.cafeteria_id, o.user_id, u.name AS customer_name`,
    from: "payments p JOIN orders o ON o.id = p.order_id JOIN users u ON u.id = o.user_id",
    where: w,
    orderBy: "p.created_at DESC, p.id DESC",
    page: q,
  });
  sendPage(res, rows, q, total, "Payments retrieved");
});
