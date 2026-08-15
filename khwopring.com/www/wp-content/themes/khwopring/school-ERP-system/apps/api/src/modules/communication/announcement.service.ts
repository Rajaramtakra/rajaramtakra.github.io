import type { AnnouncementAudienceValue, CreateAnnouncementInput, SetAnnouncementPinInput } from "@erp/shared";
import type { RoleName } from "@erp/shared";
import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";

/** Maps each RoleName to the AnnouncementAudience it should see (besides the always-included ALL). */
const ROLE_AUDIENCE_MAP: Record<RoleName, AnnouncementAudienceValue> = {
  SUPER_ADMIN: "STAFF",
  SCHOOL_ADMIN: "STAFF",
  PRINCIPAL: "STAFF",
  ACCOUNTANT: "STAFF",
  RECEPTIONIST: "STAFF",
  LIBRARIAN: "STAFF",
  TRANSPORT_MANAGER: "STAFF",
  HR_MANAGER: "STAFF",
  TEACHER: "TEACHERS",
  STUDENT: "STUDENTS",
  PARENT: "PARENTS",
};

export function audiencesForRoles(roles: RoleName[]): AnnouncementAudienceValue[] {
  const audiences = new Set<AnnouncementAudienceValue>(["ALL"]);
  for (const role of roles) {
    audiences.add(ROLE_AUDIENCE_MAP[role]);
  }
  return [...audiences];
}

export async function listAnnouncements(schoolId: string, roles: RoleName[]) {
  return prisma.announcement.findMany({
    where: {
      schoolId,
      deletedAt: null,
      audience: { in: audiencesForRoles(roles) },
    },
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
  });
}

export async function getAnnouncement(schoolId: string, id: string) {
  const announcement = await prisma.announcement.findFirst({ where: { id, schoolId, deletedAt: null } });
  if (!announcement) throw new NotFoundError("Announcement not found");
  return announcement;
}

export async function createAnnouncement(schoolId: string, publishedById: string, input: CreateAnnouncementInput) {
  return prisma.announcement.create({
    data: {
      schoolId,
      title: input.title,
      body: input.body,
      audience: input.audience,
      pinned: input.pinned,
      popupUntil: input.popupUntil,
      publishedById,
    },
  });
}

export async function setAnnouncementPin(schoolId: string, id: string, input: SetAnnouncementPinInput) {
  await getAnnouncement(schoolId, id);
  return prisma.announcement.update({
    where: { id },
    data: { pinned: input.pinned, popupUntil: input.popupUntil },
  });
}
