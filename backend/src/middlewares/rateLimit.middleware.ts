import { RequestHandler } from "express";
import { AppError } from "../utils";

// in-memory fixed-window limiter (per IP) for auth endpoints
export function rateLimit(max: number, windowMs: number): RequestHandler {
  const hits = new Map<string, { count: number; reset: number }>();
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.reset < now) hits.delete(key);
  }, windowMs);
  timer.unref();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip ?? "unknown";
    const entry = hits.get(key);
    if (!entry || entry.reset < now) {
      hits.set(key, { count: 1, reset: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      res.setHeader(
        "Retry-After",
        String(Math.ceil((entry.reset - now) / 1000)),
      );
      return next(
        new AppError(429, "Too many requests, please try again later"),
      );
    }
    next();
  };
}
