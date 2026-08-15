import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  exam: { findFirst: vi.fn() },
  examSchedule: { findFirst: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
  gradeScale: { findMany: vi.fn() },
  mark: { upsert: vi.fn(), findMany: vi.fn() },
  section: { findFirst: vi.fn() },
  student: { findMany: vi.fn(), findFirst: vi.fn() },
  reportCard: { findMany: vi.fn(), upsert: vi.fn() },
  coScholasticGrade: { upsert: vi.fn() },
  $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("../../src/lib/storage", () => ({
  storage: { save: vi.fn().mockResolvedValue({ filePath: "report-cards/exam_1/x.pdf", fileName: "x.pdf" }) },
}));
vi.mock("../../src/modules/exams/reportCard.pdf", () => ({
  generateReportCardPdf: vi.fn().mockResolvedValue(Buffer.from("pdf-bytes")),
}));

import { enterMarks, upsertCoScholasticGrade } from "../../src/modules/exams/exam.service";
import { publishReportCards } from "../../src/modules/exams/reportCard.service";

describe("exam.service - enterMarks grade calculation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves the matching GradeScale row from percentage and denormalizes it onto the Mark", async () => {
    mockPrisma.examSchedule.findFirst.mockResolvedValue({
      id: "sched_1",
      examId: "exam_1",
      maxMarks: 100,
      exam: { id: "exam_1", schoolId: "school_1" },
    });
    mockPrisma.gradeScale.findMany.mockResolvedValue([
      { minPercent: 90, maxPercent: 100, grade: "A+", gpaPoint: 4 },
      { minPercent: 80, maxPercent: 89.99, grade: "A", gpaPoint: 3.7 },
      { minPercent: 0, maxPercent: 79.99, grade: "B", gpaPoint: 3 },
    ]);
    mockPrisma.mark.upsert.mockResolvedValue({ id: "mark_1" });

    await enterMarks("school_1", "teacher_1", {
      examScheduleId: "sched_1",
      entries: [
        { studentId: "stu_1", marksObtained: 95 },
        { studentId: "stu_2", marksObtained: 82 },
      ],
    });

    expect(mockPrisma.mark.upsert).toHaveBeenCalledTimes(2);
    expect(mockPrisma.mark.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { examScheduleId_studentId: { examScheduleId: "sched_1", studentId: "stu_1" } },
        create: expect.objectContaining({ marksObtained: 95, grade: "A+" }),
      })
    );
    expect(mockPrisma.mark.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ marksObtained: 82, grade: "A" }),
      })
    );
  });

  it("rejects marksObtained greater than the schedule's maxMarks", async () => {
    mockPrisma.examSchedule.findFirst.mockResolvedValue({
      id: "sched_1",
      examId: "exam_1",
      maxMarks: 100,
      exam: { id: "exam_1", schoolId: "school_1" },
    });
    mockPrisma.gradeScale.findMany.mockResolvedValue([]);

    await expect(
      enterMarks("school_1", "teacher_1", {
        examScheduleId: "sched_1",
        entries: [{ studentId: "stu_1", marksObtained: 150 }],
      })
    ).rejects.toThrow(/cannot exceed max marks/i);

    expect(mockPrisma.mark.upsert).not.toHaveBeenCalled();
  });
});

describe("reportCard.service - publish guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function seedHappyPath() {
    mockPrisma.exam.findFirst.mockResolvedValue({
      id: "exam_1",
      schoolId: "school_1",
      academicSessionId: "sess_1",
    });
    mockPrisma.section.findFirst.mockResolvedValue({
      id: "sec_1",
      name: "A",
      class: { name: "Grade 5" },
    });
    mockPrisma.student.findMany.mockResolvedValue([
      { id: "stu_1", firstName: "Jane", lastName: "Doe", registrationNumber: "R1" },
    ]);
    mockPrisma.examSchedule.findMany.mockResolvedValue([
      {
        id: "sched_1",
        examId: "exam_1",
        subjectId: "sub_1",
        sectionId: "sec_1",
        maxMarks: 100,
        subject: { name: "Math" },
        marks: [{ studentId: "stu_1", marksObtained: 90, grade: "A+" }],
      },
    ]);
    mockPrisma.gradeScale.findMany.mockResolvedValue([{ minPercent: 90, maxPercent: 100, grade: "A+", gpaPoint: 4 }]);
  }

  it("blocks publishing when a report card for this exam+section is already published", async () => {
    seedHappyPath();
    mockPrisma.reportCard.findMany.mockResolvedValue([{ id: "rc_1", studentId: "stu_1", publishedAt: new Date() }]);

    await expect(publishReportCards("school_1", { examId: "exam_1", sectionId: "sec_1" })).rejects.toThrow(
      /already published/i
    );

    expect(mockPrisma.reportCard.upsert).not.toHaveBeenCalled();
  });

  it("publishes and persists totals/rank/gpa when nothing is published yet", async () => {
    seedHappyPath();
    mockPrisma.reportCard.findMany.mockResolvedValue([]);
    mockPrisma.reportCard.upsert.mockResolvedValue({ id: "rc_1", publishedAt: new Date() });

    const results = await publishReportCards("school_1", { examId: "exam_1", sectionId: "sec_1" });

    expect(results).toHaveLength(1);
    expect(mockPrisma.reportCard.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { studentId_examId: { studentId: "stu_1", examId: "exam_1" } },
        create: expect.objectContaining({ totalMarks: 90, percentage: 90, rank: 1 }),
      })
    );
  });
});

describe("exam.service - co-scholastic grading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects grading a student who does not belong to this school", async () => {
    mockPrisma.exam.findFirst.mockResolvedValue({ id: "exam_1", schoolId: "school_1" });
    mockPrisma.student.findFirst.mockResolvedValue(null);

    await expect(
      upsertCoScholasticGrade("school_1", "teacher_1", {
        studentId: "stu_1",
        examId: "exam_1",
        activity: "Discipline",
        grade: "A",
      })
    ).rejects.toThrow(/not found/i);

    expect(mockPrisma.coScholasticGrade.upsert).not.toHaveBeenCalled();
  });

  it("upserts on the (studentId, examId, activity) key so re-grading the same activity overwrites it", async () => {
    mockPrisma.exam.findFirst.mockResolvedValue({ id: "exam_1", schoolId: "school_1" });
    mockPrisma.student.findFirst.mockResolvedValue({ id: "stu_1", schoolId: "school_1" });
    mockPrisma.coScholasticGrade.upsert.mockResolvedValue({ id: "csg_1" });

    await upsertCoScholasticGrade("school_1", "teacher_1", {
      studentId: "stu_1",
      examId: "exam_1",
      activity: "Discipline",
      grade: "A",
      remarks: "Excellent",
    });

    expect(mockPrisma.coScholasticGrade.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { studentId_examId_activity: { studentId: "stu_1", examId: "exam_1", activity: "Discipline" } },
        create: expect.objectContaining({ grade: "A", remarks: "Excellent", enteredById: "teacher_1" }),
        update: expect.objectContaining({ grade: "A", remarks: "Excellent", enteredById: "teacher_1" }),
      })
    );
  });
});
