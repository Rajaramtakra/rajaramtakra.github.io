import type { UpdateSchoolProfileInput } from "@erp/shared";
import { prisma } from "../../lib/prisma";

export async function getSchoolProfile(schoolId: string) {
  return prisma.school.findUniqueOrThrow({ where: { id: schoolId } });
}

export async function updateSchoolProfile(schoolId: string, input: UpdateSchoolProfileInput) {
  return prisma.school.update({ where: { id: schoolId }, data: input });
}
