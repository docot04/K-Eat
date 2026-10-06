import type { PoolClient } from "pg";
import { query, withTransaction } from "../config";
import type {
  CreateOrderBody,
  ListOrdersQuery,
  UpdateOrderStatusBody,
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
  sendSuccess,
  assignedCafeteriaIds,
  getOrderAccess,
  refreshDailyAnalytics,
  QUEUE_POSITION_SQL,
  removeFromQueue,
  Where,
  pagedQuery,
} from "../utils";

const MAX_PICKUP_DAYS = 7;
const MAX_QTY_PER_ITEM = 20;

// not_paid -> paid happens only through payment verification (PATCH /payments/:id/verify).
const TRANSITIONS: Record<string, string[]> = {
  not_paid: ["cancelled"],
  paid: ["preparing", "cancelled"],
  preparing: ["ready"],
  ready: ["collected"],
  collected: [],
  cancelled: [],
};

export const getOrderDetail = async (
  orderId: number,
  staffSide: boolean,
  client?: PoolClient,
) => {
  const orderRes = await query(
    `SELECT o.id, o.user_id, o.cafeteria_id, c.name AS cafeteria_name, o.total_amount, o.status,
            o.pickup_time, o.created_at, o.updated_at, u.name AS customer_name, u.email AS customer_email
     FROM orders o JOIN cafeterias c ON c.id = o.cafeteria_id JOIN users u ON u.id = o.user_id
     WHERE o.id = $1`,
    [orderId],
    client,
  );
  if (!orderRes.rows[0]) throw notFound("Order");
  const items = await query(
    `SELECT oi.item_id, i.name, oi.quantity, oi.unit_price, (oi.quantity * oi.unit_price) AS line_total
     FROM order_items oi JOIN items i ON i.id = oi.item_id WHERE oi.order_id = $1 ORDER BY oi.id`,
    [orderId],
    client,
  );
  const payment = await query(
    `SELECT id, order_id, payment_method, amount, status, transaction_id, verified_at, created_at, updated_at
            ${staffSide ? ", staff_note, verified_by" : ""}
     FROM payments WHERE order_id = $1`,
    [orderId],
    client,
  );
  const queue = await query(QUEUE_POSITION_SQL, [orderId], client);
  const q = queue.rows[0];
  return {
    ...orderRes.rows[0],
    items: items.rows,
    payment: payment.rows[0] ?? null,
    queue: q
      ? {
          queue_item_id: q.queue_item_id,
          position: q.position,
          orders_ahead: q.orders_ahead,
        }
      : null,
  };
};

export const createOrder = asyncHandler(async (req, res) => {
  const user = authUser(req);
  const b = getBody<CreateOrderBody>(req);
  const pickup = new Date(b.pickupTime);
  const now = Date.now();
  if (pickup.getTime() <= now)
    throw new AppError(400, "Pickup time must be in the future");
  if (pickup.getTime() > now + MAX_PICKUP_DAYS * 86_400_000) {
    throw new AppError(
      400,
      `Pickup time must be within the next ${MAX_PICKUP_DAYS} days`,
    );
  }
  const wanted = new Map<number, number>();
  for (const it of b.items)
    wanted.set(it.itemId, (wanted.get(it.itemId) ?? 0) + it.quantity);
  for (const qty of wanted.values()) {
    if (qty > MAX_QTY_PER_ITEM)
      throw new AppError(
        400,
        `At most ${MAX_QTY_PER_ITEM} of one item per order`,
      );
  }
  const itemIds = [...wanted.keys()].sort((a, c) => a - c);
  type MenuLock = {
    item_id: number;
    stock: number;
    is_available: boolean;
    name: string;
    price: number;
    is_active: boolean;
  };
  const orderId = await withTransaction(async (client) => {
    const cafe = await client.query<{ is_open: boolean; is_active: boolean }>(
      "SELECT is_open, is_active FROM cafeterias WHERE id = $1",
      [b.cafeteriaId],
    );
    if (!cafe.rows[0]) throw notFound("Cafeteria");
    if (!cafe.rows[0].is_active || !cafe.rows[0].is_open)
      throw new AppError(409, "This cafeteria is currently closed");

    // Row locks (in item_id order, to avoid deadlocks) serialize competing orders for the same stock.
    const locked = await client.query<MenuLock>(
      `SELECT m.item_id, m.stock, m.is_available, i.name, i.price, i.is_active
       FROM cafeteria_menu m JOIN items i ON i.id = m.item_id
       WHERE m.cafeteria_id = $1 AND m.item_id = ANY($2::bigint[])
       ORDER BY m.item_id FOR UPDATE OF m`,
      [b.cafeteriaId, itemIds],
    );
    const menu = new Map<number, MenuLock>(
      locked.rows.map((r) => [r.item_id, r] as [number, MenuLock]),
    );
    const problems: string[] = [];
    let totalCents = 0;
    const qtys: number[] = [];
    const prices: number[] = [];
    for (const itemId of itemIds) {
      const qty = wanted.get(itemId) as number;
      const row = menu.get(itemId);
      if (!row || !row.is_active)
        problems.push(`Item ${itemId} is not on this cafeteria's menu`);
      else if (!row.is_available)
        problems.push(`${row.name} is currently unavailable`);
      else if (row.stock < qty)
        problems.push(`Only ${row.stock} of ${row.name} left`);
      else {
        totalCents += Math.round(row.price * 100) * qty;
        qtys.push(qty);
        prices.push(row.price);
      }
    }
    if (problems.length)
      throw new AppError(409, "Some items cannot be ordered", problems);
    const order = await client.query<{ id: number }>(
      "INSERT INTO orders (user_id, cafeteria_id, total_amount, pickup_time) VALUES ($1, $2, $3, $4) RETURNING id",
      [user.id, b.cafeteriaId, totalCents / 100, pickup],
    );
    const createdOrder = order.rows[0];
    if (!createdOrder) throw new AppError(500, "Failed to create order");
    const id = createdOrder.id;
    await client.query(
      `INSERT INTO order_items (order_id, item_id, quantity, unit_price)
       SELECT $1::bigint, v.item_id, v.qty, v.price FROM unnest($2::bigint[], $3::int[], $4::numeric[]) AS v(item_id, qty, price)`,
      [id, itemIds, qtys, prices],
    );
    await client.query(
      `UPDATE cafeteria_menu cm SET stock = cm.stock - v.qty
       FROM unnest($2::bigint[], $3::int[]) AS v(item_id, qty)
       WHERE cm.cafeteria_id = $1 AND cm.item_id = v.item_id`,
      [b.cafeteriaId, itemIds, qtys],
    );
    await client.query(
      "INSERT INTO payments (order_id, payment_method, amount) VALUES ($1, $2, $3)",
      [id, b.paymentMethod, totalCents / 100],
    );
    // No queue entry yet: the order joins the queue only after staff verify the external payment.
    return id;
  });

  sendSuccess(
    res,
    await getOrderDetail(orderId, false),
    "Order placed. Pay externally and submit the payment reference.",
    201,
  );
});

export const listOrders = asyncHandler(async (req, res) => {
  const user = authUser(req);
  const q = getQuery<ListOrdersQuery>(req);
  const w = new Where();
  if (user.role === "admin") {
    // no scope restriction
  } else if (user.role === "cafe_staff") {
    w.add(
      "(o.user_id = ? OR o.cafeteria_id = ANY(?::bigint[]))",
      user.id,
      await assignedCafeteriaIds(user.id),
    );
  } else {
    w.add("o.user_id = ?", user.id);
  }
  if (q.status) w.add("o.status = ?", q.status);
  if (q.cafeteriaId) w.add("o.cafeteria_id = ?", q.cafeteriaId);
  if (q.dateFrom)
    w.add("o.created_at >= ?::timestamptz", `${q.dateFrom}T00:00:00Z`);
  if (q.dateTo)
    w.add(
      "o.created_at < ?::timestamptz",
      new Date(Date.parse(`${q.dateTo}T00:00:00Z`) + 86_400_000).toISOString(),
    );

  const { rows, total } = await pagedQuery({
    select: `o.id, o.user_id, u.name AS customer_name, o.cafeteria_id, c.name AS cafeteria_name, o.total_amount,
             o.status, o.pickup_time, o.created_at, p.status AS payment_status, p.payment_method`,
    from: `orders o JOIN users u ON u.id = o.user_id JOIN cafeterias c ON c.id = o.cafeteria_id
           LEFT JOIN payments p ON p.order_id = o.id`,
    countFrom: "orders o",
    where: w,
    orderBy: "o.created_at DESC, o.id DESC",
    page: q,
  });
  sendPage(res, rows, q, total, "Orders retrieved");
});

export const getOrder = asyncHandler(async (req, res) => {
  const { id } = getParams<{ id: number }>(req);
  const { staffSide } = await getOrderAccess(authUser(req), id);
  sendSuccess(res, await getOrderDetail(id, staffSide), "Order retrieved");
});

export const lockOrder = async (client: PoolClient, orderId: number) => {
  const { rows } = await client.query<{
    id: number;
    status: string;
    cafeteria_id: number;
  }>("SELECT id, status, cafeteria_id FROM orders WHERE id = $1 FOR UPDATE", [
    orderId,
  ]);
  if (!rows[0]) throw notFound("Order");
  return rows[0];
};

// cancels a locked order: restores stock, settles the payment record, leaves the queue
const cancelLockedOrder = async (
  client: PoolClient,
  order: { id: number; status: string; cafeteria_id: number },
) => {
  await client.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [
    order.id,
  ]);
  await client.query(
    `SELECT 1 FROM cafeteria_menu
     WHERE cafeteria_id = $1 AND item_id IN (SELECT item_id FROM order_items WHERE order_id = $2)
     ORDER BY item_id FOR UPDATE`,
    [order.cafeteria_id, order.id],
  );
  await client.query(
    `UPDATE cafeteria_menu cm SET stock = cm.stock + oi.quantity
     FROM order_items oi
     WHERE oi.order_id = $1 AND cm.cafeteria_id = $2 AND cm.item_id = oi.item_id`,
    [order.id, order.cafeteria_id],
  );
  // pending -> failed (nothing was verified), success -> refunded (recorded status only; refund happens externally)
  await client.query(
    `UPDATE payments SET status = CASE status
        WHEN 'success'::payment_status THEN 'refunded'::payment_status
        WHEN 'pending'::payment_status THEN 'failed'::payment_status
        ELSE status END
     WHERE order_id = $1`,
    [order.id],
  );
  await removeFromQueue(client, order.id);
  if (order.status === "paid") await refreshDailyAnalytics(client, order.id);
};

export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = getParams<{ id: number }>(req);
  const { staffSide } = await getOrderAccess(authUser(req), id);
  await withTransaction(async (client) => {
    const order = await lockOrder(client, id);
    if (!["not_paid", "paid"].includes(order.status)) {
      throw new AppError(
        409,
        `An order that is ${order.status} can no longer be cancelled`,
      );
    }
    await cancelLockedOrder(client, order);
  });
  sendSuccess(res, await getOrderDetail(id, staffSide), "Order cancelled");
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const user = authUser(req);
  const { id } = getParams<{ id: number }>(req);
  const { status } = getBody<UpdateOrderStatusBody>(req);
  const { staffSide } = await getOrderAccess(user, id);
  if (!staffSide) {
    throw new AppError(
      403,
      "Only cafeteria staff or admins can update order status",
    );
  }
  await withTransaction(async (client) => {
    const order = await lockOrder(client, id);
    const allowedTransitions = TRANSITIONS[order.status];
    if (!allowedTransitions) {
      throw new AppError(
        500,
        `No transition rules defined for order status: ${order.status}`,
      );
    }
    if (!allowedTransitions.includes(status)) {
      throw new AppError(
        409,
        `Invalid status transition: ${order.status} -> ${status}`,
      );
    }
    if (status === "cancelled") {
      await cancelLockedOrder(client, order);
      return;
    }
    await client.query("UPDATE orders SET status = $1 WHERE id = $2", [
      status,
      id,
    ]);
    if (status === "collected") {
      await removeFromQueue(client, id);
    }
  });
  sendSuccess(
    res,
    await getOrderDetail(id, true),
    `Order status updated to ${status}`,
  );
});
