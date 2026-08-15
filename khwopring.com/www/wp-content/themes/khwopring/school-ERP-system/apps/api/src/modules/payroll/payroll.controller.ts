import type { Request, Response } from "express";
import * as payrollService from "./payroll.service";
import { asyncHandler } from "../../middleware/asyncHandler";
import { recordAudit } from "../../lib/audit";

export const createSalaryStructure = asyncHandler(async (req: Request, res: Response) => {
  const salaryStructure = await payrollService.createSalaryStructure(req.user!.schoolId, req.body);
  await recordAudit({
    req,
    action: "CREATE_SALARY_STRUCTURE",
    resource: "salary_structure",
    resourceId: salaryStructure.id,
  });
  res.status(201).json({ salaryStructure });
});

export const listSalaryStructures = asyncHandler(async (req: Request, res: Response) => {
  const salaryStructures = await payrollService.listSalaryStructures(req.user!.schoolId);
  res.json({ salaryStructures });
});

export const getSalaryStructure = asyncHandler(async (req: Request, res: Response) => {
  const salaryStructure = await payrollService.getSalaryStructure(req.user!.schoolId, req.params.id);
  res.json({ salaryStructure });
});

export const addAllowance = asyncHandler(async (req: Request, res: Response) => {
  const salaryStructure = await payrollService.addSalaryComponent(req.user!.schoolId, req.params.id, "allowance", req.body);
  await recordAudit({ req, action: "ADD_ALLOWANCE", resource: "salary_structure", resourceId: req.params.id });
  res.status(201).json({ salaryStructure });
});

export const addDeduction = asyncHandler(async (req: Request, res: Response) => {
  const salaryStructure = await payrollService.addSalaryComponent(req.user!.schoolId, req.params.id, "deduction", req.body);
  await recordAudit({ req, action: "ADD_DEDUCTION", resource: "salary_structure", resourceId: req.params.id });
  res.status(201).json({ salaryStructure });
});

export const createPayrollRun = asyncHandler(async (req: Request, res: Response) => {
  const payrollRun = await payrollService.createOrRegeneratePayrollRun(req.user!.schoolId, req.body);
  await recordAudit({
    req,
    action: "GENERATE_PAYROLL_RUN",
    resource: "payroll_run",
    resourceId: payrollRun.id,
    metadata: { month: payrollRun.month, year: payrollRun.year, payslipCount: payrollRun.payslips.length },
  });
  res.status(201).json({ payrollRun });
});

export const listPayrollRuns = asyncHandler(async (req: Request, res: Response) => {
  const payrollRuns = await payrollService.listPayrollRuns(req.user!.schoolId);
  res.json({ payrollRuns });
});

export const getPayrollRun = asyncHandler(async (req: Request, res: Response) => {
  const payrollRun = await payrollService.getPayrollRun(req.user!.schoolId, req.params.id);
  res.json({ payrollRun });
});

export const processRun = asyncHandler(async (req: Request, res: Response) => {
  const payrollRun = await payrollService.processRun(req.user!.schoolId, req.params.id, req.user!.id);
  await recordAudit({ req, action: "PROCESS_PAYROLL_RUN", resource: "payroll_run", resourceId: payrollRun.id });
  res.json({ payrollRun });
});

export const markRunPaid = asyncHandler(async (req: Request, res: Response) => {
  const payrollRun = await payrollService.markRunPaid(req.user!.schoolId, req.params.id);
  await recordAudit({ req, action: "MARK_PAYROLL_RUN_PAID", resource: "payroll_run", resourceId: payrollRun.id });
  res.json({ payrollRun });
});

export const listMyPayslips = asyncHandler(async (req: Request, res: Response) => {
  const payslips = await payrollService.listMyPayslips(req.user!.schoolId, req.user!.id);
  res.json({ payslips });
});

export const getPayslip = asyncHandler(async (req: Request, res: Response) => {
  const payslip = await payrollService.getPayslipForCaller(
    req.user!.schoolId,
    { userId: req.user!.id, permissions: req.user!.permissions },
    req.params.id
  );
  res.json({ payslip });
});
