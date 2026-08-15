import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  student: { findFirst: vi.fn(), update: vi.fn() },
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mockPrisma }));

import { reinstateStudent, rusticateStudent } from "../../src/modules/students/student.service";

describe("student.service rustication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rusticateStudent", () => {
    it("moves an active student to RUSTICATED with a reason", async () => {
      mockPrisma.student.findFirst.mockResolvedValue({ id: "stu_1", schoolId: "school_1", status: "ACTIVE" });
      mockPrisma.student.update.mockResolvedValue({ id: "stu_1", status: "RUSTICATED" });

      await rusticateStudent("school_1", "stu_1", { reason: "Repeated disciplinary violations" });

      expect(mockPrisma.student.update).toHaveBeenCalledWith({
        where: { id: "stu_1" },
        data: { status: "RUSTICATED", suspensionReason: "Repeated disciplinary violations", suspendedUntil: undefined },
      });
    });

    it("rejects rusticating a student who is not currently active", async () => {
      mockPrisma.student.findFirst.mockResolvedValue({ id: "stu_1", schoolId: "school_1", status: "SUSPENDED" });

      await expect(rusticateStudent("school_1", "stu_1", { reason: "test" })).rejects.toThrow(/currently SUSPENDED/i);
      expect(mockPrisma.student.update).not.toHaveBeenCalled();
    });
  });

  describe("reinstateStudent", () => {
    it("reinstates a rusticated student back to ACTIVE", async () => {
      mockPrisma.student.findFirst.mockResolvedValue({ id: "stu_1", schoolId: "school_1", status: "RUSTICATED" });
      mockPrisma.student.update.mockResolvedValue({ id: "stu_1", status: "ACTIVE" });

      await reinstateStudent("school_1", "stu_1", {});

      expect(mockPrisma.student.update).toHaveBeenCalledWith({
        where: { id: "stu_1" },
        data: { status: "ACTIVE", suspensionReason: null, suspendedUntil: null },
      });
    });

    it("rejects reinstating a student who is neither suspended nor rusticated", async () => {
      mockPrisma.student.findFirst.mockResolvedValue({ id: "stu_1", schoolId: "school_1", status: "ACTIVE" });

      await expect(reinstateStudent("school_1", "stu_1", {})).rejects.toThrow(/only suspended or rusticated/i);
    });
  });
});
