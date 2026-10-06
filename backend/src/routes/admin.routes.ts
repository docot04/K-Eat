import { Router } from "express";
import {
  getUser,
  listUsers,
  updateUserRole,
  updateUserStatus,
  getSystemAnalytics,
  listOrders,
  listPayments,
} from "../controllers";
import { requireRole, validate } from "../middlewares";
import {
  analyticsQuerySchema,
  idParam,
  listOrdersQuery,
  adminListUsersQuery,
  updateUserRoleSchema,
  updateUserStatusSchema,
  listPaymentsQuery,
} from "../schemas";

const router = Router();
router.use(requireRole("admin"));

router.get("/users", validate({ query: adminListUsersQuery }), listUsers);
router.get("/users/:id", validate({ params: idParam }), getUser);
router.patch(
  "/users/:id/role",
  validate({ params: idParam, body: updateUserRoleSchema }),
  updateUserRole,
);
router.patch(
  "/users/:id/status",
  validate({ params: idParam, body: updateUserStatusSchema }),
  updateUserStatus,
);
router.get(
  "/analytics",
  validate({ query: analyticsQuerySchema }),
  getSystemAnalytics,
);
router.get("/orders", validate({ query: listOrdersQuery }), listOrders);
router.get("/payments", validate({ query: listPaymentsQuery }), listPayments);

export default router;
