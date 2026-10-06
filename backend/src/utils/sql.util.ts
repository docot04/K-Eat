import type { PoolClient } from "pg";
import { query } from "../config";
import type { PageQuery } from "./http.util";

export class Where {
  private conds: string[] = [];
  readonly values: unknown[] = [];
  add(cond: string, ...vals: unknown[]): this {
    const parts = cond.split("?");
    if (parts.length - 1 !== vals.length) {
      throw new Error(
        `Placeholder count (${parts.length - 1}) does not match value count (${vals.length})`,
      );
    }
    let out = parts[0] ?? "";
    vals.forEach((value, i) => {
      this.values.push(value);
      out += `$${this.values.length}${parts[i + 1] ?? ""}`;
    });
    this.conds.push(out);
    return this;
  }
  addRaw(cond: string): this {
    this.conds.push(cond);
    return this;
  }
  get clause(): string {
    return this.conds.length ? `WHERE ${this.conds.join(" AND ")}` : "";
  }
}

export const like = (s: string): string => `%${s.replace(/[\\%_]/g, "\\$&")}%`;

export const buildUpdate = (
  input: object,
  columnMap: Record<string, string>,
): { sets: string[]; values: unknown[] } => {
  const sets: string[] = [];
  const values: unknown[] = [];
  const src = input as Record<string, unknown>;
  for (const [key, column] of Object.entries(columnMap)) {
    if (src[key] !== undefined) {
      values.push(src[key]);
      sets.push(`${column} = $${values.length}`);
    }
  }
  return { sets, values };
};

export const pagedQuery = async (o: {
  select: string;
  from: string;
  countFrom?: string;
  where: Where;
  orderBy: string;
  page: PageQuery;
}): Promise<{
  rows: Record<string, unknown>[];
  total: number;
}> => {
  const count = await query<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM ${o.countFrom ?? o.from}
     ${o.where.clause}`,
    o.where.values,
  );
  const params = [...o.where.values];
  const limit = o.page.limit;
  const offset = (o.page.page - 1) * o.page.limit;
  params.push(limit, offset);
  const data = await query(
    `SELECT ${o.select}
     FROM ${o.from}
     ${o.where.clause}
     ORDER BY ${o.orderBy}
     LIMIT $${params.length - 1}
     OFFSET $${params.length}`,
    params,
  );
  const total = count.rows[0]?.count ?? 0;
  return {
    rows: data.rows,
    total,
  };
};

export const refreshDailyAnalytics = async (
  client: PoolClient,
  orderId: number,
): Promise<void> => {
  const { rows } = await client.query<{ cafeteria_id: number; day: string }>(
    `SELECT cafeteria_id, to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day FROM orders WHERE id = $1`,
    [orderId],
  );
  if (!rows[0]) return;
  await client.query(
    `INSERT INTO analytics (cafeteria_id, date, total_orders, total_revenue)
     SELECT $1::bigint, $2::date, COUNT(*), COALESCE(SUM(total_amount), 0)
     FROM orders
     WHERE cafeteria_id = $1::bigint
       AND (created_at AT TIME ZONE 'UTC')::date = $2::date
       AND status IN ('paid', 'preparing', 'ready', 'collected')
     ON CONFLICT (cafeteria_id, date)
     DO UPDATE SET total_orders = EXCLUDED.total_orders, total_revenue = EXCLUDED.total_revenue`,
    [rows[0].cafeteria_id, rows[0].day],
  );
};
