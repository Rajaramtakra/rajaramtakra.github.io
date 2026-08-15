import { z } from "zod";
import { DISCOUNT_TYPES, FEE_FREQUENCIES } from "../enums";

export const createFeeCategorySchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
});
export type CreateFeeCategoryInput = z.infer<typeof createFeeCategorySchema>;

export const createFeeStructureSchema = z.object({
  classId: z.string().min(1),
  feeCategoryId: z.string().min(1),
  academicSessionId: z.string().min(1),
  amount: z.coerce.number().positive(),
  frequency: z.enum(FEE_FREQUENCIES),
});
export type CreateFeeStructureInput = z.infer<typeof createFeeStructureSchema>;

export const createDiscountSchema = z.object({
  studentId: z.string().min(1),
  feeStructureId: z.string().min(1).optional(),
  type: z.enum(DISCOUNT_TYPES),
  value: z.coerce.number().positive(),
  reason: z.string().min(3).max(500),
});
export type CreateDiscountInput = z.infer<typeof createDiscountSchema>;

export const createScholarshipSchema = z.object({
  studentId: z.string().min(1),
  name: z.string().min(1).max(150),
  amount: z.coerce.number().positive(),
  academicSessionId: z.string().min(1),
});
export type CreateScholarshipInput = z.infer<typeof createScholarshipSchema>;

export const createFineSchema = z.object({
  studentId: z.string().min(1),
  reason: z.string().min(3).max(500),
  amount: z.coerce.number().positive(),
});
export type CreateFineInput = z.infer<typeof createFineSchema>;
