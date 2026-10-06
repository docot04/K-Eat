import { query } from "../config";
import type { AuthUser } from "../types/auth";
import { AppError, notFound } from "./http.util";

export type CafeAccess = "admin" | "manager" | "staff";

export interface CafeteriaRef {
  id: number;
  name: string;
  is_open: boolean;
  is_active: boolean;
}

export type OrderRow = {
  id: number;
  user_id: number;
  cafeteria_id: number;
  total_amount: number;
  status: string;
  pickup_time: string;
  created_at: string;
};

export const assertCafeteriaExists = async (
  id: number,
): Promise<CafeteriaRef> => {
  const { rows } = await query<CafeteriaRef>(
    "SELECT id, name, is_open, is_active FROM cafeterias WHERE id = $1",
    [id],
  );
  if (!rows[0]) throw notFound("Cafeteria");
  return rows[0];
};

export const getCafeteriaRole = async (
  user: AuthUser,
  cafeteriaId: number,
): Promise<CafeAccess | null> => {
  if (user.role === "admin") return "admin";
  if (user.role !== "cafe_staff") return null;
  const { rows } = await query<{ role: "staff" | "manager" }>(
    "SELECT role FROM cafe_staff WHERE user_id = $1 AND cafeteria_id = $2",
    [user.id, cafeteriaId],
  );
  return rows[0]?.role ?? null;
};

export const requireCafeteriaAccess = async (
  user: AuthUser,
  cafeteriaId: number,
  level: "staff" | "manager",
): Promise<CafeAccess> => {
  await assertCafeteriaExists(cafeteriaId);
  const role = await getCafeteriaRole(user, cafeteriaId);
  if (!role || (level === "manager" && role === "staff")) {
    throw new AppError(
      403,
      "You do not have permission to perform this action for this cafeteria",
    );
  }
  return role;
};

export const assignedCafeteriaIds = async (
  userId: number,
): Promise<number[]> => {
  const { rows } = await query<{ cafeteria_id: number }>(
    "SELECT cafeteria_id FROM cafe_staff WHERE user_id = $1",
    [userId],
  );
  return rows.map((r) => r.cafeteria_id);
};

export const getOrderAccess = async (
  user: AuthUser,
  orderId: number,
): Promise<{ order: OrderRow; staffSide: boolean }> => {
  const { rows } = await query<OrderRow>(
    "SELECT id, user_id, cafeteria_id, total_amount, status, pickup_time, created_at FROM orders WHERE id = $1",
    [orderId],
  );
  const order = rows[0];
  if (!order) throw notFound("Order");
  if ((await getCafeteriaRole(user, order.cafeteria_id)) !== null)
    return { order, staffSide: true };
  if (order.user_id === user.id) return { order, staffSide: false };
  throw notFound("Order");
};
