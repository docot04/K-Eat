import cors from "cors";
import express from "express";
import { pool, ENV } from "./config";
import { asyncHandler } from "./utils";
import { authenticate, errorHandler, notFoundHandler } from "./middlewares";
import * as Router from "./routes";

const app = express();

app.disable("x-powered-by");
app.use(
  cors({
    origin: ENV.clientUrl.split(",").map((s) => s.trim()),
    credentials: true,
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});

// public routes
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "K-Eat API is running",
    data: { status: "ok" },
  });
});
app.get(
  "/api/health/db",
  asyncHandler(async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({
        success: true,
        message: "Database reachable",
        data: { database: "ok" },
      });
    } catch (err) {
      console.error("Database health check failed:", err);
      res.status(503).json({ success: false, message: "Database unreachable" });
    }
  }),
);
app.use("/api/auth", Router.AuthRouter);

// protected routes (requires a valid JWT)
app.use("/api", authenticate);
app.use("/api/users", Router.UserRouter);
app.use(
  "/api/cafeterias",
  Router.CafeteriaRouter,
  Router.StaffRouter,
  Router.MenuRouter,
);
app.use("/api/categories", Router.CategoryRouter);
app.use("/api/items", Router.ItemRouter);
app.use("/api/orders", Router.OrderRouter);
app.use("/api/analytics", Router.AnalyticsRouter);
app.use("/api/admin", Router.AdminRouter);
app.use("/api", Router.PaymentRouter, Router.QueueRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
