import { query } from "../config";
import type { AnalyticsQuery } from "../schemas";
import { PAID_STATUSES_SQL } from "../consts";
import {
  AppError,
  asyncHandler,
  authUser,
  getParams,
  getQuery,
  sendSuccess,
  requireCafeteriaAccess,
} from "../utils";

const DAY_MS = 86_400_000;
const MAX_RANGE_DAYS = 366;

const resolveRange = (
  q: AnalyticsQuery,
): {
  from: string;
  to: string;
  fromTs: string;
  toExclusiveTs: string;
} => {
  const to = q.to ?? new Date().toISOString().slice(0, 10);
  const from =
    q.from ??
    new Date(Date.parse(`${to}T00:00:00Z`) - 29 * DAY_MS)
      .toISOString()
      .slice(0, 10);
  const days =
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS +
    1;
  if (days < 1) throw new AppError(400, "from must not be after to");
  if (days > MAX_RANGE_DAYS)
    throw new AppError(400, `Date range may not exceed ${MAX_RANGE_DAYS} days`);
  return {
    from,
    to,
    fromTs: `${from}T00:00:00Z`,
    toExclusiveTs: new Date(
      Date.parse(`${to}T00:00:00Z`) + DAY_MS,
    ).toISOString(),
  };
};

// cafeteriaId = null means system-wide
const buildAnalytics = async (
  cafeteriaId: number | null,
  q: AnalyticsQuery,
) => {
  const r = resolveRange(q);
  const scope = "($1::bigint IS NULL OR o.cafeteria_id = $1)";
  const orderParams = [cafeteriaId, r.fromTs, r.toExclusiveTs];
  const orderWindow = `${scope} AND o.created_at >= $2::timestamptz AND o.created_at < $3::timestamptz`;

  const [summary, popular, daily, lowStock] = await Promise.all([
    query(
      `SELECT COUNT(*) AS total_orders,
              COUNT(*) FILTER (WHERE o.status IN ${PAID_STATUSES_SQL}) AS paid_orders,
              COUNT(*) FILTER (WHERE o.status = 'collected') AS completed_orders,
              COUNT(*) FILTER (WHERE o.status = 'cancelled') AS cancelled_orders,
              COALESCE(SUM(o.total_amount) FILTER (WHERE o.status IN ${PAID_STATUSES_SQL}), 0) AS total_revenue
       FROM orders o WHERE ${orderWindow}`,
      orderParams,
    ),
    query(
      `SELECT i.id AS item_id, i.name, SUM(oi.quantity) AS quantity_sold, SUM(oi.quantity * oi.unit_price) AS revenue
       FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN items i ON i.id = oi.item_id
       WHERE ${orderWindow} AND o.status IN ${PAID_STATUSES_SQL}
       GROUP BY i.id, i.name ORDER BY quantity_sold DESC, i.name LIMIT 10`,
      orderParams,
    ),
    query(
      `SELECT date, SUM(total_orders) AS total_orders, SUM(total_revenue) AS total_revenue
       FROM analytics
       WHERE ($1::bigint IS NULL OR cafeteria_id = $1) AND date >= $2::date AND date <= $3::date
       GROUP BY date ORDER BY date`,
      [cafeteriaId, r.from, r.to],
    ),
    query(
      `SELECT m.cafeteria_id, c.name AS cafeteria_name, m.item_id, i.name AS item_name, m.stock, m.reorder_level
       FROM cafeteria_menu m JOIN items i ON i.id = m.item_id JOIN cafeterias c ON c.id = m.cafeteria_id
       WHERE ($1::bigint IS NULL OR m.cafeteria_id = $1) AND c.is_active = TRUE AND m.stock <= m.reorder_level
       ORDER BY (m.stock - m.reorder_level), c.name, i.name LIMIT 50`,
      [cafeteriaId],
    ),
  ]);

  const s: any = summary.rows[0];
  const averageOrderValue =
    s.paid_orders > 0
      ? Math.round((s.total_revenue / s.paid_orders) * 100) / 100
      : 0;
  const result: Record<string, unknown> = {
    cafeteria_id: cafeteriaId,
    range: { from: r.from, to: r.to },
    summary: { ...s, average_order_value: averageOrderValue },
    popular_items: popular.rows,
    daily: daily.rows,
    low_stock: lowStock.rows,
  };

  if (cafeteriaId === null) {
    const byCafe = await query(
      `SELECT c.id AS cafeteria_id, c.name, COUNT(o.id) AS total_orders,
              COUNT(o.id) FILTER (WHERE o.status IN ${PAID_STATUSES_SQL}) AS paid_orders,
              COALESCE(SUM(o.total_amount) FILTER (WHERE o.status IN ${PAID_STATUSES_SQL}), 0) AS total_revenue
       FROM cafeterias c
       LEFT JOIN orders o ON o.cafeteria_id = c.id AND o.created_at >= $1::timestamptz AND o.created_at < $2::timestamptz
       GROUP BY c.id, c.name ORDER BY c.name`,
      [r.fromTs, r.toExclusiveTs],
    );
    result.by_cafeteria = byCafe.rows;
  }
  return result;
};

export const getCafeteriaAnalytics = asyncHandler(async (req, res) => {
  const { cafeteriaId } = getParams<{ cafeteriaId: number }>(req);
  await requireCafeteriaAccess(authUser(req), cafeteriaId, "manager");
  sendSuccess(
    res,
    await buildAnalytics(cafeteriaId, getQuery<AnalyticsQuery>(req)),
    "Analytics retrieved",
  );
});

export const getSystemAnalytics = asyncHandler(async (req, res) => {
  sendSuccess(
    res,
    await buildAnalytics(null, getQuery<AnalyticsQuery>(req)),
    "System analytics retrieved",
  );
});
