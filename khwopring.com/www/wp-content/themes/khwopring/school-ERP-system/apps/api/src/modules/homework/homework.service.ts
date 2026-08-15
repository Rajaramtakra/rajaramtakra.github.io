import type { CreateHomeworkInput, HomeworkSearchInput, UpdateHomeworkInput } from "@erp/shared";
import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";
import { storage } from "../../lib/storage";
import { getTeacherByUserId } from "../teachers/teacher.service";

const HOMEWORK_INCLUDE = {
  section: { include: { class: true } },
  subject: true,
  teacher: { select: { id: true, firstName: true, lastName: true } },
} as const;

async function findOrThrow(schoolId: string, id: string) {
  const homework = await prisma.homework.findFirst({
    where: { id, schoolId, deletedAt: null },
    include: HOMEWORK_INCLUDE,
  });
  if (!homework) throw new NotFoundError("Homework not found");
  return homework;
}

export async function getHomework(schoolId: string, id: string) {
  return findOrThrow(schoolId, id);
}

export function listHomework(schoolId: string, filters: HomeworkSearchInput) {
  return prisma.homework.findMany({
    where: {
      schoolId,
      deletedAt: null,
      ...(filters.sectionId ? { sectionId: filters.sectionId } : {}),
      ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
    },
    include: HOMEWORK_INCLUDE,
    orderBy: { dueDate: "desc" },
  });
}

export async function createHomework(
  schoolId: string,
  userId: string,
  input: CreateHomeworkInput,
  file?: Express.Multer.File
) {
  const teacher = await getTeacherByUserId(schoolId, userId);

  let attachmentUrl: string | undefined;
  if (file) {
    const saved = await storage.save(file.buffer, file.originalname, `homework/${schoolId}`);
    attachmentUrl = saved.filePath;
  }

  return prisma.homework.create({
    data: {
      schoolId,
      teacherId: teacher.id,
      sectionId: input.sectionId,
      subjectId: input.subjectId,
      title: input.title,
      description: input.description,
      dueDate: input.dueDate,
      attachmentUrl,
    },
    include: HOMEWORK_INCLUDE,
  });
}

export async function updateHomework(
  schoolId: string,
  id: string,
  input: UpdateHomeworkInput,
  file?: Express.Multer.File
) {
  await findOrThrow(schoolId, id);

  let attachmentUrl: string | undefined;
  if (file) {
    const saved = await storage.save(file.buffer, file.originalname, `homework/${schoolId}`);
    attachmentUrl = saved.filePath;
  }

  return prisma.homework.update({
    where: { id },
    data: { ...input, ...(attachmentUrl ? { attachmentUrl } : {}) },
    include: HOMEWORK_INCLUDE,
  });
}

export async function deleteHomework(schoolId: string, id: string) {
  await findOrThrow(schoolId, id);
  await prisma.homework.update({ where: { id }, data: { deletedAt: new Date() } });
}
