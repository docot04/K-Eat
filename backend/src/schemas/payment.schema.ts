import { z } from "zod";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "../consts";
import { pagination, positiveId } from "./common.schema";

const reference = z
  .string()
  .trim()
  .min(3)
  .max(100)
  .regex(
    /^[A-Za-z0-9._\/-]+$/,
    "Reference may only contain letters, digits and . _ / -",
  )
  .refine(
    (v) => !/^\d{13,19}$/.test(v),
    "Do not enter card numbers; enter the payment reference only",
  );

export const submitPaymentSchema = z.object({
  orderId: positiveId,
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  transactionId: reference.optional(),
});
export type SubmitPaymentBody = z.infer<typeof submitPaymentSchema>;

export const verifyPaymentSchema = z.object({
  verified: z.boolean(),
  transactionId: reference.optional(),
  note: z.string().trim().max(500).optional(),
});
export type VerifyPaymentBody = z.infer<typeof verifyPaymentSchema>;

export const listPaymentsQuery = z.object({
  status: z.enum(PAYMENT_STATUSES).optional(),
  method: z.enum(PAYMENT_METHODS).optional(),
  cafeteriaId: positiveId.optional(),
  ...pagination,
});
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuery>;
