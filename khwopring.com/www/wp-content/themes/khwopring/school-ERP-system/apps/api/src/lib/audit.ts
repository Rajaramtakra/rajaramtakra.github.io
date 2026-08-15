import type { Request } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { logger } from "./logger";

interface RecordAuditInput {
  req: Request;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

/** Fire-and-forget audit trail write; failures are logged but never break the request. */
export async function recordAudit({ req, action, resource, resourceId, metadata }: RecordAuditInput) {
  if (!req.user) return;
  try {
    await prisma.auditLog.create({
      data: {
        schoolId: req.user.schoolId,
        userId: req.user.id,
        action,
        resource,
        resourceId,
        metadata: metadata as Prisma.InputJsonValue | undefined,
        ipAddress: req.ip,
      },
    });
  } catch (err) {
    logger.error({ err }, "Failed to write audit log");
  }
}
