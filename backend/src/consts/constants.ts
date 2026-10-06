export const USER_ROLES = ["student", "staff", "cafe_staff", "admin"] as const;
export const ORDER_STATUSES = [
  "not_paid",
  "paid",
  "preparing",
  "ready",
  "collected",
  "cancelled",
] as const;
export const PAYMENT_METHODS = ["card", "cash", "upi"] as const;
export const PAYMENT_STATUSES = [
  "pending",
  "success",
  "failed",
  "refunded",
] as const;
export const USER_COLS =
  "id, name, email, phone, role, is_active, created_at, updated_at";
export const PAID_STATUSES_SQL = "('paid','preparing','ready','collected')";
