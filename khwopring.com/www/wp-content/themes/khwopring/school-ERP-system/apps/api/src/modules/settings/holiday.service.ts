import type { CreateHolidayInput } from "@erp/shared";
import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";

export function listHolidays(schoolId: string) {
  return prisma.holiday.findMany({ where: { schoolId }, orderBy: { date: "asc" } });
}

export function createHoliday(schoolId: string, input: CreateHolidayInput) {
  return prisma.holiday.create({ data: { schoolId, ...input } });
}

export async function deleteHoliday(schoolId: string, id: string) {
  const holiday = await prisma.holiday.findFirst({ where: { id, schoolId } });
  if (!holiday) throw new NotFoundError("Holiday not found");
  await prisma.holiday.delete({ where: { id } });
  return holiday;
}
