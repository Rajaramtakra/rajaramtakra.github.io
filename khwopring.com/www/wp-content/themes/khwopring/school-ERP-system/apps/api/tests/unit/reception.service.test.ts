import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  enquiry: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  student: { findFirst: vi.fn() },
  studentGuardian: { findMany: vi.fn() },
  studentRequest: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  pTMMeeting: { create: vi.fn(), findFirst: vi.fn() },
  pTMAttendance: { upsert: vi.fn() },
  $transaction: vi.fn((arg: unknown) => (Array.isArray(arg) ? Promise.all(arg) : (arg as (tx: unknown) => unknown)(mockPrisma))),
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mockPrisma }));

const mockAdmissionService = vi.hoisted(() => ({
  createDraft: vi.fn(),
}));
vi.mock("../../src/modules/admissions/admission.service", () => mockAdmissionService);

import {
  convertEnquiry,
  createPtmMeeting,
  getSiblings,
  updateStudentRequestStatus,
} from "../../src/modules/reception/reception.service";

describe("reception.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("convertEnquiry", () => {
    it("rejects converting an enquiry that was already converted", async () => {
      mockPrisma.enquiry.findFirst.mockResolvedValue({ id: "enq_1", schoolId: "school_1", status: "CONVERTED" });

      await expect(convertEnquiry("school_1", "enq_1", "user_1", {} as never)).rejects.toThrow(/already been converted/i);

      expect(mockAdmissionService.createDraft).not.toHaveBeenCalled();
    });

    it("creates a draft admission application and marks the enquiry converted", async () => {
      mockPrisma.enquiry.findFirst.mockResolvedValue({ id: "enq_1", schoolId: "school_1", status: "NEW" });
      mockAdmissionService.createDraft.mockResolvedValue({ id: "app_1" });
      mockPrisma.enquiry.update.mockResolvedValue({ id: "enq_1", status: "CONVERTED", convertedAdmissionApplicationId: "app_1" });

      const result = await convertEnquiry("school_1", "enq_1", "user_1", { studentFirstName: "Ada" } as never);

      expect(mockAdmissionService.createDraft).toHaveBeenCalledWith("school_1", "user_1", { studentFirstName: "Ada" });
      expect(mockPrisma.enquiry.update).toHaveBeenCalledWith({
        where: { id: "enq_1" },
        data: { status: "CONVERTED", convertedAdmissionApplicationId: "app_1" },
      });
      expect(result.application).toEqual({ id: "app_1" });
    });
  });

  describe("getSiblings", () => {
    it("returns an empty list when the student has no guardians on file", async () => {
      mockPrisma.student.findFirst.mockResolvedValue({ id: "stu_1", schoolId: "school_1" });
      mockPrisma.studentGuardian.findMany.mockResolvedValueOnce([]);

      const result = await getSiblings("school_1", "stu_1");

      expect(result).toEqual([]);
    });

    it("finds other students sharing a guardian, deduplicated", async () => {
      mockPrisma.student.findFirst.mockResolvedValue({ id: "stu_1", schoolId: "school_1" });
      mockPrisma.studentGuardian.findMany
        .mockResolvedValueOnce([{ guardianId: "g_1" }, { guardianId: "g_2" }])
        .mockResolvedValueOnce([
          { student: { id: "stu_2", schoolId: "school_1", deletedAt: null } },
          { student: { id: "stu_2", schoolId: "school_1", deletedAt: null } },
          { student: { id: "stu_3", schoolId: "school_1", deletedAt: null } },
        ]);

      const result = await getSiblings("school_1", "stu_1");

      expect(result.map((s) => s.id).sort()).toEqual(["stu_2", "stu_3"]);
      expect(mockPrisma.studentGuardian.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ where: { guardianId: { in: ["g_1", "g_2"] }, studentId: { not: "stu_1" } } })
      );
    });
  });

  describe("updateStudentRequestStatus", () => {
    it("stamps resolvedAt/resolvedById when moving to RESOLVED", async () => {
      mockPrisma.studentRequest.findFirst.mockResolvedValue({ id: "req_1", schoolId: "school_1" });
      mockPrisma.studentRequest.update.mockResolvedValue({ id: "req_1", status: "RESOLVED" });

      await updateStudentRequestStatus("school_1", "req_1", "user_1", { status: "RESOLVED" });

      expect(mockPrisma.studentRequest.update).toHaveBeenCalledWith({
        where: { id: "req_1" },
        data: { status: "RESOLVED", resolvedAt: expect.any(Date), resolvedById: "user_1" },
      });
    });

    it("clears resolvedAt/resolvedById when moving back to OPEN", async () => {
      mockPrisma.studentRequest.findFirst.mockResolvedValue({ id: "req_1", schoolId: "school_1" });
      mockPrisma.studentRequest.update.mockResolvedValue({ id: "req_1", status: "OPEN" });

      await updateStudentRequestStatus("school_1", "req_1", "user_1", { status: "OPEN" });

      expect(mockPrisma.studentRequest.update).toHaveBeenCalledWith({
        where: { id: "req_1" },
        data: { status: "OPEN", resolvedAt: null, resolvedById: null },
      });
    });
  });

  describe("createPtmMeeting", () => {
    it("creates one attendance placeholder row per student", async () => {
      mockPrisma.pTMMeeting.create.mockResolvedValue({ id: "ptm_1" });

      await createPtmMeeting("school_1", "user_1", {
        title: "Term 1 PTM",
        scheduledAt: new Date("2026-08-01"),
        studentIds: ["stu_1", "stu_2"],
      });

      expect(mockPrisma.pTMMeeting.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schoolId: "school_1",
            createdById: "user_1",
            attendances: { create: [{ studentId: "stu_1" }, { studentId: "stu_2" }] },
          }),
        })
      );
    });
  });
});
