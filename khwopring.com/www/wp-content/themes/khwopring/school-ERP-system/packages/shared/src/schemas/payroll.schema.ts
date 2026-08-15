import { z } from "zod";

const salaryComponentSchema = z.object({ name: z.string().min(1).max(80), amount: z.coerce.number().positive() });

export const createSalaryStructureSchema = z
  .object({
    teacherId: z.string().min(1).optional(),
    staffId: z.string().min(1).optional(),
    basicSalary: z.coerce.number().positive(),
    allowances: z.array(salaryComponentSchema).default([]),
    deductions: z.array(salaryComponentSchema).default([]),
  })
  .refine((v) => Boolean(v.teacherId) !== Boolean(v.staffId), {
    message: "Provide exactly one of teacherId or staffId",
  });
export type CreateSalaryStructureInput = z.infer<typeof createSalaryStructureSchema>;

export const addSalaryComponentSchema = salaryComponentSchema;
export type AddSalaryComponentInput = z.infer<typeof addSalaryComponentSchema>;

export const createPayrollRunSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});
export type CreatePayrollRunInput = z.infer<typeof createPayrollRunSchema>;
