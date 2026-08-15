import type {
  AssignSectionCoordinatorInput,
  AssignSubjectInput,
  CreateAcademicSessionInput,
  CreateChapterInput,
  CreateClassInput,
  CreateSectionInput,
  CreateSubjectInput,
  CreateSyllabusInput,
  UpdateChapterInput,
  UpdateSyllabusInput,
} from "@erp/shared";
import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";

// --- Academic Sessions ---

export async function createAcademicSession(schoolId: string, input: CreateAcademicSessionInput) {
  if (input.isCurrent) {
    await prisma.academicSession.updateMany({ where: { schoolId, isCurrent: true }, data: { isCurrent: false } });
  }
  return prisma.academicSession.create({
    data: { schoolId, name: input.name, startDate: input.startDate, endDate: input.endDate, isCurrent: input.isCurrent ?? false },
  });
}

export function listAcademicSessions(schoolId: string) {
  return prisma.academicSession.findMany({ where: { schoolId, deletedAt: null }, orderBy: { startDate: "desc" } });
}

export async function setCurrentSession(schoolId: string, sessionId: string) {
  const session = await prisma.academicSession.findFirst({ where: { id: sessionId, schoolId } });
  if (!session) throw new NotFoundError("Academic session not found");

  await prisma.$transaction([
    prisma.academicSession.updateMany({ where: { schoolId, isCurrent: true }, data: { isCurrent: false } }),
    prisma.academicSession.update({ where: { id: sessionId }, data: { isCurrent: true } }),
  ]);
  return prisma.academicSession.findUniqueOrThrow({ where: { id: sessionId } });
}

// --- Classes ---

export function createClass(schoolId: string, input: CreateClassInput) {
  return prisma.class.create({
    data: { schoolId, academicSessionId: input.academicSessionId, name: input.name, order: input.order },
  });
}

export function listClasses(schoolId: string, academicSessionId?: string) {
  return prisma.class.findMany({
    where: { schoolId, deletedAt: null, ...(academicSessionId ? { academicSessionId } : {}) },
    include: { sections: { where: { deletedAt: null } } },
    orderBy: { order: "asc" },
  });
}

// --- Sections ---

export function createSection(schoolId: string, input: CreateSectionInput) {
  return prisma.section.create({
    data: {
      schoolId,
      classId: input.classId,
      name: input.name,
      capacity: input.capacity,
      classTeacherId: input.classTeacherId,
    },
  });
}

export function listSections(schoolId: string, classId?: string) {
  return prisma.section.findMany({
    where: { schoolId, deletedAt: null, ...(classId ? { classId } : {}) },
    include: { class: true, classTeacher: true, coordinatorTeacher: true, _count: { select: { students: true } } },
    orderBy: { name: "asc" },
  });
}

export async function assignSectionCoordinator(schoolId: string, sectionId: string, input: AssignSectionCoordinatorInput) {
  const section = await prisma.section.findFirst({ where: { id: sectionId, schoolId, deletedAt: null } });
  if (!section) throw new NotFoundError("Section not found");
  return prisma.section.update({
    where: { id: sectionId },
    data: { coordinatorTeacherId: input.coordinatorTeacherId },
    include: { class: true, classTeacher: true, coordinatorTeacher: true },
  });
}

// --- Subjects ---

export function createSubject(schoolId: string, input: CreateSubjectInput) {
  return prisma.subject.create({
    data: { schoolId, name: input.name, code: input.code, isElective: input.isElective },
  });
}

export function listSubjects(schoolId: string) {
  return prisma.subject.findMany({ where: { schoolId, deletedAt: null }, orderBy: { name: "asc" } });
}

export async function assignSubject(schoolId: string, input: AssignSubjectInput) {
  return prisma.subjectAssignment.upsert({
    where: { subjectId_sectionId: { subjectId: input.subjectId, sectionId: input.sectionId } },
    create: { schoolId, subjectId: input.subjectId, sectionId: input.sectionId, teacherId: input.teacherId },
    update: { teacherId: input.teacherId },
  });
}

export function listSubjectAssignments(schoolId: string, sectionId?: string) {
  return prisma.subjectAssignment.findMany({
    where: { schoolId, ...(sectionId ? { sectionId } : {}) },
    include: { subject: true, teacher: true, section: true },
  });
}

// --- Syllabus & Chapters ---

const SYLLABUS_INCLUDE = {
  subject: true,
  class: true,
  academicSession: true,
  chapters: { orderBy: { order: "asc" as const } },
};

export function createSyllabus(schoolId: string, input: CreateSyllabusInput) {
  return prisma.syllabus.create({
    data: {
      schoolId,
      subjectId: input.subjectId,
      classId: input.classId,
      academicSessionId: input.academicSessionId,
      title: input.title,
      description: input.description,
    },
    include: SYLLABUS_INCLUDE,
  });
}

export function listSyllabi(schoolId: string, filters: { classId?: string; subjectId?: string; academicSessionId?: string }) {
  return prisma.syllabus.findMany({
    where: {
      schoolId,
      ...(filters.classId ? { classId: filters.classId } : {}),
      ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
      ...(filters.academicSessionId ? { academicSessionId: filters.academicSessionId } : {}),
    },
    include: SYLLABUS_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

async function findSyllabusOrThrow(schoolId: string, id: string) {
  const syllabus = await prisma.syllabus.findFirst({ where: { id, schoolId }, include: SYLLABUS_INCLUDE });
  if (!syllabus) throw new NotFoundError("Syllabus not found");
  return syllabus;
}

export async function getSyllabus(schoolId: string, id: string) {
  return findSyllabusOrThrow(schoolId, id);
}

export async function updateSyllabus(schoolId: string, id: string, input: UpdateSyllabusInput) {
  await findSyllabusOrThrow(schoolId, id);
  return prisma.syllabus.update({
    where: { id },
    data: { title: input.title, description: input.description },
    include: SYLLABUS_INCLUDE,
  });
}

export async function createChapter(schoolId: string, syllabusId: string, input: CreateChapterInput) {
  await findSyllabusOrThrow(schoolId, syllabusId);
  return prisma.chapter.create({
    data: { syllabusId, title: input.title, order: input.order, description: input.description },
  });
}

async function findChapterOrThrow(schoolId: string, id: string) {
  const chapter = await prisma.chapter.findFirst({ where: { id, syllabus: { schoolId } } });
  if (!chapter) throw new NotFoundError("Chapter not found");
  return chapter;
}

export async function updateChapter(schoolId: string, id: string, input: UpdateChapterInput) {
  await findChapterOrThrow(schoolId, id);
  return prisma.chapter.update({
    where: { id },
    data: {
      title: input.title,
      order: input.order,
      description: input.description,
      isCompleted: input.isCompleted,
    },
  });
}

export async function deleteChapter(schoolId: string, id: string) {
  await findChapterOrThrow(schoolId, id);
  await prisma.chapter.delete({ where: { id } });
}
