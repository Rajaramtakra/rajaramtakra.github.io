import { Router } from "express";
import {
  createCoScholasticGradeSchema,
  createExamSchema,
  createExamScheduleSchema,
  createGradeScaleSchema,
  enterMarksSchema,
  publishReportCardsSchema,
} from "@erp/shared";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import * as controller from "./exam.controller";

export const examRouter = Router();
examRouter.use(requireAuth);

/**
 * @openapi
 * tags:
 *   name: Exams
 *   description: Exams, schedules, grade scales, marks entry, and report cards
 */

examRouter.post("/", requirePermission("exam:manage"), validateBody(createExamSchema), controller.createExam);
examRouter.get("/", requirePermission("exam:read", "exam:manage"), controller.listExams);

examRouter.post(
  "/schedules",
  requirePermission("exam:manage"),
  validateBody(createExamScheduleSchema),
  controller.createExamSchedule
);
examRouter.get("/schedules", requirePermission("exam:read", "exam:manage"), controller.listExamSchedules);

examRouter.post(
  "/grade-scales",
  requirePermission("exam:manage"),
  validateBody(createGradeScaleSchema),
  controller.createGradeScale
);
examRouter.get("/grade-scales", requirePermission("exam:read", "exam:manage"), controller.listGradeScales);

examRouter.post("/marks", requirePermission("mark:enter"), validateBody(enterMarksSchema), controller.enterMarks);
examRouter.get("/marks", requirePermission("mark:read", "mark:enter"), controller.listMarks);

examRouter.get(
  "/report-cards",
  requirePermission("report_card:publish", "mark:read", "report_card:read_own"),
  controller.listReportCards
);
examRouter.post(
  "/report-cards/publish",
  requirePermission("report_card:publish"),
  validateBody(publishReportCardsSchema),
  controller.publishReportCards
);
examRouter.get(
  "/report-cards/:id",
  requirePermission("report_card:publish", "mark:read", "report_card:read_own"),
  controller.getReportCard
);

examRouter.post(
  "/co-scholastic",
  requirePermission("mark:enter"),
  validateBody(createCoScholasticGradeSchema),
  controller.upsertCoScholasticGrade
);
examRouter.get(
  "/co-scholastic",
  requirePermission("mark:read", "mark:enter", "mark:read_own"),
  controller.listCoScholasticGrades
);

examRouter.get(
  "/:examId/sections/:sectionId/admit-cards/bulk-pdf",
  requirePermission("exam:manage"),
  controller.bulkDownloadAdmitCardsPdf
);

// Keep the generic "/:id" last so it doesn't shadow the more specific literal routes above.
examRouter.get("/:id", requirePermission("exam:read", "exam:manage"), controller.getExam);
