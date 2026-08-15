import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  holiday: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mockPrisma }));

import { createHoliday, deleteHoliday, listHolidays } from "../../src/modules/settings/holiday.service";

describe("holiday.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a holiday scoped to the school", async () => {
    mockPrisma.holiday.create.mockResolvedValue({ id: "hol_1", name: "Independence Day" });

    await createHoliday("school_1", { name: "Independence Day", date: new Date("2026-08-15"), recurring: true });

    expect(mockPrisma.holiday.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ schoolId: "school_1", name: "Independence Day", recurring: true }),
      })
    );
  });

  it("lists holidays ordered by date", async () => {
    mockPrisma.holiday.findMany.mockResolvedValue([]);
    await listHolidays("school_1");
    expect(mockPrisma.holiday.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { schoolId: "school_1" }, orderBy: { date: "asc" } })
    );
  });

  it("rejects deleting a holiday that does not belong to this school", async () => {
    mockPrisma.holiday.findFirst.mockResolvedValue(null);
    await expect(deleteHoliday("school_1", "hol_missing")).rejects.toThrow(/not found/i);
    expect(mockPrisma.holiday.delete).not.toHaveBeenCalled();
  });
});
