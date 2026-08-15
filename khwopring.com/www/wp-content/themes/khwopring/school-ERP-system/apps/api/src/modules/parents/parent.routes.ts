import { Router } from "express";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware";
import * as controller from "./parent.controller";

export const parentRouter = Router();
parentRouter.use(requireAuth);

/**
 * @openapi
 * tags:
 *   name: Parent Portal
 *   description: Guardian self-service views scoped to their own linked children
 */

parentRouter.get("/children", controller.listMyChildren);
parentRouter.get("/children/:studentId/attendance", controller.getChildAttendance);
parentRouter.get("/children/:studentId/homework", controller.getChildHomework);
parentRouter.get("/children/:studentId/timetable", controller.getChildTimetable);

parentRouter.post(
  "/guardians/:guardianId/enable-access",
  requirePermission("guardian:manage"),
  controller.enableGuardianPortalAccess
);
