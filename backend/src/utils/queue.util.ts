import type { PoolClient } from "pg";

export const QUEUE_POSITION_SQL = `
  SELECT
    qi.id AS queue_item_id,
    qi.queue_id,
    qi.position,
    (
      SELECT COUNT(*)
      FROM queue_items x
      JOIN orders xo ON xo.id = x.order_id
      WHERE x.queue_id = qi.queue_id
        AND x.position < qi.position
        AND xo.status IN ('paid', 'preparing')
    ) AS orders_ahead
  FROM queue_items qi
  WHERE qi.order_id = $1
`;

export const lockQueue = async (
  client: PoolClient,
  cafeteriaId: number,
): Promise<number> => {
  await client.query(
    `INSERT INTO queue (cafeteria_id)
     VALUES ($1)
     ON CONFLICT (cafeteria_id) DO NOTHING`,
    [cafeteriaId],
  );
  const { rows } = await client.query<{ id: number }>(
    `SELECT id
     FROM queue
     WHERE cafeteria_id = $1
     FOR UPDATE`,
    [cafeteriaId],
  );
  const row = rows[0];
  if (!row) throw new Error(`Queue not found for cafeteria ${cafeteriaId}`);
  return row.id;
};

export const compactQueue = async (
  client: PoolClient,
  queueId: number,
): Promise<void> => {
  await client.query(
    `UPDATE queue_items qi
     SET position = r.rn
     FROM (
       SELECT
         id,
         ROW_NUMBER() OVER (ORDER BY position, id) AS rn
       FROM queue_items
       WHERE queue_id = $1
     ) r
     WHERE qi.id = r.id
       AND qi.position <> r.rn`,
    [queueId],
  );
};

// appends the order to the cafeteria queue, returns null if the order is already queued.
export const enqueueOrder = async (
  client: PoolClient,
  cafeteriaId: number,
  orderId: number,
): Promise<{ id: number; position: number } | null> => {
  const queueId = await lockQueue(client, cafeteriaId);
  const { rows } = await client.query<{
    id: number;
    position: number;
  }>(
    `INSERT INTO queue_items (
       queue_id,
       order_id,
       position
     )
     SELECT
       $1::bigint,
       $2::bigint,
       COALESCE(MAX(position), 0) + 1
     FROM queue_items
     WHERE queue_id = $1::bigint
     ON CONFLICT (order_id) DO NOTHING
     RETURNING id, position`,
    [queueId, orderId],
  );
  return rows[0] ?? null;
};

// removes the order from its queue (if present) and closes the gap
export const removeFromQueue = async (
  client: PoolClient,
  orderId: number,
): Promise<boolean> => {
  const found = await client.query<{ queue_id: number }>(
    `SELECT queue_id
     FROM queue_items
     WHERE order_id = $1`,
    [orderId],
  );
  const foundRow = found.rows[0];
  if (!foundRow) return false;
  const queueId = foundRow.queue_id;
  await client.query(
    `SELECT id
     FROM queue
     WHERE id = $1
     FOR UPDATE`,
    [queueId],
  );
  await client.query(
    `DELETE FROM queue_items
     WHERE order_id = $1`,
    [orderId],
  );
  await compactQueue(client, queueId);
  return true;
};

// Moves a queue item to a new position (clamped), shifting the other queue items accordingly.
export const moveQueueItem = async (
  client: PoolClient,
  queueId: number,
  queueItemId: number,
  newPosition: number,
): Promise<void> => {
  await client.query(
    `SELECT id
     FROM queue
     WHERE id = $1
     FOR UPDATE`,
    [queueId],
  );
  const cur = await client.query<{ position: number }>(
    `SELECT position
     FROM queue_items
     WHERE id = $1
       AND queue_id = $2`,
    [queueItemId, queueId],
  );
  const currentRow = cur.rows[0];
  if (!currentRow) return;
  const count = await client.query<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM queue_items
     WHERE queue_id = $1`,
    [queueId],
  );
  const countRow = count.rows[0];
  if (!countRow) throw new Error(`Failed to count queue items for ${queueId}`);
  const target = Math.min(Math.max(newPosition, 1), countRow.count);
  const from = currentRow.position;
  if (target === from) return;
  if (target < from) {
    await client.query(
      `UPDATE queue_items
       SET position = position + 1
       WHERE queue_id = $1
         AND position >= $2
         AND position < $3`,
      [queueId, target, from],
    );
  } else {
    await client.query(
      `UPDATE queue_items
       SET position = position - 1
       WHERE queue_id = $1
         AND position > $2
         AND position <= $3`,
      [queueId, from, target],
    );
  }
  await client.query(
    `UPDATE queue_items
     SET position = $1
     WHERE id = $2`,
    [target, queueItemId],
  );
};
