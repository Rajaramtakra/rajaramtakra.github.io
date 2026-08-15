import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  staffMember: { findFirst: vi.fn(), update: vi.fn() },
  staffPromotionHistory: { findMany: vi.fn() },
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mockPrisma }));

import { listPromotionHistory, promoteStaffMember } from "../../src/modules/hr/staffMember.service";

describe("staffMember.service — promotions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("promoteStaffMember", () => {
    it("rejects promoting a staff member that does not belong to this school", async () => {
      mockPrisma.staffMember.findFirst.mockResolvedValue(null);

      await expect(
        promoteStaffMember("school_1", "staff_1", "admin_1", { toDesignation: "Senior Teacher", toDepartment: "Academics" })
      ).rejects.toThrow(/staff member not found/i);
      expect(mockPrisma.staffMember.update).not.toHaveBeenCalled();
    });

    it("updates designation/department and records promotion history", async () => {
      mockPrisma.staffMember.findFirst.mockResolvedValue({
        id: "staff_1",
        schoolId: "school_1",
        designation: "Teacher",
        department: "Academics",
      });
      mockPrisma.staffMember.update.mockResolvedValue({ id: "staff_1", designation: "Senior Teacher" });

      const result = await promoteStaffMember("school_1", "staff_1", "admin_1", {
        toDesignation: "Senior Teacher",
        toDepartment: "Academics",
        remarks: "Great performance",
      });

      expect(result.designation).toBe("Senior Teacher");
      expect(mockPrisma.staffMember.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "staff_1" },
          data: expect.objectContaining({
            designation: "Senior Teacher",
            department: "Academics",
            promotionHistory: {
              create: expect.objectContaining({
                fromDesignation: "Teacher",
                toDesignation: "Senior Teacher",
                fromDepartment: "Academics",
                toDepartment: "Academics",
                remarks: "Great performance",
                promotedById: "admin_1",
              }),
            },
          }),
        })
      );
    });
  });

  describe("listPromotionHistory", () => {
    it("scopes lookup to the staff member within this school", async () => {
      mockPrisma.staffPromotionHistory.findMany.mockResolvedValue([{ id: "promo_1" }]);

      const result = await listPromotionHistory("school_1", "staff_1");

      expect(result).toHaveLength(1);
      expect(mockPrisma.staffPromotionHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { staff: { id: "staff_1", schoolId: "school_1" } } })
      );
    });
  });
});
