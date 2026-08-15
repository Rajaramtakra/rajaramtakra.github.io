import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  studentAttendance: {
    upsert: vi.fn(),
    findMany: vi.fn(),
  },
  staffAttendance: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  student: { findFirst: vi.fn() },
  teacher: { findFirst: vi.fn() },
  staffMember: { findFirst: vi.fn() },
  $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mockPrisma }));

import {
  listStudentAttendanceForCaller,
  markStudentAttendance,
} from "../../src/modules/attendance/attendance.service";

describe("attendance.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks attendance for every entry via upsert keyed by studentId+date", async () => {
    mockPrisma.studentAttendance.upsert.mockResolvedValue({ id: "att_1" });

    const date = new Date("2026-07-14");
    await markStudentAttendance("school_1", "user_1", {
      sectionId: "sec_1",
      date,
      entries: [
        { studentId: "stu_1", status: "PRESENT" },
        { studentId: "stu_2", status: "ABSENT", remarks: "sick" },
      ],
    });

    expect(mockPrisma.studentAttendance.upsert).toHaveBeenCalledTimes(2);
    expect(mockPrisma.studentAttendance.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { studentId_date: { studentId: "stu_1", date } },
        create: expect.objectContaining({ status: "PRESENT", markedById: "user_1" }),
      })
    );
  });

  it("lets a caller with attendance_student:read query any studentId", async () => {
    mockPrisma.studentAttendance.findMany.mockResolvedValue([{ id: "rec_1" }]);

    await listStudentAttendanceForCaller(
      "school_1",
      { userId: "admin_1", permissions: ["attendance_student:read"] },
      { studentId: "stu_5" }
    );

    expect(mockPrisma.student.findFirst).not.toHaveBeenCalled();
    expect(mockPrisma.studentAttendance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ studentId: "stu_5" }) })
    );
  });

  it("forces a read_own caller to only see their own student record, ignoring any requested studentId", async () => {
    mockPrisma.student.findFirst.mockResolvedValue({ id: "own_student" });
    mockPrisma.studentAttendance.findMany.mockResolvedValue([]);

    await listStudentAttendanceForCaller(
      "school_1",
      { userId: "user_2", permissions: ["attendance_student:read_own"] },
      { studentId: "someone_elses_id" }
    );

    expect(mockPrisma.student.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: "user_2" }) })
    );
    expect(mockPrisma.studentAttendance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ studentId: "own_student" }) })
    );
  });

  it("throws when a read_own caller has no linked student profile", async () => {
    mockPrisma.student.findFirst.mockResolvedValue(null);

    await expect(
      listStudentAttendanceForCaller(
        "school_1",
        { userId: "user_3", permissions: ["attendance_student:read_own"] },
        {}
      )
    ).rejects.toThrow(/student profile/i);
  });
});
