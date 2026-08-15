import { z } from "zod";

/**
 * Kept local to this schema file (not packages/shared/src/enums.ts) per module coordination rules.
 * Must stay in sync with the Prisma `AnnouncementAudience` enum (apps/api/prisma/schema.prisma).
 */
export const ANNOUNCEMENT_AUDIENCES = ["ALL", "STUDENTS", "PARENTS", "TEACHERS", "STAFF"] as const;
export type AnnouncementAudienceValue = (typeof ANNOUNCEMENT_AUDIENCES)[number];

/** Treats an empty string (e.g. a blank HTML date input) the same as an absent value. */
const optionalDate = z.preprocess((v) => (v === "" || v === null ? undefined : v), z.coerce.date().optional());

export const sendMessageSchema = z.object({
  recipientIds: z.array(z.string().min(1)).min(1),
  subject: z.string().max(200).optional(),
  body: z.string().min(1).max(5000),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const createAnnouncementSchema = z.object({
  title: z.string().min(2).max(200),
  body: z.string().min(1).max(5000),
  audience: z.enum(ANNOUNCEMENT_AUDIENCES).default("ALL"),
  pinned: z.boolean().default(false),
  popupUntil: optionalDate,
});
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

export const setAnnouncementPinSchema = z.object({
  pinned: z.boolean(),
  popupUntil: optionalDate,
});
export type SetAnnouncementPinInput = z.infer<typeof setAnnouncementPinSchema>;

/**
 * Kept local to this schema file. Must stay in sync with the Prisma `NotificationChannel` enum.
 */
export const NOTIFICATION_CHANNELS = ["EMAIL", "SMS", "IN_APP", "PUSH"] as const;
export type NotificationChannelValue = (typeof NOTIFICATION_CHANNELS)[number];

export const sendBulkMessageSchema = z
  .object({
    channel: z.enum(NOTIFICATION_CHANNELS).default("IN_APP"),
    classId: z.string().min(1).optional(),
    sectionId: z.string().min(1).optional(),
    roleName: z.string().min(1).optional(),
    body: z.string().min(1).max(5000),
  })
  .refine((v) => Boolean(v.classId) || Boolean(v.sectionId) || Boolean(v.roleName), {
    message: "Provide at least one audience filter: classId, sectionId, or roleName",
  });
export type SendBulkMessageInput = z.infer<typeof sendBulkMessageSchema>;
