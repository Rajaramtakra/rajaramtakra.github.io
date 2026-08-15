import { z } from "zod";

/** Mirrors the Prisma PaymentMethod enum, already used by fees/invoices. Kept local per module convention. */
export const SALE_PAYMENT_METHODS = ["CASH", "CARD", "BANK_TRANSFER", "CHEQUE", "ONLINE"] as const;
export type SalePaymentMethod = (typeof SALE_PAYMENT_METHODS)[number];

export const createSaleSchema = z.object({
  counterpartyId: z.string().min(1).optional(),
  items: z
    .array(
      z.object({
        inventoryItemId: z.string().min(1),
        description: z.string().min(1).max(200),
        quantity: z.coerce.number().int().positive(),
        unitPrice: z.coerce.number().nonnegative(),
      })
    )
    .min(1),
});
export type CreateSaleInput = z.infer<typeof createSaleSchema>;

export const collectSalePaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  method: z.enum(SALE_PAYMENT_METHODS),
  transactionRef: z.string().max(120).optional(),
});
export type CollectSalePaymentInput = z.infer<typeof collectSalePaymentSchema>;

export const saleSearchSchema = z.object({
  status: z.enum(["DRAFT", "COMPLETED", "CANCELLED", "REFUNDED"]).optional(),
});
export type SaleSearchInput = z.infer<typeof saleSearchSchema>;
