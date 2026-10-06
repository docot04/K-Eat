import { NextFunction, Request, RequestHandler, Response } from "express";
import type { AuthUser } from "../types/auth";

export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFound = (what: string): AppError =>
  new AppError(404, `${what} not found`);

type AsyncHandlerFn = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

export const asyncHandler =
  (fn: AsyncHandlerFn): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export const hasPgCode = (err: unknown, code: string): boolean =>
  typeof err === "object" &&
  err !== null &&
  (err as { code?: string }).code === code;

export const authUser = (req: Request): AuthUser => {
  if (!req.user) throw new AppError(401, "Authentication required");
  return req.user;
};

export const getParams = <T>(req: Request): T => req.params as unknown as T;
export const getQuery = <T>(req: Request): T => req.query as unknown as T;
export const getBody = <T>(req: Request): T => req.body as T;

export const sendSuccess = (
  res: Response,
  data: unknown,
  message = "OK",
  status = 200,
): void => {
  res.status(status).json({ success: true, message, data });
};

export interface PageQuery {
  page: number;
  limit: number;
}

export const sendPage = (
  res: Response,
  items: unknown[],
  page: PageQuery,
  total: number,
  message = "OK",
): void => {
  sendSuccess(
    res,
    {
      items,
      pagination: {
        page: page.page,
        limit: page.limit,
        total,
        totalPages: Math.ceil(total / page.limit),
      },
    },
    message,
  );
};
