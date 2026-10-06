import { Router } from "express";
import {
  addMenuItem,
  getInventory,
  getLowStock,
  getMenu,
  removeMenuItem,
  setAvailability,
  updateInventory,
  updateMenuItem,
} from "../controllers";
import { validate } from "../middlewares";
import {
  addMenuItemSchema,
  availabilitySchema,
  inventoryQuerySchema,
  menuQuerySchema,
  updateMenuItemSchema,
  cafeteriaIdParam,
  cafeteriaItemParam,
} from "../schemas";

// Mounted at /api/cafeterias
const router = Router();

router.get(
  "/:cafeteriaId/menu",
  validate({ params: cafeteriaIdParam, query: menuQuerySchema }),
  getMenu,
);
router.post(
  "/:cafeteriaId/menu",
  validate({ params: cafeteriaIdParam, body: addMenuItemSchema }),
  addMenuItem,
);
router.patch(
  "/:cafeteriaId/menu/:itemId",
  validate({ params: cafeteriaItemParam, body: updateMenuItemSchema }),
  updateMenuItem,
);
router.delete(
  "/:cafeteriaId/menu/:itemId",
  validate({ params: cafeteriaItemParam }),
  removeMenuItem,
);
router.patch(
  "/:cafeteriaId/menu/:itemId/availability",
  validate({ params: cafeteriaItemParam, body: availabilitySchema }),
  setAvailability,
);

router.get(
  "/:cafeteriaId/inventory",
  validate({ params: cafeteriaIdParam, query: inventoryQuerySchema }),
  getInventory,
);
router.get(
  "/:cafeteriaId/inventory/low-stock",
  validate({ params: cafeteriaIdParam }),
  getLowStock,
);
router.patch(
  "/:cafeteriaId/inventory/:itemId",
  validate({ params: cafeteriaItemParam, body: updateMenuItemSchema }),
  updateInventory,
);

export default router;
