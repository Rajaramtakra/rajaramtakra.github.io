import { Router } from "express";
import {
  assignSectionCoordinatorSchema,
  assignSubjectSchema,
  createAcademicSessionSchema,
  createChapterSchema,
  createClassSchema,
  createSectionSchema,
  createSubjectSchema,
  createSyllabusSchema,
  updateChapterSchema,
  updateSyllabusSchema,
} from "@erp/shared";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import * as controller from "./academic.controller";

export const academicRouter = Router();
academicRouter.use(requireAuth);

/**
 * @openapi
 * tags:
 *   name: Academic
 *   description: Academic sessions, classes, sections, subjects
 */

academicRouter.post(
  "/sessions",
  requirePermission("academic_session:manage"),
  validateBody(createAcademicSessionSchema),
  controller.createAcademicSession
);
academicRouter.get("/sessions", controller.listAcademicSessions);
academicRouter.patch("/sessions/:id/set-current", requirePermission("academic_session:manage"), controller.setCurrentSession);

academicRouter.post("/classes", requirePermission("class:manage"), validateBody(createClassSchema), controller.createClass);
academicRouter.get("/classes", controller.listClasses);

academicRouter.post(
  "/sections",
  requirePermission("section:manage"),
  validateBody(createSectionSchema),
  controller.createSection
);
academicRouter.get("/sections", controller.listSections);
academicRouter.patch(
  "/sections/:id/coordinator",
  requirePermission("section:manage"),
  validateBody(assignSectionCoordinatorSchema),
  controller.assignSectionCoordinator
);

academicRouter.post(
  "/subjects",
  requirePermission("subject:manage"),
  validateBody(createSubjectSchema),
  controller.createSubject
);
academicRouter.get("/subjects", controller.listSubjects);

academicRouter.post(
  "/subject-assignments",
  requirePermission("subject:manage"),
  validateBody(assignSubjectSchema),
  controller.assignSubject
);
academicRouter.get("/subject-assignments", controller.listSubjectAssignments);

// ---------------------------------------------------------------------------
// Syllabus & chapters
// ---------------------------------------------------------------------------

academicRouter.post(
  "/syllabi",
  requirePermission("syllabus:manage"),
  validateBody(createSyllabusSchema),
  controller.createSyllabus
);
academicRouter.get("/syllabi", requirePermission("syllabus:manage", "syllabus:read"), controller.listSyllabi);
academicRouter.get("/syllabi/:id", requirePermission("syllabus:manage", "syllabus:read"), controller.getSyllabus);
academicRouter.patch(
  "/syllabi/:id",
  requirePermission("syllabus:manage"),
  validateBody(updateSyllabusSchema),
  controller.updateSyllabus
);
academicRouter.post(
  "/syllabi/:id/chapters",
  requirePermission("syllabus:manage"),
  validateBody(createChapterSchema),
  controller.createChapter
);
academicRouter.patch(
  "/chapters/:id",
  requirePermission("syllabus:manage"),
  validateBody(updateChapterSchema),
  controller.updateChapter
);
academicRouter.delete("/chapters/:id", requirePermission("syllabus:manage"), controller.deleteChapter);
