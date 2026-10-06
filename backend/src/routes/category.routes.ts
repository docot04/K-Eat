import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from "../controllers";
import { requireRole, validate } from "../middlewares";
import {
  createCategorySchema,
  updateCategorySchema,
  idParam,
} from "../schemas";

const router = Router();

router.get("/", listCategories);
router.get("/:id", validate({ params: idParam }), getCategory);
router.post(
  "/",
  requireRole("admin"),
  validate({ body: createCategorySchema }),
  createCategory,
);
router.patch(
  "/:id",
  requireRole("admin"),
  validate({ params: idParam, body: updateCategorySchema }),
  updateCategory,
);
router.delete(
  "/:id",
  requireRole("admin"),
  validate({ params: idParam }),
  deleteCategory,
);

export default router;
