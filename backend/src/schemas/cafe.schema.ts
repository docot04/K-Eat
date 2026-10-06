import { z } from "zod";
import {
  boolQuery,
  dateString,
  nonEmpty,
  nonEmptyMessage,
  pagination,
  searchString,
  positiveId,
} from "./common.schema";
import { ORDER_STATUSES, PAYMENT_METHODS } from "../consts";

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).nullable().optional(),
});
export type CreateCategoryBody = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(500).nullable().optional(),
  })
  .refine(nonEmpty, nonEmptyMessage);
export type UpdateCategoryBody = z.infer<typeof updateCategorySchema>;

export const listCafeteriasQuery = z.object({
  search: searchString.optional(),
  location: searchString.optional(),
  isOpen: boolQuery.optional(),
  ...pagination,
});
export type ListCafeteriasQuery = z.infer<typeof listCafeteriasQuery>;

export const listItemsQuery = z.object({
  search: searchString.optional(),
  categoryId: positiveId.optional(),
  includeInactive: boolQuery.optional(),
  ...pagination,
});
export type ListItemsQuery = z.infer<typeof listItemsQuery>;

export const createItemSchema = z.object({
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(1000).nullable().optional(),
  categoryId: positiveId,
  price: z.number().min(0).max(100000).multipleOf(0.01),
  image: z.string().trim().max(2048).nullable().optional(),
});
export type CreateItemBody = z.infer<typeof createItemSchema>;

export const updateItemSchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    categoryId: positiveId.optional(),
    price: z.number().min(0).max(100000).multipleOf(0.01).optional(),
    image: z.string().trim().max(2048).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(nonEmpty, nonEmptyMessage);
export type UpdateItemBody = z.infer<typeof updateItemSchema>;

export const menuQuerySchema = z.object({
  search: searchString.optional(),
  categoryId: positiveId.optional(),
  availableOnly: boolQuery.optional(),
});
export type MenuQuery = z.infer<typeof menuQuerySchema>;

export const inventoryQuerySchema = z.object({
  search: searchString.optional(),
  lowStock: boolQuery.optional(),
  available: boolQuery.optional(),
});
export type InventoryQuery = z.infer<typeof inventoryQuerySchema>;

export const addMenuItemSchema = z.object({
  itemId: positiveId,
  stock: z.number().int().min(0).max(100000).default(0),
  isAvailable: z.boolean().default(true),
  reorderLevel: z.number().int().min(0).max(100000).default(5),
});
export type AddMenuItemBody = z.infer<typeof addMenuItemSchema>;

export const updateMenuItemSchema = z
  .object({
    stock: z.number().int().min(0).max(100000).optional(),
    isAvailable: z.boolean().optional(),
    reorderLevel: z.number().int().min(0).max(100000).optional(),
  })
  .refine(nonEmpty, nonEmptyMessage);
export type UpdateMenuItemBody = z.infer<typeof updateMenuItemSchema>;

export const availabilitySchema = z.object({ isAvailable: z.boolean() });
export type AvailabilityBody = z.infer<typeof availabilitySchema>;

export const createOrderSchema = z.object({
  cafeteriaId: positiveId,
  items: z
    .array(
      z.object({
        itemId: positiveId,
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(30),
  pickupTime: z.string().datetime({ offset: true }),
  paymentMethod: z.enum(PAYMENT_METHODS).default("upi"),
});
export type CreateOrderBody = z.infer<typeof createOrderSchema>;

export const listOrdersQuery = z
  .object({
    status: z.enum(ORDER_STATUSES).optional(),
    cafeteriaId: positiveId.optional(),
    dateFrom: dateString.optional(),
    dateTo: dateString.optional(),
    ...pagination,
  })
  .refine((q) => !q.dateFrom || !q.dateTo || q.dateFrom <= q.dateTo, {
    message: "dateFrom must not be after dateTo",
  });
export type ListOrdersQuery = z.infer<typeof listOrdersQuery>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(["preparing", "ready", "collected", "cancelled"]),
});
export type UpdateOrderStatusBody = z.infer<typeof updateOrderStatusSchema>;

export const reorderQueueItemSchema = z.object({ position: positiveId });
export type ReorderQueueItemBody = z.infer<typeof reorderQueueItemSchema>;

export const createCafeteriaSchema = z.object({
  name: z.string().trim().min(2).max(150),
  location: z.string().trim().min(2).max(200),
  image: z.string().trim().max(2048).nullable().optional(),
  isOpen: z.boolean().default(false),
  paymentInstructions: z.string().trim().max(1000).nullable().optional(),
});
export type CreateCafeteriaBody = z.infer<typeof createCafeteriaSchema>;

export const updateCafeteriaSchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),
    location: z.string().trim().min(2).max(200).optional(),
    image: z.string().trim().max(2048).nullable().optional(),
    paymentInstructions: z.string().trim().max(1000).nullable().optional(),
  })
  .refine(nonEmpty, nonEmptyMessage);
export type UpdateCafeteriaBody = z.infer<typeof updateCafeteriaSchema>;

export const cafeteriaStatusSchema = z.object({ isOpen: z.boolean() });
export type CafeteriaStatusBody = z.infer<typeof cafeteriaStatusSchema>;

export const analyticsQuerySchema = z
  .object({ from: dateString.optional(), to: dateString.optional() })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: "from must not be after to",
  });
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
