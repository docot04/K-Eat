import {
  Pool,
  type PoolClient,
  type QueryResult,
  type QueryResultRow,
  types,
} from "pg";
import { ENV } from "./env.config";

// BIGINT/COUNT: number, NUMERIC: number, DATE: 'YYYY-MM-DD' string
types.setTypeParser(20, (v: string) => parseInt(v, 10));
types.setTypeParser(1700, (v: string) => parseFloat(v));
types.setTypeParser(1082, (v: string) => v);

export const pool = new Pool({ connectionString: ENV.databaseUrl });

pool.on("error", (err: unknown) => {
  console.error("Unexpected PostgreSQL pool error:", err);
});

export const query = <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
  client?: PoolClient,
): Promise<QueryResult<T>> => {
  return client ? client.query<T>(text, params) : pool.query<T>(text, params);
};

export const withTransaction = async <T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("Rollback failed:", rollbackErr);
    }
    throw err;
  } finally {
    client.release();
  }
};
