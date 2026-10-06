import { Router } from "express";
import {
  getOrderPayment,
  getPayment,
  submitPayment,
  verifyPayment,
} from "../controllers";
import { validate } from "../middlewares";
import {
  idParam,
  orderIdParam,
  submitPaymentSchema,
  verifyPaymentSchema,
} from "../schemas";

// Mounted at /api
const router = Router();

router.get(
  "/orders/:orderId/payment",
  validate({ params: orderIdParam }),
  getOrderPayment,
);
router.post(
  "/payments",
  validate({ body: submitPaymentSchema }),
  submitPayment,
);
router.get("/payments/:id", validate({ params: idParam }), getPayment);
router.patch(
  "/payments/:id/verify",
  validate({ params: idParam, body: verifyPaymentSchema }),
  verifyPayment,
);

export default router;
