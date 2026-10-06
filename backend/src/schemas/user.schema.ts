import { z } from "zod";
import { USER_ROLES } from "../consts";
import {
  boolQuery,
  nonEmpty,
  nonEmptyMessage,
  pagination,
  positiveId,
  searchString,
} from "./common.schema";

const passwordRule = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/\d/, "Password must contain a number");

const emailRule = z.string().trim().toLowerCase().email().max(255);

const phoneRule = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s-]{7,20}$/, "Invalid phone number");

const cafeRole = z.enum(["staff", "manager"]);

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: emailRule,
  password: passwordRule,
  phone: phoneRule.optional(),
  role: z.enum(["student", "staff"]).default("student"),
});
export type SignupBody = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: emailRule,
  password: z.string().min(1).max(128),
});
export type LoginBody = z.infer<typeof loginSchema>;

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    phone: phoneRule.nullable().optional(),
  })
  .refine(nonEmpty, nonEmptyMessage);
export type UpdateProfileBody = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordRule,
});
export type ChangePasswordBody = z.infer<typeof changePasswordSchema>;

export const adminListUsersQuery = z.object({
  search: searchString.optional(),
  role: z.enum(USER_ROLES).optional(),
  isActive: boolQuery.optional(),
  ...pagination,
});
export type AdminListUsersQuery = z.infer<typeof adminListUsersQuery>;

export const updateUserRoleSchema = z.object({ role: z.enum(USER_ROLES) });
export type UpdateUserRoleBody = z.infer<typeof updateUserRoleSchema>;

export const updateUserStatusSchema = z.object({ isActive: z.boolean() });
export type UpdateUserStatusBody = z.infer<typeof updateUserStatusSchema>;

export const listStaffQuery = z.object({
  role: cafeRole.optional(),
  ...pagination,
});
export type ListStaffQuery = z.infer<typeof listStaffQuery>;

export const assignStaffSchema = z
  .object({
    userId: positiveId.optional(),
    email: emailRule.optional(),
    role: cafeRole.default("staff"),
  })
  .refine((o) => (o.userId === undefined) !== (o.email === undefined), {
    message: "Provide exactly one of userId or email",
  });
export type AssignStaffBody = z.infer<typeof assignStaffSchema>;

export const updateStaffSchema = z.object({ role: cafeRole });
export type UpdateStaffBody = z.infer<typeof updateStaffSchema>;
