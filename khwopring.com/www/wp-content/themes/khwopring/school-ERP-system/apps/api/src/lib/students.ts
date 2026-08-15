import { prisma } from "./prisma";
import { NotFoundError } from "./errors";

/** Resolves the Student record linked to a logged-in user's own account. */
export async function getOwnStudentId(schoolId: string, userId: string) {
  const student = await prisma.student.findFirst({ where: { userId, schoolId, deletedAt: null } });
  if (!student) throw new NotFoundError("Student profile not found for this user");
  return student.id;
}
