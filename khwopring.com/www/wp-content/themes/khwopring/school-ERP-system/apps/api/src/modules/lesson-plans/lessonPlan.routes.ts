import { Router } from "express";
import { createLessonPlanSchema, updateLessonPlanSchema } from "@erp/shared";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import * as controller from "./lessonPlan.controller";

export const lessonPlanRouter = Router();
lessonPlanRouter.use(requireAuth);

/**
 * @openapi
 * tags:
 *   name: Lesson Plans
 *   description: Teacher's own lesson planning notes per section/subject
 */

lessonPlanRouter.get("/", requirePermission("lesson_plan:manage"), controller.listMyLessonPlans);

lessonPlanRouter.post(
  "/",
  requirePermission("lesson_plan:manage"),
  validateBody(createLessonPlanSchema),
  controller.createLessonPlan
);

lessonPlanRouter.patch(
  "/:id",
  requirePermission("lesson_plan:manage"),
  validateBody(updateLessonPlanSchema),
  controller.updateLessonPlan
);

lessonPlanRouter.delete("/:id", requirePermission("lesson_plan:manage"), controller.deleteLessonPlan);
