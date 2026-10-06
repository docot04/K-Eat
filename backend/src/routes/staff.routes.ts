import { Router } from "express";
import {
  assignStaff,
  listStaff,
  removeStaff,
  updateStaff,
} from "../controllers";
import { validate } from "../middlewares";
import {
  cafeteriaStaffParam,
  idParam,
  assignStaffSchema,
  listStaffQuery,
  updateStaffSchema,
} from "../schemas";

const router = Router();

router.get(
  "/:id/staff",
  validate({ params: idParam, query: listStaffQuery }),
  listStaff,
);
router.post(
  "/:id/staff",
  validate({ params: idParam, body: assignStaffSchema }),
  assignStaff,
);
router.patch(
  "/:id/staff/:staffId",
  validate({ params: cafeteriaStaffParam, body: updateStaffSchema }),
  updateStaff,
);
router.delete(
  "/:id/staff/:staffId",
  validate({ params: cafeteriaStaffParam }),
  removeStaff,
);

export default router;
