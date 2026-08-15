import type { Request, Response } from "express";
import * as parentService from "./parent.service";
import { asyncHandler } from "../../middleware/asyncHandler";
import { recordAudit } from "../../lib/audit";

export const listMyChildren = asyncHandler(async (req: Request, res: Response) => {
  const children = await parentService.listMyChildren(req.user!.schoolId, req.user!.id);
  res.json({ children });
});

export const getChildAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { fromDate, toDate } = req.query as Record<string, string>;
  const records = await parentService.getChildAttendance(req.user!.schoolId, req.user!.id, req.params.studentId, {
    fromDate: fromDate ? new Date(fromDate) : undefined,
    toDate: toDate ? new Date(toDate) : undefined,
  });
  res.json({ records });
});

export const getChildHomework = asyncHandler(async (req: Request, res: Response) => {
  const homework = await parentService.getChildHomework(req.user!.schoolId, req.user!.id, req.params.studentId);
  res.json({ homework });
});

export const getChildTimetable = asyncHandler(async (req: Request, res: Response) => {
  const entries = await parentService.getChildTimetable(req.user!.schoolId, req.user!.id, req.params.studentId);
  res.json({ entries });
});

export const enableGuardianPortalAccess = asyncHandler(async (req: Request, res: Response) => {
  const { guardian, temporaryPassword } = await parentService.enableGuardianPortalAccess(
    req.user!.schoolId,
    req.params.guardianId
  );
  await recordAudit({ req, action: "ENABLE_PARENT_PORTAL_ACCESS", resource: "guardian", resourceId: guardian.id });
  res.status(201).json({ guardian, temporaryPassword });
});
