import { Router } from "express";
import {
  convertEnquirySchema,
  createEnquirySchema,
  createPtmMeetingSchema,
  createStudentRequestSchema,
  listEnquiriesQuerySchema,
  listStudentRequestsQuerySchema,
  recordPtmAttendanceSchema,
  updateEnquirySchema,
  updateStudentRequestSchema,
} from "@erp/shared";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware";
import { validateBody, validateQuery } from "../../middleware/validate.middleware";
import * as controller from "./reception.controller";

export const receptionRouter = Router();
receptionRouter.use(requireAuth);

/**
 * @openapi
 * tags:
 *   name: Reception
 *   description: Front-office enquiries, student requests, and parent-teacher meetings
 */

receptionRouter.post(
  "/enquiries",
  requirePermission("reception:manage"),
  validateBody(createEnquirySchema),
  controller.createEnquiry
);

receptionRouter.get(
  "/enquiries",
  requirePermission("reception:manage", "reception:read"),
  validateQuery(listEnquiriesQuerySchema),
  controller.listEnquiries
);

receptionRouter.get(
  "/enquiries/:id",
  requirePermission("reception:manage", "reception:read"),
  controller.getEnquiry
);

receptionRouter.patch(
  "/enquiries/:id",
  requirePermission("reception:manage"),
  validateBody(updateEnquirySchema),
  controller.updateEnquiry
);

receptionRouter.post(
  "/enquiries/:id/convert",
  requirePermission("reception:manage"),
  validateBody(convertEnquirySchema),
  controller.convertEnquiry
);

receptionRouter.get(
  "/students/:id/siblings",
  requirePermission("reception:manage", "reception:read", "student:read"),
  controller.getStudentSiblings
);

receptionRouter.post(
  "/student-requests",
  requirePermission("reception:manage"),
  validateBody(createStudentRequestSchema),
  controller.createStudentRequest
);

receptionRouter.get(
  "/student-requests",
  requirePermission("reception:manage", "reception:read"),
  validateQuery(listStudentRequestsQuerySchema),
  controller.listStudentRequests
);

receptionRouter.patch(
  "/student-requests/:id",
  requirePermission("reception:manage"),
  validateBody(updateStudentRequestSchema),
  controller.updateStudentRequestStatus
);

receptionRouter.post(
  "/ptm-meetings",
  requirePermission("reception:manage"),
  validateBody(createPtmMeetingSchema),
  controller.createPtmMeeting
);

receptionRouter.get(
  "/ptm-meetings",
  requirePermission("reception:manage", "reception:read"),
  controller.listPtmMeetings
);

receptionRouter.get(
  "/ptm-meetings/:id",
  requirePermission("reception:manage", "reception:read"),
  controller.getPtmMeeting
);

receptionRouter.post(
  "/ptm-meetings/:id/attendance",
  requirePermission("reception:manage"),
  validateBody(recordPtmAttendanceSchema),
  controller.recordPtmAttendance
);
