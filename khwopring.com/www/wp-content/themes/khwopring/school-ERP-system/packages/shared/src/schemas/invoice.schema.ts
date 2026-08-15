import { z } from "zod";

export const generateInvoiceSchema = z.object({
  studentId: z.string().min(1),
  academicSessionId: z.string().min(1),
  dueDate: z.coerce.date(),
  feeStructureIds: z.array(z.string().min(1)).min(1),
  installments: z
    .array(z.object({ dueDate: z.coerce.date(), amount: z.coerce.number().positive() }))
    .optional(),
});
export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>;

export const invoiceSearchSchema = z.object({
  studentId: z.string().optional(),
  status: z.string().optional(),
});
export type InvoiceSearchInput = z.infer<typeof invoiceSearchSchema>;
