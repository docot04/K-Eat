import { Router } from "express";
import {
  enqueueManually,
  getCafeteriaQueue,
  getOrderQueue,
  removeQueueEntry,
  reorderQueueItem,
} from "../controllers";
import { validate } from "../middlewares";
import {
  cafeteriaIdParam,
  cafeteriaOrderParam,
  orderIdParam,
  queueItemParam,
  reorderQueueItemSchema,
} from "../schemas";

// Mounted at /api
const router = Router();

router.get(
  "/cafeterias/:cafeteriaId/queue",
  validate({ params: cafeteriaIdParam }),
  getCafeteriaQueue,
);
router.get(
  "/orders/:orderId/queue",
  validate({ params: orderIdParam }),
  getOrderQueue,
);
router.post(
  "/cafeterias/:cafeteriaId/queue/orders/:orderId",
  validate({ params: cafeteriaOrderParam }),
  enqueueManually,
);
router.patch(
  "/queue/:queueItemId",
  validate({ params: queueItemParam, body: reorderQueueItemSchema }),
  reorderQueueItem,
);
router.delete(
  "/queue/:queueItemId",
  validate({ params: queueItemParam }),
  removeQueueEntry,
);

export default router;
