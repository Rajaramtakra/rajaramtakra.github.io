import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";
import { generateBulkAdmitCardsPdf, type AdmitCardInput } from "./admitCard.pdf";

export async function bulkGenerateAdmitCardsPdf(schoolId: string, examId: string, sectionId: string): Promise<Buffer> {
  const exam = await prisma.exam.findFirst({
    where: { id: examId, schoolId, deletedAt: null },
    include: { academicSession: true },
  });
  if (!exam) throw new NotFoundError("Exam not found");

  const section = await prisma.section.findFirst({
    where: { id: sectionId, schoolId, deletedAt: null },
    include: { class: true },
  });
  if (!section) throw new NotFoundError("Section not found");

  const schedules = await prisma.examSchedule.findMany({
    where: { examId, sectionId },
    include: { subject: true },
    orderBy: { examDate: "asc" },
  });
  if (schedules.length === 0) throw new NotFoundError("No exam schedules found for this exam and section");

  const students = await prisma.student.findMany({
    where: { schoolId, sectionId, deletedAt: null, status: "ACTIVE" },
    orderBy: { rollNumber: "asc" },
  });
  if (students.length === 0) throw new NotFoundError("No active students found in this section");

  const school = await prisma.school.findUniqueOrThrow({ where: { id: schoolId } });

  const cards: AdmitCardInput[] = students.map((student) => ({
    school: { name: school.name, address: school.address },
    examName: exam.name,
    academicSessionName: exam.academicSession.name,
    studentName: `${student.firstName} ${student.lastName}`,
    registrationNumber: student.registrationNumber,
    rollNumber: student.rollNumber,
    className: section.class.name,
    sectionName: section.name,
    schedules: schedules.map((s) => ({
      subjectName: s.subject.name,
      examDate: s.examDate,
      startTime: s.startTime,
      endTime: s.endTime,
      maxMarks: Number(s.maxMarks),
    })),
  }));

  return generateBulkAdmitCardsPdf(cards);
}
