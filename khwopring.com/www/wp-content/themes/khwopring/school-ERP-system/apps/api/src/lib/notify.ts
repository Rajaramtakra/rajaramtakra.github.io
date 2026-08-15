import type { NotificationChannel } from "@prisma/client";
import { prisma } from "./prisma";
import { logger } from "./logger";

export interface NotifyInput {
  schoolId: string;
  recipientId?: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
}

/**
 * Stubbed notification "sender".
 *
 * IMPORTANT: this deliberately does NOT call any real email/SMS provider (no SMTP, no Twilio,
 * no third-party API). "Sending" a notification is simulated by logging to the console and
 * writing an audit-able row to NotificationLog with status SENT. Any module (communication, HR
 * offer letters, fee reminders, etc.) can call this to record a stubbed outbound notification.
 */
export async function notify({ schoolId, recipientId, channel, subject, body }: NotifyInput) {
  logger.info(
    { schoolId, recipientId, channel, subject },
    `[notify:stub] Would send ${channel} notification${subject ? ` "${subject}"` : ""}: ${body}`
  );
  // eslint-disable-next-line no-console
  console.log(`[notify:stub] channel=${channel} recipient=${recipientId ?? "-"} subject=${subject ?? "-"} body=${body}`);

  return prisma.notificationLog.create({
    data: {
      schoolId,
      recipientId,
      channel,
      subject,
      body,
      status: "SENT",
    },
  });
}
