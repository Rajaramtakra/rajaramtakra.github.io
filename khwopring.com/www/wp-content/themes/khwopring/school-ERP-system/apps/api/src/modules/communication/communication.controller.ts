import type { Request, Response } from "express";
import * as messageService from "./message.service";
import * as announcementService from "./announcement.service";
import { asyncHandler } from "../../middleware/asyncHandler";
import { recordAudit } from "../../lib/audit";

export const getInbox = asyncHandler(async (req: Request, res: Response) => {
  const messages = await messageService.getInbox(req.user!.schoolId, req.user!.id);
  res.json({ messages });
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const messages = await messageService.sendMessage(req.user!.schoolId, req.user!.id, req.body);
  await recordAudit({
    req,
    action: "SEND_MESSAGE",
    resource: "message",
    metadata: { recipientCount: messages.length },
  });
  res.status(201).json({ messages });
});

export const markMessageRead = asyncHandler(async (req: Request, res: Response) => {
  const message = await messageService.markMessageRead(req.user!.schoolId, req.params.id, req.user!.id);
  await recordAudit({ req, action: "MARK_MESSAGE_READ", resource: "message", resourceId: message.id });
  res.json({ message });
});

export const listNotificationLogs = asyncHandler(async (req: Request, res: Response) => {
  const logs = await messageService.listNotificationLogs(req.user!.schoolId);
  res.json({ logs });
});

export const sendBulkMessage = asyncHandler(async (req: Request, res: Response) => {
  const job = await messageService.sendBulkMessage(req.user!.schoolId, req.user!.id, req.body);
  await recordAudit({
    req,
    action: "SEND_BULK_MESSAGE",
    resource: "bulk_message_job",
    resourceId: job.id,
    metadata: { sentCount: job.sentCount },
  });
  res.status(201).json({ job });
});

export const listBulkMessageJobs = asyncHandler(async (req: Request, res: Response) => {
  const jobs = await messageService.listBulkMessageJobs(req.user!.schoolId);
  res.json({ jobs });
});

export const listAnnouncements = asyncHandler(async (req: Request, res: Response) => {
  const announcements = await announcementService.listAnnouncements(req.user!.schoolId, req.user!.roles);
  res.json({ announcements });
});

export const getAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const announcement = await announcementService.getAnnouncement(req.user!.schoolId, req.params.id);
  res.json({ announcement });
});

export const createAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const announcement = await announcementService.createAnnouncement(req.user!.schoolId, req.user!.id, req.body);
  await recordAudit({ req, action: "CREATE_ANNOUNCEMENT", resource: "announcement", resourceId: announcement.id });
  res.status(201).json({ announcement });
});

export const setAnnouncementPin = asyncHandler(async (req: Request, res: Response) => {
  const announcement = await announcementService.setAnnouncementPin(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "SET_ANNOUNCEMENT_PIN", resource: "announcement", resourceId: announcement.id, metadata: req.body });
  res.json({ announcement });
});
