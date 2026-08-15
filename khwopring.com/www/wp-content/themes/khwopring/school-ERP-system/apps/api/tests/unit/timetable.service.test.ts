import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  timetableEntry: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  period: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mockPrisma }));

import { createEntry, createPeriod, deletePeriod, updateEntry } from "../../src/modules/timetable/timetable.service";

function baseInput(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    sectionId: "sec_1",
    subjectId: "sub_1",
    teacherId: "tch_1",
    dayOfWeek: "MONDAY" as const,
    startTime: "09:00",
    endTime: "09:45",
    ...overrides,
  };
}

describe("timetable.service conflict detection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when end time is not after start time", async () => {
    await expect(createEntry("school_1", baseInput({ startTime: "10:00", endTime: "09:00" }))).rejects.toThrow(
      /end time/i
    );
  });

  it("creates an entry when no conflicts exist", async () => {
    mockPrisma.timetableEntry.findMany.mockResolvedValue([]);
    mockPrisma.timetableEntry.create.mockResolvedValue({ id: "entry_1", ...baseInput() });

    const result = await createEntry("school_1", baseInput());

    expect(result.id).toBe("entry_1");
    expect(mockPrisma.timetableEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ schoolId: "school_1", sectionId: "sec_1" }) })
    );
  });

  it("rejects when the section already has an overlapping class", async () => {
    mockPrisma.timetableEntry.findMany.mockResolvedValue([
      { id: "existing_1", sectionId: "sec_1", teacherId: "tch_2", startTime: "09:15", endTime: "10:00" },
    ]);

    await expect(createEntry("school_1", baseInput())).rejects.toThrow(/section already has a class/i);
  });

  it("rejects when the teacher is already scheduled elsewhere at an overlapping time", async () => {
    mockPrisma.timetableEntry.findMany.mockResolvedValue([
      { id: "existing_2", sectionId: "sec_2", teacherId: "tch_1", startTime: "09:30", endTime: "10:15" },
    ]);

    await expect(createEntry("school_1", baseInput())).rejects.toThrow(/teacher is already scheduled/i);
  });

  it("allows back-to-back slots that do not overlap", async () => {
    mockPrisma.timetableEntry.findMany.mockResolvedValue([
      { id: "existing_3", sectionId: "sec_1", teacherId: "tch_2", startTime: "08:00", endTime: "09:00" },
    ]);
    mockPrisma.timetableEntry.create.mockResolvedValue({ id: "entry_2", ...baseInput() });

    const result = await createEntry("school_1", baseInput());
    expect(result.id).toBe("entry_2");
  });

  it("excludes its own id from the conflict check when updating", async () => {
    mockPrisma.timetableEntry.findFirst.mockResolvedValue({
      id: "entry_1",
      schoolId: "school_1",
      sectionId: "sec_1",
      teacherId: "tch_1",
      dayOfWeek: "MONDAY",
      startTime: "09:00",
      endTime: "09:45",
    });
    mockPrisma.timetableEntry.findMany.mockResolvedValue([]);
    mockPrisma.timetableEntry.update.mockResolvedValue({ id: "entry_1", room: "Lab 2" });

    const result = await updateEntry("school_1", "entry_1", { room: "Lab 2" });

    expect(result.room).toBe("Lab 2");
    expect(mockPrisma.timetableEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: { not: "entry_1" } }) })
    );
  });

  describe("period-driven entries", () => {
    it("derives startTime/endTime from the referenced Period, ignoring any manually supplied times", async () => {
      mockPrisma.period.findFirst.mockResolvedValue({
        id: "period_1",
        schoolId: "school_1",
        startTime: "10:00",
        endTime: "10:45",
      });
      mockPrisma.timetableEntry.findMany.mockResolvedValue([]);
      mockPrisma.timetableEntry.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: "entry_3", ...data })
      );

      const result = await createEntry(
        "school_1",
        baseInput({ periodId: "period_1", startTime: "09:00", endTime: "09:15" }) as never
      );

      expect(result.startTime).toBe("10:00");
      expect(result.endTime).toBe("10:45");
    });

    it("throws when the referenced period does not belong to this school", async () => {
      mockPrisma.period.findFirst.mockResolvedValue(null);

      await expect(createEntry("school_1", baseInput({ periodId: "period_missing" }) as never)).rejects.toThrow(
        /period not found/i
      );
      expect(mockPrisma.timetableEntry.create).not.toHaveBeenCalled();
    });
  });
});

describe("timetable.service - Period master", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createPeriod", () => {
    it("rejects a duplicate period name within the same school", async () => {
      mockPrisma.period.findFirst.mockResolvedValue({ id: "period_1", name: "Period 1" });

      await expect(
        createPeriod("school_1", { name: "Period 1", order: 1, startTime: "09:00", endTime: "09:45", isBreak: false })
      ).rejects.toThrow(/already exists/i);
      expect(mockPrisma.period.create).not.toHaveBeenCalled();
    });
  });

  describe("deletePeriod", () => {
    it("refuses to delete a period still referenced by timetable entries", async () => {
      mockPrisma.period.findFirst.mockResolvedValue({ id: "period_1", schoolId: "school_1" });
      mockPrisma.timetableEntry.count.mockResolvedValue(3);

      await expect(deletePeriod("school_1", "period_1")).rejects.toThrow(/referenced by existing timetable/i);
      expect(mockPrisma.period.delete).not.toHaveBeenCalled();
    });

    it("deletes a period with no referencing timetable entries", async () => {
      mockPrisma.period.findFirst.mockResolvedValue({ id: "period_1", schoolId: "school_1" });
      mockPrisma.timetableEntry.count.mockResolvedValue(0);
      mockPrisma.period.delete.mockResolvedValue({ id: "period_1" });

      await deletePeriod("school_1", "period_1");

      expect(mockPrisma.period.delete).toHaveBeenCalledWith({ where: { id: "period_1" } });
    });
  });
});
