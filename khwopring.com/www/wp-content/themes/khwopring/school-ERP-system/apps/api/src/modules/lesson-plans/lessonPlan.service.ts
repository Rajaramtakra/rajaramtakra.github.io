import type { CreateLessonPlanInput, LessonPlanSearchInput, UpdateLessonPlanInput } from "@erp/shared";
import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";
import { getTeacherByUserId } from "../teachers/teacher.service";

const LESSON_PLAN_INCLUDE = {
  section: { include: { class: true } },
  subject: true,
} as const;

async function findOrThrow(schoolId: string, teacherId: string, id: string) {
  const plan = await prisma.lessonPlan.findFirst({
    where: { id, schoolId, teacherId, deletedAt: null },
    include: LESSON_PLAN_INCLUDE,
  });
  if (!plan) throw new NotFoundError("Lesson plan not found");
  return plan;
}

export async function listMyLessonPlans(schoolId: string, userId: string, filters: LessonPlanSearchInput) {
  const teacher = await getTeacherByUserId(schoolId, userId);
  return prisma.lessonPlan.findMany({
    where: {
      schoolId,
      teacherId: teacher.id,
      deletedAt: null,
      ...(filters.sectionId ? { sectionId: filters.sectionId } : {}),
      ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
    },
    include: LESSON_PLAN_INCLUDE,
    orderBy: { plannedDate: "desc" },
  });
}

export async function createLessonPlan(schoolId: string, userId: string, input: CreateLessonPlanInput) {
  const teacher = await getTeacherByUserId(schoolId, userId);
  return prisma.lessonPlan.create({
    data: { schoolId, teacherId: teacher.id, ...input },
    include: LESSON_PLAN_INCLUDE,
  });
}

export async function updateLessonPlan(schoolId: string, userId: string, id: string, input: UpdateLessonPlanInput) {
  const teacher = await getTeacherByUserId(schoolId, userId);
  await findOrThrow(schoolId, teacher.id, id);
  return prisma.lessonPlan.update({ where: { id }, data: input, include: LESSON_PLAN_INCLUDE });
}

export async function deleteLessonPlan(schoolId: string, userId: string, id: string) {
  const teacher = await getTeacherByUserId(schoolId, userId);
  await findOrThrow(schoolId, teacher.id, id);
  await prisma.lessonPlan.update({ where: { id }, data: { deletedAt: new Date() } });
}
