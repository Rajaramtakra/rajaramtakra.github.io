import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  hostel: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  hostelRoom: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  hostelAllocation: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  },
  staffMember: { findFirst: vi.fn() },
  student: { findFirst: vi.fn() },
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mockPrisma }));

import { checkoutAllocation, createAllocation, createHostel, createHostelRoom } from "../../src/modules/hostel/hostel.service";

describe("hostel.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.hostelAllocation.groupBy.mockResolvedValue([]);
  });

  describe("createHostel", () => {
    it("rejects a duplicate hostel name within the same school", async () => {
      mockPrisma.hostel.findFirst.mockResolvedValue({ id: "hostel_1", name: "Boys Hostel" });

      await expect(createHostel("school_1", { name: "Boys Hostel", totalCapacity: 100 })).rejects.toThrow(
        /already exists/i
      );
      expect(mockPrisma.hostel.create).not.toHaveBeenCalled();
    });

    it("validates the warden staff member belongs to this school", async () => {
      mockPrisma.hostel.findFirst.mockResolvedValue(null);
      mockPrisma.staffMember.findFirst.mockResolvedValue(null);

      await expect(
        createHostel("school_1", { name: "Girls Hostel", totalCapacity: 50, wardenStaffId: "staff_missing" })
      ).rejects.toThrow(/staff member not found/i);
    });
  });

  describe("createHostelRoom", () => {
    it("rejects a duplicate room number within the same hostel", async () => {
      mockPrisma.hostel.findFirst.mockResolvedValue({ id: "hostel_1", schoolId: "school_1" });
      mockPrisma.hostelRoom.findFirst.mockResolvedValue({ id: "room_1", roomNumber: "101" });

      await expect(
        createHostelRoom("school_1", { hostelId: "hostel_1", roomNumber: "101", capacity: 4 })
      ).rejects.toThrow(/already exists/i);
      expect(mockPrisma.hostelRoom.create).not.toHaveBeenCalled();
    });
  });

  describe("createAllocation", () => {
    it("rejects allocating a student who already has an active allocation", async () => {
      mockPrisma.hostelRoom.findFirst.mockResolvedValue({ id: "room_1", roomNumber: "101", capacity: 4 });
      mockPrisma.student.findFirst.mockResolvedValue({ id: "stu_1", schoolId: "school_1" });
      mockPrisma.hostelAllocation.findFirst.mockResolvedValue({ id: "alloc_existing", status: "ACTIVE" });

      await expect(createAllocation("school_1", { hostelRoomId: "room_1", studentId: "stu_1" })).rejects.toThrow(
        /already has an active hostel allocation/i
      );
      expect(mockPrisma.hostelAllocation.create).not.toHaveBeenCalled();
    });

    it("rejects allocating into a room already at full capacity", async () => {
      mockPrisma.hostelRoom.findFirst.mockResolvedValue({ id: "room_1", roomNumber: "101", capacity: 2 });
      mockPrisma.student.findFirst.mockResolvedValue({ id: "stu_1", schoolId: "school_1" });
      mockPrisma.hostelAllocation.findFirst.mockResolvedValue(null);
      mockPrisma.hostelAllocation.count.mockResolvedValue(2);

      await expect(createAllocation("school_1", { hostelRoomId: "room_1", studentId: "stu_1" })).rejects.toThrow(
        /full capacity/i
      );
      expect(mockPrisma.hostelAllocation.create).not.toHaveBeenCalled();
    });

    it("creates an allocation when the room has free capacity", async () => {
      mockPrisma.hostelRoom.findFirst.mockResolvedValue({ id: "room_1", roomNumber: "101", capacity: 2 });
      mockPrisma.student.findFirst.mockResolvedValue({ id: "stu_1", schoolId: "school_1" });
      mockPrisma.hostelAllocation.findFirst.mockResolvedValue(null);
      mockPrisma.hostelAllocation.count.mockResolvedValue(1);
      mockPrisma.hostelAllocation.create.mockResolvedValue({ id: "alloc_1", status: "ACTIVE" });

      const allocation = await createAllocation("school_1", { hostelRoomId: "room_1", studentId: "stu_1" });

      expect(allocation.id).toBe("alloc_1");
      expect(mockPrisma.hostelAllocation.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ hostelRoomId: "room_1", studentId: "stu_1", status: "ACTIVE" }) })
      );
    });
  });

  describe("checkoutAllocation", () => {
    it("rejects checking out an allocation that is already checked out", async () => {
      mockPrisma.hostelAllocation.findFirst.mockResolvedValue({ id: "alloc_1", status: "CHECKED_OUT" });

      await expect(checkoutAllocation("school_1", "alloc_1")).rejects.toThrow(/already checked out/i);
      expect(mockPrisma.hostelAllocation.update).not.toHaveBeenCalled();
    });

    it("checks out an active allocation", async () => {
      mockPrisma.hostelAllocation.findFirst.mockResolvedValue({ id: "alloc_1", status: "ACTIVE" });
      mockPrisma.hostelAllocation.update.mockResolvedValue({ id: "alloc_1", status: "CHECKED_OUT" });

      const result = await checkoutAllocation("school_1", "alloc_1");

      expect(result.status).toBe("CHECKED_OUT");
      expect(mockPrisma.hostelAllocation.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "alloc_1" }, data: expect.objectContaining({ status: "CHECKED_OUT" }) })
      );
    });
  });
});
