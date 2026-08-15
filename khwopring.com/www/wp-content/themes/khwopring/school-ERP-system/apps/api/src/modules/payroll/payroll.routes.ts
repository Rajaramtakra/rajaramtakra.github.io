import { Router } from "express";
import { addSalaryComponentSchema, createPayrollRunSchema, createSalaryStructureSchema } from "@erp/shared";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import * as controller from "./payroll.controller";

export const payrollRouter = Router();
payrollRouter.use(requireAuth);

/**
 * @openapi
 * tags:
 *   name: Payroll
 *   description: Salary structures, payroll run generation, and payslips
 */

payrollRouter.get("/structures", requirePermission("payroll:manage"), controller.listSalaryStructures);

payrollRouter.post(
  "/structures",
  requirePermission("payroll:manage"),
  validateBody(createSalaryStructureSchema),
  controller.createSalaryStructure
);

payrollRouter.get("/structures/:id", requirePermission("payroll:manage"), controller.getSalaryStructure);

payrollRouter.post(
  "/structures/:id/allowances",
  requirePermission("payroll:manage"),
  validateBody(addSalaryComponentSchema),
  controller.addAllowance
);

payrollRouter.post(
  "/structures/:id/deductions",
  requirePermission("payroll:manage"),
  validateBody(addSalaryComponentSchema),
  controller.addDeduction
);

payrollRouter.get("/runs", requirePermission("payroll:manage"), controller.listPayrollRuns);

payrollRouter.post(
  "/runs",
  requirePermission("payroll:manage"),
  validateBody(createPayrollRunSchema),
  controller.createPayrollRun
);

payrollRouter.get("/runs/:id", requirePermission("payroll:manage"), controller.getPayrollRun);

payrollRouter.post("/runs/:id/process", requirePermission("payroll:manage"), controller.processRun);

payrollRouter.post("/runs/:id/mark-paid", requirePermission("payroll:manage"), controller.markRunPaid);

// NOTE: "/payslips/mine" must be registered before "/payslips/:id" so it isn't swallowed by the param route.
payrollRouter.get("/payslips/mine", requirePermission("payroll:read_own"), controller.listMyPayslips);

payrollRouter.get(
  "/payslips/:id",
  requirePermission("payroll:manage", "payroll:read_own"),
  controller.getPayslip
);
