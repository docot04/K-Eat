import app from "./app";
import { pool, ENV } from "./config";

const server = app.listen(ENV.port, () => {
  console.log(`K-Eat API listening on port ${ENV.port} (${ENV.nodeEnv})`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("unhandledRejection", (err) => console.error("Rejection:", err));
