import type { Request, Response } from "express";
import * as timetableService from "./timetable.service";
import * as teacherService from "../teachers/teacher.service";
import { asyncHandler } from "../../middleware/asyncHandler";
import { recordAudit } from "../../lib/audit";

export const createEntry = asyncHandler(async (req: Request, res: Response) => {
  const entry = await timetableService.createEntry(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE_TIMETABLE_ENTRY", resource: "timetable", resourceId: entry.id });
  res.status(201).json({ entry });
});

export const updateEntry = asyncHandler(async (req: Request, res: Response) => {
  const entry = await timetableService.updateEntry(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "UPDATE_TIMETABLE_ENTRY", resource: "timetable", resourceId: entry.id });
  res.json({ entry });
});

export const deleteEntry = asyncHandler(async (req: Request, res: Response) => {
  await timetableService.deleteEntry(req.user!.schoolId, req.params.id);
  await recordAudit({ req, action: "DELETE_TIMETABLE_ENTRY", resource: "timetable", resourceId: req.params.id });
  res.status(204).send();
});

export const listBySection = asyncHandler(async (req: Request, res: Response) => {
  const entries = await timetableService.listBySection(req.user!.schoolId, req.params.sectionId);
  res.json({ entries });
});

export const listByTeacher = asyncHandler(async (req: Request, res: Response) => {
  const entries = await timetableService.listByTeacher(req.user!.schoolId, req.params.teacherId);
  res.json({ entries });
});

export const listMine = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await teacherService.getTeacherByUserId(req.user!.schoolId, req.user!.id);
  const entries = await timetableService.listByTeacher(req.user!.schoolId, teacher.id);
  res.json({ entries });
});

export const listPeriods = asyncHandler(async (req: Request, res: Response) => {
  const periods = await timetableService.listPeriods(req.user!.schoolId);
  res.json({ periods });
});

export const createPeriod = asyncHandler(async (req: Request, res: Response) => {
  const period = await timetableService.createPeriod(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE_PERIOD", resource: "period", resourceId: period.id });
  res.status(201).json({ period });
});

export const updatePeriod = asyncHandler(async (req: Request, res: Response) => {
  const period = await timetableService.updatePeriod(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "UPDATE_PERIOD", resource: "period", resourceId: period.id });
  res.json({ period });
});

export const deletePeriod = asyncHandler(async (req: Request, res: Response) => {
  await timetableService.deletePeriod(req.user!.schoolId, req.params.id);
  await recordAudit({ req, action: "DELETE_PERIOD", resource: "period", resourceId: req.params.id });
  res.status(204).send();
});
