import { RequestHandler } from "express";
import { verify } from "jsonwebtoken";
import { query, ENV } from "../config";
import type { Role } from "../types/auth";
import { AppError, asyncHandler } from "../utils";

export const authenticate: RequestHandler = asyncHandler(
  async (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer "))
      throw new AppError(401, "Authentication required");
    let userId = NaN;
    try {
      const payload = verify(header.slice(7), ENV.jwtSecret);
      if (typeof payload === "object" && payload.sub)
        userId = Number(payload.sub);
    } catch {
      throw new AppError(401, "Invalid or expired token");
    }
    if (!Number.isInteger(userId)) throw new AppError(401, "Invalid token");
    const { rows } = await query<{
      id: number;
      name: string;
      email: string;
      role: Role;
      is_active: boolean;
    }>("SELECT id, name, email, role, is_active FROM users WHERE id = $1", [
      userId,
    ]);
    const user = rows[0];
    if (!user || !user.is_active) throw new AppError(401, "Account not found");
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    next();
  },
);

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new AppError(401, "Authentication required"));
    if (!roles.includes(req.user.role))
      return next(
        new AppError(403, "You do not have permission to perform this action"),
      );
    next();
  };
