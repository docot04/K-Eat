import { Router } from "express";
import {
  cancelOrder,
  createOrder,
  getOrder,
  listOrders,
  updateOrderStatus,
} from "../controllers";
import { validate } from "../middlewares";
import {
  idParam,
  createOrderSchema,
  listOrdersQuery,
  updateOrderStatusSchema,
} from "../schemas";

const router = Router();

router.post("/", validate({ body: createOrderSchema }), createOrder);
router.get("/", validate({ query: listOrdersQuery }), listOrders);
router.get("/:id", validate({ params: idParam }), getOrder);
router.patch(
  "/:id/status",
  validate({ params: idParam, body: updateOrderStatusSchema }),
  updateOrderStatus,
);
router.patch("/:id/cancel", validate({ params: idParam }), cancelOrder);

export default router;
