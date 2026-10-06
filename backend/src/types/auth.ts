export type Role = "student" | "staff" | "cafe_staff" | "admin";
export type CafeRole = "staff" | "manager";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}
