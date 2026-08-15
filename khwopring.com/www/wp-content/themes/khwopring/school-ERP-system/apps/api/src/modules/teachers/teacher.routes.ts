import { Router } from "express";
import {
  addTeacherExperienceSchema,
  addTeacherQualificationSchema,
  createTeacherSchema,
  updateTeacherSchema,
  updateTeacherStatusSchema,
} from "@erp/shared";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import { upload } from "../../middleware/upload.middleware";
import * as controller from "./teacher.controller";

export const teacherRouter = Router();
teacherRouter.use(requireAuth);

/**
 * @openapi
 * tags:
 *   name: Teachers
 *   description: Teacher profiles, qualifications, experience, employment status
 */

teacherRouter.get("/", requirePermission("teacher:read", "teacher:manage"), controller.searchTeachers);

teacherRouter.post(
  "/",
  requirePermission("teacher:manage"),
  validateBody(createTeacherSchema),
  controller.createTeacher
);

teacherRouter.get("/me", controller.getMyProfile);

teacherRouter.get("/:id", requirePermission("teacher:read", "teacher:manage"), controller.getTeacher);

teacherRouter.patch(
  "/:id",
  requirePermission("teacher:manage"),
  validateBody(updateTeacherSchema),
  controller.updateTeacher
);

teacherRouter.post(
  "/:id/photo",
  requirePermission("teacher:manage"),
  upload.single("file"),
  controller.uploadPhoto
);

teacherRouter.post(
  "/:id/status",
  requirePermission("teacher:manage"),
  validateBody(updateTeacherStatusSchema),
  controller.updateEmploymentStatus
);

teacherRouter.post(
  "/:id/qualifications",
  requirePermission("teacher:manage"),
  validateBody(addTeacherQualificationSchema),
  controller.addQualification
);

teacherRouter.post(
  "/:id/experience",
  requirePermission("teacher:manage"),
  validateBody(addTeacherExperienceSchema),
  controller.addExperience
);
