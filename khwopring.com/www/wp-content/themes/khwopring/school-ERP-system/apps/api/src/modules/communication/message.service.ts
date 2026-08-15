import type { SendBulkMessageInput, SendMessageInput } from "@erp/shared";
import { prisma } from "../../lib/prisma";
import { BadRequestError, NotFoundError } from "../../lib/errors";
import { notify } from "../../lib/notify";

export async function sendMessage(schoolId: string, senderId: string, input: SendMessageInput) {
  // Prisma's Message model is one-recipient-per-row, so "send to multiple recipients" fans out
  // into one Message.create per recipientId.
  const messages = await prisma.$transaction(
    input.recipientIds.map((recipientId) =>
      prisma.message.create({
        data: {
          schoolId,
          senderId,
          recipientId,
          subject: input.subject,
          body: input.body,
        },
      })
    )
  );

  // Stub-log a NotificationLog entry per recipient (IN_APP channel — no real email/SMS provider).
  await Promise.all(
    input.recipientIds.map((recipientId) =>
      notify({
        schoolId,
        recipientId,
        channel: "IN_APP",
        subject: input.subject,
        body: input.body,
      })
    )
  );

  return messages;
}

export async function getInbox(schoolId: string, recipientId: string) {
  return prisma.message.findMany({
    where: { schoolId, recipientId },
    orderBy: { createdAt: "desc" },
  });
}

export async function markMessageRead(schoolId: string, id: string, recipientId: string) {
  const message = await prisma.message.findFirst({ where: { id, schoolId, recipientId } });
  if (!message) throw new NotFoundError("Message not found");
  return prisma.message.update({ where: { id }, data: { isRead: true } });
}

export async function listNotificationLogs(schoolId: string) {
  return prisma.notificationLog.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

/** Resolves an audience filter set (class/section/role) to distinct recipient userIds. */
async function resolveAudienceUserIds(
  schoolId: string,
  filters: { classId?: string; sectionId?: string; roleName?: string }
): Promise<string[]> {
  const userIds = new Set<string>();

  if (filters.roleName) {
    const userRoles = await prisma.userRole.findMany({
      where: { role: { name: filters.roleName }, user: { schoolId } },
      select: { userId: true },
    });
    userRoles.forEach((ur) => userIds.add(ur.userId));
  }

  if (filters.classId || filters.sectionId) {
    const students = await prisma.student.findMany({
      where: {
        schoolId,
        deletedAt: null,
        ...(filters.sectionId ? { sectionId: filters.sectionId } : {}),
        ...(filters.classId ? { section: { classId: filters.classId } } : {}),
      },
      select: { userId: true },
    });
    students.forEach((s) => {
      if (s.userId) userIds.add(s.userId);
    });
  }

  return [...userIds];
}

/**
 * Resolves the audience (class/section/role) to concrete recipients, then reuses the existing
 * one-Message-per-recipient + stubbed NotificationLog pipeline from `sendMessage`/`notify` —
 * no new delivery machinery, just an audience-resolution step in front of it.
 */
export async function sendBulkMessage(schoolId: string, senderId: string, input: SendBulkMessageInput) {
  const recipientIds = await resolveAudienceUserIds(schoolId, input);
  if (recipientIds.length === 0) {
    throw new BadRequestError("No recipients matched the given audience filters");
  }

  const job = await prisma.bulkMessageJob.create({
    data: {
      schoolId,
      senderId,
      channel: input.channel,
      classId: input.classId,
      sectionId: input.sectionId,
      roleName: input.roleName,
      body: input.body,
      status: "PENDING",
    },
  });

  await prisma.$transaction(
    recipientIds.map((recipientId) =>
      prisma.message.create({
        data: { schoolId, senderId, recipientId, subject: "Bulk message", body: input.body },
      })
    )
  );

  await Promise.all(
    recipientIds.map((recipientId) => notify({ schoolId, recipientId, channel: input.channel, body: input.body }))
  );

  return prisma.bulkMessageJob.update({
    where: { id: job.id },
    data: { status: "SENT", sentCount: recipientIds.length },
  });
}

export function listBulkMessageJobs(schoolId: string) {
  return prisma.bulkMessageJob.findMany({ where: { schoolId }, orderBy: { createdAt: "desc" } });
}
