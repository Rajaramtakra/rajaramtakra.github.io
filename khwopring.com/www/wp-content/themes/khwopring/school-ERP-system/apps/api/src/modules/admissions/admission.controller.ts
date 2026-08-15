import type { Request, Response } from "express";
import * as admissionService from "./admission.service";
import { asyncHandler } from "../../middleware/asyncHandler";
import { recordAudit } from "../../lib/audit";
import { BadRequestError } from "../../lib/errors";

export const createDraft = asyncHandler(async (req: Request, res: Response) => {
  const application = await admissionService.createDraft(req.user!.schoolId, req.user!.id, req.body);
  await recordAudit({ req, action: "CREATE_DRAFT", resource: "admission", resourceId: application.id });
  res.status(201).json({ application });
});

export const getApplication = asyncHandler(async (req: Request, res: Response) => {
  const application = await admissionService.getApplication(req.user!.schoolId, req.params.id);
  res.json({ application });
});

export const updateDraft = asyncHandler(async (req: Request, res: Response) => {
  const application = await admissionService.updateDraft(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "UPDATE", resource: "admission", resourceId: application.id });
  res.json({ application });
});

export const listApplications = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, search, sortBy, sortDir, status } = req.query as Record<string, string>;
  const result = await admissionService.listApplications(
    req.user!.schoolId,
    { page: Number(page), pageSize: Number(pageSize), search, sortBy, sortDir: sortDir as "asc" | "desc" },
    { status: status as never }
  );
  res.json(result);
});

export const submit = asyncHandler(async (req: Request, res: Response) => {
  const application = await admissionService.submit(req.user!.schoolId, req.params.id);
  await recordAudit({ req, action: "SUBMIT", resource: "admission", resourceId: application.id });
  res.json({ application });
});

export const moveToReview = asyncHandler(async (req: Request, res: Response) => {
  const application = await admissionService.moveToReview(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "REVIEW", resource: "admission", resourceId: application.id });
  res.json({ application });
});

export const decide = asyncHandler(async (req: Request, res: Response) => {
  const application = await admissionService.decide(req.user!.schoolId, req.params.id, req.user!.id, req.body);
  await recordAudit({ req, action: "DECIDE", resource: "admission", resourceId: application.id, metadata: req.body });
  res.json({ application });
});

export const enroll = asyncHandler(async (req: Request, res: Response) => {
  const student = await admissionService.enroll(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "ENROLL", resource: "admission", resourceId: req.params.id, metadata: { studentId: student.id } });
  res.status(201).json({ student });
});

export const uploadDocument = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new BadRequestError("A file is required");
  const document = await admissionService.uploadDocument(
    req.user!.schoolId,
    req.params.id,
    req.user!.id,
    req.body.category,
    req.file
  );
  await recordAudit({ req, action: "UPLOAD_DOCUMENT", resource: "admission", resourceId: req.params.id });
  res.status(201).json({ document });
});
