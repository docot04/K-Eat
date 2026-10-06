import { Router } from "express";
import {
  createCafeteria,
  deleteCafeteria,
  getCafeteria,
  listCafeterias,
  setCafeteriaStatus,
  updateCafeteria,
} from "../controllers";
import { requireRole, validate } from "../middlewares";
import {
  cafeteriaStatusSchema,
  createCafeteriaSchema,
  listCafeteriasQuery,
  updateCafeteriaSchema,
  idParam,
} from "../schemas";

const router = Router();

router.get("/", validate({ query: listCafeteriasQuery }), listCafeterias);
router.post(
  "/",
  requireRole("admin"),
  validate({ body: createCafeteriaSchema }),
  createCafeteria,
);
router.get("/:id", validate({ params: idParam }), getCafeteria);
router.patch(
  "/:id",
  validate({ params: idParam, body: updateCafeteriaSchema }),
  updateCafeteria,
);
router.delete(
  "/:id",
  requireRole("admin"),
  validate({ params: idParam }),
  deleteCafeteria,
);
router.patch(
  "/:id/status",
  validate({ params: idParam, body: cafeteriaStatusSchema }),
  setCafeteriaStatus,
);

export default router;
