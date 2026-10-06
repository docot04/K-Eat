import { Router } from "express";
import {
  createItem,
  deleteItem,
  getItem,
  listItems,
  updateItem,
} from "../controllers";
import { requireRole, validate } from "../middlewares";
import {
  createItemSchema,
  listItemsQuery,
  updateItemSchema,
  idParam,
} from "../schemas";

const router = Router();

router.get("/", validate({ query: listItemsQuery }), listItems);
router.get("/:id", validate({ params: idParam }), getItem);
router.post(
  "/",
  requireRole("admin"),
  validate({ body: createItemSchema }),
  createItem,
);
router.patch(
  "/:id",
  requireRole("admin"),
  validate({ params: idParam, body: updateItemSchema }),
  updateItem,
);
router.delete(
  "/:id",
  requireRole("admin"),
  validate({ params: idParam }),
  deleteItem,
);

export default router;
