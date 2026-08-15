import type { Request, Response } from "express";
import * as feeService from "./fee.service";
import { asyncHandler } from "../../middleware/asyncHandler";
import { recordAudit } from "../../lib/audit";

export const createFeeCategory = asyncHandler(async (req: Request, res: Response) => {
  const feeCategory = await feeService.createFeeCategory(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE_FEE_CATEGORY", resource: "fee_category", resourceId: feeCategory.id });
  res.status(201).json({ feeCategory });
});

export const listFeeCategories = asyncHandler(async (req: Request, res: Response) => {
  const feeCategories = await feeService.listFeeCategories(req.user!.schoolId);
  res.json({ feeCategories });
});

export const createFeeStructure = asyncHandler(async (req: Request, res: Response) => {
  const feeStructure = await feeService.createFeeStructure(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE_FEE_STRUCTURE", resource: "fee_structure", resourceId: feeStructure.id });
  res.status(201).json({ feeStructure });
});

export const listFeeStructures = asyncHandler(async (req: Request, res: Response) => {
  const { classId, academicSessionId } = req.query as Record<string, string>;
  const feeStructures = await feeService.listFeeStructures(req.user!.schoolId, { classId, academicSessionId });
  res.json({ feeStructures });
});

export const createDiscount = asyncHandler(async (req: Request, res: Response) => {
  const discount = await feeService.createDiscount(req.user!.schoolId, req.user!.id, req.body);
  await recordAudit({ req, action: "CREATE_DISCOUNT", resource: "discount", resourceId: discount.id });
  res.status(201).json({ discount });
});

export const listDiscounts = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.query as Record<string, string>;
  const discounts = await feeService.listDiscounts(req.user!.schoolId, studentId);
  res.json({ discounts });
});

export const createScholarship = asyncHandler(async (req: Request, res: Response) => {
  const scholarship = await feeService.createScholarship(req.user!.schoolId, req.user!.id, req.body);
  await recordAudit({ req, action: "CREATE_SCHOLARSHIP", resource: "scholarship", resourceId: scholarship.id });
  res.status(201).json({ scholarship });
});

export const listScholarships = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.query as Record<string, string>;
  const scholarships = await feeService.listScholarships(req.user!.schoolId, studentId);
  res.json({ scholarships });
});

export const createFine = asyncHandler(async (req: Request, res: Response) => {
  const fine = await feeService.createFine(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE_FINE", resource: "fine", resourceId: fine.id });
  res.status(201).json({ fine });
});

export const listFines = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.query as Record<string, string>;
  const fines = await feeService.listFines(req.user!.schoolId, studentId);
  res.json({ fines });
});

export const waiveFine = asyncHandler(async (req: Request, res: Response) => {
  const fine = await feeService.waiveFine(req.user!.schoolId, req.params.id);
  await recordAudit({ req, action: "WAIVE_FINE", resource: "fine", resourceId: fine.id });
  res.json({ fine });
});

export const markFinePaid = asyncHandler(async (req: Request, res: Response) => {
  const fine = await feeService.markFinePaid(req.user!.schoolId, req.params.id);
  await recordAudit({ req, action: "MARK_FINE_PAID", resource: "fine", resourceId: fine.id });
  res.json({ fine });
});
