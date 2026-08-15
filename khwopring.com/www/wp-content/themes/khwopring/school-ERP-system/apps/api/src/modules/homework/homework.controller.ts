import type { Request, Response } from "express";
import * as homeworkService from "./homework.service";
import { asyncHandler } from "../../middleware/asyncHandler";
import { recordAudit } from "../../lib/audit";

export const listHomework = asyncHandler(async (req: Request, res: Response) => {
  const { sectionId, subjectId } = req.query as Record<string, string>;
  const homework = await homeworkService.listHomework(req.user!.schoolId, { sectionId, subjectId });
  res.json({ homework });
});

export const getHomework = asyncHandler(async (req: Request, res: Response) => {
  const homework = await homeworkService.getHomework(req.user!.schoolId, req.params.id);
  res.json({ homework });
});

export const createHomework = asyncHandler(async (req: Request, res: Response) => {
  const homework = await homeworkService.createHomework(req.user!.schoolId, req.user!.id, req.body, req.file);
  await recordAudit({ req, action: "CREATE_HOMEWORK", resource: "homework", resourceId: homework.id });
  res.status(201).json({ homework });
});

export const updateHomework = asyncHandler(async (req: Request, res: Response) => {
  const homework = await homeworkService.updateHomework(req.user!.schoolId, req.params.id, req.body, req.file);
  await recordAudit({ req, action: "UPDATE_HOMEWORK", resource: "homework", resourceId: homework.id });
  res.json({ homework });
});

export const deleteHomework = asyncHandler(async (req: Request, res: Response) => {
  await homeworkService.deleteHomework(req.user!.schoolId, req.params.id);
  await recordAudit({ req, action: "DELETE_HOMEWORK", resource: "homework", resourceId: req.params.id });
  res.status(204).send();
});
