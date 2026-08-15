import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  announcement: { findFirst: vi.fn(), update: vi.fn() },
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mockPrisma }));

import { setAnnouncementPin } from "../../src/modules/communication/announcement.service";

describe("announcement.service — pin/popup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects pinning an announcement that does not belong to this school", async () => {
    mockPrisma.announcement.findFirst.mockResolvedValue(null);

    await expect(setAnnouncementPin("school_1", "ann_1", { pinned: true })).rejects.toThrow(/announcement not found/i);
    expect(mockPrisma.announcement.update).not.toHaveBeenCalled();
  });

  it("pins an announcement with an optional popup expiry", async () => {
    mockPrisma.announcement.findFirst.mockResolvedValue({ id: "ann_1", schoolId: "school_1" });
    const popupUntil = new Date("2026-08-01T00:00:00.000Z");
    mockPrisma.announcement.update.mockResolvedValue({ id: "ann_1", pinned: true, popupUntil });

    const result = await setAnnouncementPin("school_1", "ann_1", { pinned: true, popupUntil });

    expect(result.pinned).toBe(true);
    expect(mockPrisma.announcement.update).toHaveBeenCalledWith({
      where: { id: "ann_1" },
      data: { pinned: true, popupUntil },
    });
  });

  it("unpins an announcement", async () => {
    mockPrisma.announcement.findFirst.mockResolvedValue({ id: "ann_1", schoolId: "school_1" });
    mockPrisma.announcement.update.mockResolvedValue({ id: "ann_1", pinned: false });

    const result = await setAnnouncementPin("school_1", "ann_1", { pinned: false });

    expect(result.pinned).toBe(false);
  });
});
