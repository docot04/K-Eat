import { query, withTransaction } from "../config";
import type { ReorderQueueItemBody } from "../schemas";
import {
  AppError,
  asyncHandler,
  authUser,
  getBody,
  getParams,
  notFound,
  sendSuccess,
  getOrderAccess,
  requireCafeteriaAccess,
  QUEUE_POSITION_SQL,
  enqueueOrder,
  moveQueueItem,
  removeFromQueue,
} from "../utils";

export const getCafeteriaQueue = asyncHandler(async (req, res) => {
  const { cafeteriaId } = getParams<{ cafeteriaId: number }>(req);
  await requireCafeteriaAccess(authUser(req), cafeteriaId, "staff");
  const queue = await query(
    "SELECT id, cafeteria_id, is_active, updated_at FROM queue WHERE cafeteria_id = $1",
    [cafeteriaId],
  );
  const items = await query(
    `SELECT qi.id AS queue_item_id, qi.position, qi.order_id, o.status AS order_status, o.pickup_time,
            o.total_amount, u.name AS customer_name, qi.created_at AS queued_at,
            (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
     FROM queue_items qi
     JOIN queue q ON q.id = qi.queue_id
     JOIN orders o ON o.id = qi.order_id
     JOIN users u ON u.id = o.user_id
     WHERE q.cafeteria_id = $1 ORDER BY qi.position`,
    [cafeteriaId],
  );
  sendSuccess(
    res,
    { queue: queue.rows[0] ?? null, items: items.rows },
    "Queue retrieved",
  );
});

export const getOrderQueue = asyncHandler(async (req, res) => {
  const { orderId } = getParams<{ orderId: number }>(req);
  const { order } = await getOrderAccess(authUser(req), orderId);
  const { rows } = await query(QUEUE_POSITION_SQL, [orderId]);
  const q = rows[0];
  sendSuccess(
    res,
    {
      order_id: orderId,
      order_status: order.status,
      in_queue: Boolean(q),
      queue_item_id: q?.queue_item_id ?? null,
      position: q?.position ?? null,
      orders_ahead: q?.orders_ahead ?? null,
    },
    "Queue position retrieved",
  );
});

export const enqueueManually = asyncHandler(async (req, res) => {
  const { cafeteriaId, orderId } = getParams<{
    cafeteriaId: number;
    orderId: number;
  }>(req);
  await requireCafeteriaAccess(authUser(req), cafeteriaId, "staff");
  const entry = await withTransaction(async (client) => {
    const o = await client.query<{ status: string; cafeteria_id: number }>(
      "SELECT status, cafeteria_id FROM orders WHERE id = $1 FOR UPDATE",
      [orderId],
    );
    if (!o.rows[0] || o.rows[0].cafeteria_id !== cafeteriaId)
      throw notFound("Order");
    if (o.rows[0].status !== "paid") {
      throw new AppError(
        409,
        `Only paid orders can be queued (order is ${o.rows[0].status})`,
      );
    }
    const added = await enqueueOrder(client, cafeteriaId, orderId);
    if (!added) throw new AppError(409, "Order is already in the queue");
    return added;
  });
  sendSuccess(
    res,
    { queue_item_id: entry.id, order_id: orderId, position: entry.position },
    "Order added to queue",
    201,
  );
});

const loadQueueItem = async (queueItemId: number) => {
  const { rows } = await query<{
    id: number;
    queue_id: number;
    cafeteria_id: number;
  }>(
    "SELECT qi.id, qi.queue_id, q.cafeteria_id FROM queue_items qi JOIN queue q ON q.id = qi.queue_id WHERE qi.id = $1",
    [queueItemId],
  );
  if (!rows[0]) throw notFound("Queue item");
  return rows[0];
};

export const reorderQueueItem = asyncHandler(async (req, res) => {
  const { queueItemId } = getParams<{ queueItemId: number }>(req);
  const { position } = getBody<ReorderQueueItemBody>(req);
  const item = await loadQueueItem(queueItemId);
  await requireCafeteriaAccess(authUser(req), item.cafeteria_id, "staff");
  await withTransaction((client) =>
    moveQueueItem(client, item.queue_id, queueItemId, position),
  );
  const { rows } = await query(
    "SELECT id AS queue_item_id, order_id, position FROM queue_items WHERE id = $1",
    [queueItemId],
  );
  if (!rows[0]) throw notFound("Queue item");
  sendSuccess(res, rows[0], "Queue item moved");
});

export const removeQueueEntry = asyncHandler(async (req, res) => {
  const { queueItemId } = getParams<{ queueItemId: number }>(req);
  const item = await loadQueueItem(queueItemId);
  await requireCafeteriaAccess(authUser(req), item.cafeteria_id, "staff");
  await withTransaction(async (client) => {
    const found = await client.query<{ order_id: number }>(
      "SELECT order_id FROM queue_items WHERE id = $1",
      [queueItemId],
    );
    if (found.rows[0]) await removeFromQueue(client, found.rows[0].order_id);
  });
  sendSuccess(
    res,
    { queue_item_id: queueItemId, removed: true },
    "Queue entry removed",
  );
});
