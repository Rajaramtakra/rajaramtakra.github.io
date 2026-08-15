import type { RegisterDeviceTokenInput } from "@erp/shared";
import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";

export function registerDeviceToken(schoolId: string, userId: string, input: RegisterDeviceTokenInput) {
  return prisma.deviceToken.upsert({
    where: { token: input.token },
    create: { schoolId, userId, platform: input.platform, token: input.token },
    update: { schoolId, userId, platform: input.platform },
  });
}

export function listMyDeviceTokens(userId: string) {
  return prisma.deviceToken.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export async function removeDeviceToken(userId: string, id: string) {
  const token = await prisma.deviceToken.findFirst({ where: { id, userId } });
  if (!token) throw new NotFoundError("Device token not found");
  await prisma.deviceToken.delete({ where: { id } });
}
