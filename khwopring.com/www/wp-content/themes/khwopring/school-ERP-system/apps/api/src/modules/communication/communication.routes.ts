import { Router } from "express";
import { createAnnouncementSchema, sendBulkMessageSchema, sendMessageSchema, setAnnouncementPinSchema } from "@erp/shared";
import { requireAuth, requirePermission } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import * as controller from "./communication.controller";

export const communicationRouter = Router();
communicationRouter.use(requireAuth);

/**
 * @openapi
 * tags:
 *   name: Communication
 *   description: Internal messaging inbox, school-wide announcements, and stubbed notification log
 */

// Messages
communicationRouter.get(
  "/messages/inbox",
  requirePermission("communication:read_own", "communication:manage"),
  controller.getInbox
);

communicationRouter.post(
  "/messages",
  requirePermission("communication:manage"),
  validateBody(sendMessageSchema),
  controller.sendMessage
);

communicationRouter.patch(
  "/messages/:id/read",
  requirePermission("communication:read_own", "communication:manage"),
  controller.markMessageRead
);

// Announcements
communicationRouter.get(
  "/announcements",
  requirePermission("announcement:read", "announcement:manage"),
  controller.listAnnouncements
);

communicationRouter.get(
  "/announcements/:id",
  requirePermission("announcement:read", "announcement:manage"),
  controller.getAnnouncement
);

communicationRouter.post(
  "/announcements",
  requirePermission("announcement:manage"),
  validateBody(createAnnouncementSchema),
  controller.createAnnouncement
);

communicationRouter.patch(
  "/announcements/:id/pin",
  requirePermission("announcement:manage"),
  validateBody(setAnnouncementPinSchema),
  controller.setAnnouncementPin
);

// Notification log (audit trail for stubbed sends)
communicationRouter.get(
  "/notifications",
  requirePermission("communication:manage"),
  controller.listNotificationLogs
);

// Bulk messaging (audience-targeted, reuses the Message/NotificationLog pipeline)
communicationRouter.post(
  "/bulk-messages",
  requirePermission("communication:manage"),
  validateBody(sendBulkMessageSchema),
  controller.sendBulkMessage
);
communicationRouter.get(
  "/bulk-messages",
  requirePermission("communication:manage"),
  controller.listBulkMessageJobs
);
