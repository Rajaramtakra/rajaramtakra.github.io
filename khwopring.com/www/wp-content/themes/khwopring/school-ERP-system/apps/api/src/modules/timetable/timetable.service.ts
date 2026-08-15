import type { CreatePeriodInput, CreateTimetableEntryInput, UpdatePeriodInput, UpdateTimetableEntryInput } from "@erp/shared";
import type { DayOfWeek } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ConflictError, NotFoundError } from "../../lib/errors";

const ENTRY_INCLUDE = {
  section: { include: { class: true } },
  subject: true,
  teacher: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
} as const;

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd;
}

async function assertNoConflict(
  schoolId: string,
  input: { sectionId: string; teacherId: string; dayOfWeek: DayOfWeek; startTime: string; endTime: string },
  excludeId?: string
) {
  if (input.endTime <= input.startTime) {
    throw new ConflictError("End time must be after start time");
  }

  const candidates = await prisma.timetableEntry.findMany({
    where: {
      schoolId,
      dayOfWeek: input.dayOfWeek,
      OR: [{ sectionId: input.sectionId }, { teacherId: input.teacherId }],
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });

  for (const entry of candidates) {
    if (!overlaps(input.startTime, input.endTime, entry.startTime, entry.endTime)) continue;
    if (entry.sectionId === input.sectionId) {
      throw new ConflictError("This section already has a class scheduled in that time slot");
    }
    if (entry.teacherId === input.teacherId) {
      throw new ConflictError("This teacher is already scheduled elsewhere in that time slot");
    }
  }
}

async function findOrThrow(schoolId: string, id: string) {
  const entry = await prisma.timetableEntry.findFirst({ where: { id, schoolId }, include: ENTRY_INCLUDE });
  if (!entry) throw new NotFoundError("Timetable entry not found");
  return entry;
}

/** When a periodId is given, the shared Period's times win over any manually supplied startTime/endTime. */
async function resolveEntryTimes(
  schoolId: string,
  input: { periodId?: string; startTime?: string; endTime?: string }
): Promise<{ startTime: string; endTime: string }> {
  if (input.periodId) {
    const period = await prisma.period.findFirst({ where: { id: input.periodId, schoolId } });
    if (!period) throw new NotFoundError("Period not found");
    return { startTime: period.startTime, endTime: period.endTime };
  }
  if (!input.startTime || !input.endTime) {
    throw new ConflictError("Provide either a periodId or both startTime and endTime");
  }
  return { startTime: input.startTime, endTime: input.endTime };
}

export async function createEntry(schoolId: string, input: CreateTimetableEntryInput) {
  const { startTime, endTime } = await resolveEntryTimes(schoolId, input);
  await assertNoConflict(schoolId, { ...input, startTime, endTime });
  return prisma.timetableEntry.create({
    data: { schoolId, ...input, startTime, endTime },
    include: ENTRY_INCLUDE,
  });
}

export async function updateEntry(schoolId: string, id: string, input: UpdateTimetableEntryInput) {
  const existing = await findOrThrow(schoolId, id);
  const { startTime, endTime } =
    input.periodId || input.startTime || input.endTime
      ? await resolveEntryTimes(schoolId, {
          periodId: input.periodId,
          startTime: input.startTime ?? existing.startTime,
          endTime: input.endTime ?? existing.endTime,
        })
      : { startTime: existing.startTime, endTime: existing.endTime };

  await assertNoConflict(
    schoolId,
    {
      sectionId: existing.sectionId,
      teacherId: input.teacherId ?? existing.teacherId,
      dayOfWeek: input.dayOfWeek ?? existing.dayOfWeek,
      startTime,
      endTime,
    },
    id
  );
  return prisma.timetableEntry.update({
    where: { id },
    data: { ...input, startTime, endTime },
    include: ENTRY_INCLUDE,
  });
}

export async function deleteEntry(schoolId: string, id: string) {
  await findOrThrow(schoolId, id);
  await prisma.timetableEntry.delete({ where: { id } });
}

export function listBySection(schoolId: string, sectionId: string) {
  return prisma.timetableEntry.findMany({
    where: { schoolId, sectionId },
    include: ENTRY_INCLUDE,
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

export function listByTeacher(schoolId: string, teacherId: string) {
  return prisma.timetableEntry.findMany({
    where: { schoolId, teacherId },
    include: ENTRY_INCLUDE,
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

// =========================================================================
// Period master
// =========================================================================

export function listPeriods(schoolId: string) {
  return prisma.period.findMany({ where: { schoolId }, orderBy: { order: "asc" } });
}

async function findPeriodOrThrow(schoolId: string, id: string) {
  const period = await prisma.period.findFirst({ where: { id, schoolId } });
  if (!period) throw new NotFoundError("Period not found");
  return period;
}

export async function createPeriod(schoolId: string, input: CreatePeriodInput) {
  const existing = await prisma.period.findFirst({ where: { schoolId, name: input.name } });
  if (existing) throw new ConflictError(`A period named "${input.name}" already exists`);
  return prisma.period.create({ data: { schoolId, ...input } });
}

export async function updatePeriod(schoolId: string, id: string, input: UpdatePeriodInput) {
  await findPeriodOrThrow(schoolId, id);
  if (input.name) {
    const existing = await prisma.period.findFirst({ where: { schoolId, name: input.name, NOT: { id } } });
    if (existing) throw new ConflictError(`A period named "${input.name}" already exists`);
  }
  return prisma.period.update({ where: { id }, data: input });
}

export async function deletePeriod(schoolId: string, id: string) {
  await findPeriodOrThrow(schoolId, id);
  const inUse = await prisma.timetableEntry.count({ where: { periodId: id } });
  if (inUse > 0) throw new ConflictError("Cannot delete a period that is referenced by existing timetable entries");
  await prisma.period.delete({ where: { id } });
}
