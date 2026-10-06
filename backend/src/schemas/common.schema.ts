import { z } from "zod";

export const positiveId = z.coerce
  .number()
  .int()
  .positive()
  .max(Number.MAX_SAFE_INTEGER);

export const pagination = {
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};
export const paginationSchema = z.object(pagination);

export const boolQuery = z
  .enum(["true", "false"])
  .transform((v) => v === "true");

export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date in YYYY-MM-DD format")
  .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), "Invalid date");

export const searchString = z.string().trim().min(1).max(100);

export const nonEmpty = (o: object): boolean =>
  Object.values(o).some((v) => v !== undefined);
export const nonEmptyMessage = {
  message: "At least one field must be provided",
};

export const idParam = z.object({ id: positiveId });
export const orderIdParam = z.object({ orderId: positiveId });
export const cafeteriaIdParam = z.object({ cafeteriaId: positiveId });
export const cafeteriaItemParam = z.object({
  cafeteriaId: positiveId,
  itemId: positiveId,
});
export const cafeteriaStaffParam = z.object({
  id: positiveId,
  staffId: positiveId,
});
export const cafeteriaOrderParam = z.object({
  cafeteriaId: positiveId,
  orderId: positiveId,
});
export const queueItemParam = z.object({ queueItemId: positiveId });
