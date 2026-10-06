import { Router } from "express";
import { getCafeteriaAnalytics } from "../controllers";
import { validate } from "../middlewares";
import { analyticsQuerySchema, cafeteriaIdParam } from "../schemas";

const router = Router();

router.get(
  "/:cafeteriaId",
  validate({ params: cafeteriaIdParam, query: analyticsQuerySchema }),
  getCafeteriaAnalytics,
);

export default router;
