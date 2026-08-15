import { Router } from "express";
import { markStaffAttendanceSchema, markStudentAttendanceSchema } from "@erp/shared";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import * as controller from "./attendance.controller";

export const attendanceRouter = Router();
attendanceRouter.use(requireAuth);

/**
 * @openapi
 * tags:
 *   name: Attendance
 *   description: Student and staff attendance marking and reporting
 */

attendanceRouter.get(
  "/students",
  requirePermission("attendance_student:read", "attendance_student:read_own"),
  controller.listStudentAttendance
);

attendanceRouter.post(
  "/students",
  requirePermission("attendance_student:mark"),
  validateBody(markStudentAttendanceSchema),
  controller.markStudentAttendance
);

attendanceRouter.get(
  "/staff",
  requirePermission("attendance_staff:read", "attendance_staff:read_own"),
  controller.listStaffAttendance
);

attendanceRouter.post(
  "/staff",
  requirePermission("attendance_staff:mark"),
  validateBody(markStaffAttendanceSchema),
  controller.markStaffAttendance
);
