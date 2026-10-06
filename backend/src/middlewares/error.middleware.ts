import { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { ENV } from "../config";
import { AppError } from "../utils";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, `Route ${req.method} ${req.originalUrl} not found`));
};

const PG_ERRORS: Record<string, [number, string]> = {
  "23505": [409, "A record with these values already exists"],
  "23503": [409, "The operation conflicts with related data"],
  "23514": [400, "A value violates a data constraint"],
  "22P02": [400, "Invalid value format"],
  "22003": [400, "Numeric value out of range"],
  "40001": [409, "Concurrent update conflict, please retry"],
  "40P01": [409, "Concurrent update conflict, please retry"],
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.status).json({
      success: false,
      message: err.message,
      ...(err.details !== undefined ? { errors: err.details } : {}),
    });
    return;
  }
  const code =
    typeof err === "object" && err !== null
      ? (err as { code?: unknown; type?: unknown }).code
      : undefined;
  const type =
    typeof err === "object" && err !== null
      ? (err as { type?: unknown }).type
      : undefined;
  if (type === "entity.parse.failed") {
    res.status(400).json({ success: false, message: "Malformed JSON body" });
    return;
  }
  if (type === "entity.too.large") {
    res.status(413).json({ success: false, message: "Request body too large" });
    return;
  }
  if (typeof code === "string" && PG_ERRORS[code]) {
    console.error(`[db error ${code}] ${req.method} ${req.originalUrl}:`, err);
    const [status, message] = PG_ERRORS[code];
    res.status(status).json({ success: false, message });
    return;
  }
  console.error(`[error] ${req.method} ${req.originalUrl}:`, err);
  res.status(500).json({
    success: false,
    message:
      ENV.nodeEnv === "production"
        ? "Internal server error"
        : "Internal server error (see server logs)",
  });
};
