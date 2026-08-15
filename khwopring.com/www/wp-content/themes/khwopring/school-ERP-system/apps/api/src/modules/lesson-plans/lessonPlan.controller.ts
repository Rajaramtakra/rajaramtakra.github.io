import type { Request, Response } from "express";
import * as lessonPlanService from "./lessonPlan.service";
import { asyncHandler } from "../../middleware/asyncHandler";
import { recordAudit } from "../../lib/audit";

export const listMyLessonPlans = asyncHandler(async (req: Request, res: Response) => {
  const { sectionId, subjectId } = req.query as Record<string, string>;
  const lessonPlans = await lessonPlanService.listMyLessonPlans(req.user!.schoolId, req.user!.id, {
    sectionId,
    subjectId,
  });
  res.json({ lessonPlans });
});

export const createLessonPlan = asyncHandler(async (req: Request, res: Response) => {
  const lessonPlan = await lessonPlanService.createLessonPlan(req.user!.schoolId, req.user!.id, req.body);
  await recordAudit({ req, action: "CREATE_LESSON_PLAN", resource: "lesson_plan", resourceId: lessonPlan.id });
  res.status(201).json({ lessonPlan });
});

export const updateLessonPlan = asyncHandler(async (req: Request, res: Response) => {
  const lessonPlan = await lessonPlanService.updateLessonPlan(
    req.user!.schoolId,
    req.user!.id,
    req.params.id,
    req.body
  );
  await recordAudit({ req, action: "UPDATE_LESSON_PLAN", resource: "lesson_plan", resourceId: lessonPlan.id });
  res.json({ lessonPlan });
});

export const deleteLessonPlan = asyncHandler(async (req: Request, res: Response) => {
  await lessonPlanService.deleteLessonPlan(req.user!.schoolId, req.user!.id, req.params.id);
  await recordAudit({ req, action: "DELETE_LESSON_PLAN", resource: "lesson_plan", resourceId: req.params.id });
  res.status(204).send();
});
