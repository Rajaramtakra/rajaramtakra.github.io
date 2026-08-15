import { Router } from "express";
import { createPeriodSchema, createTimetableEntrySchema, updatePeriodSchema, updateTimetableEntrySchema } from "@erp/shared";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import * as controller from "./timetable.controller";

export const timetableRouter = Router();
timetableRouter.use(requireAuth);

/**
 * @openapi
 * tags:
 *   name: Timetable
 *   description: Weekly class schedule per section and teacher
 */

timetableRouter.get("/me", requirePermission("timetable:read"), controller.listMine);

timetableRouter.get(
  "/section/:sectionId",
  requirePermission("timetable:read", "timetable:manage"),
  controller.listBySection
);

timetableRouter.get(
  "/teacher/:teacherId",
  requirePermission("timetable:read", "timetable:manage"),
  controller.listByTeacher
);

timetableRouter.post(
  "/",
  requirePermission("timetable:manage"),
  validateBody(createTimetableEntrySchema),
  controller.createEntry
);

timetableRouter.patch(
  "/:id",
  requirePermission("timetable:manage"),
  validateBody(updateTimetableEntrySchema),
  controller.updateEntry
);

timetableRouter.delete("/:id", requirePermission("timetable:manage"), controller.deleteEntry);

// Period master
timetableRouter.get("/periods", requirePermission("timetable:read", "timetable:manage"), controller.listPeriods);
timetableRouter.post(
  "/periods",
  requirePermission("timetable:manage"),
  validateBody(createPeriodSchema),
  controller.createPeriod
);
timetableRouter.patch(
  "/periods/:id",
  requirePermission("timetable:manage"),
  validateBody(updatePeriodSchema),
  controller.updatePeriod
);
timetableRouter.delete("/periods/:id", requirePermission("timetable:manage"), controller.deletePeriod);
