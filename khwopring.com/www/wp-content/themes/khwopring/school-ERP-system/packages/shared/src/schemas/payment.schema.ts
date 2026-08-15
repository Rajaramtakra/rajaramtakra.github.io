import { z } from "zod";
import { PAYMENT_METHODS } from "../enums";

export const collectPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number().positive(),
  method: z.enum(PAYMENT_METHODS),
  transactionRef: z.string().max(120).optional(),
});
export type CollectPaymentInput = z.infer<typeof collectPaymentSchema>;
