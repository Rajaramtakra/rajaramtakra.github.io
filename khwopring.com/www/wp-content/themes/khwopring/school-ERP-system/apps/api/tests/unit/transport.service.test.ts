import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  route: { findFirst: vi.fn() },
  student: { findFirst: vi.fn() },
  pickupPoint: { findFirst: vi.fn() },
  vehicle: { findFirst: vi.fn() },
  fuelLog: { create: vi.fn(), findMany: vi.fn() },
  routeAssignment: {
    findFirst: vi.fn(),
    count: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(),
  },
  $transaction: vi.fn((fn: (tx: unknown) => unknown) => fn(mockPrisma)),
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mockPrisma }));

import {
  assignStudentToRoute,
  bulkAssignStudentsToRoute,
  createFuelLog,
} from "../../src/modules/transport/transport.service";

describe("transport.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a new assignment when the route's vehicle is already at full capacity", async () => {
    mockPrisma.route.findFirst.mockResolvedValue({
      id: "route_1",
      schoolId: "school_1",
      vehicle: { id: "veh_1", capacity: 2 },
    });
    mockPrisma.student.findFirst.mockResolvedValue({ id: "stu_1", sectionId: "sec_1" });
    mockPrisma.routeAssignment.findFirst.mockResolvedValue(null);
    mockPrisma.routeAssignment.count.mockResolvedValue(2);

    await expect(assignStudentToRoute("school_1", { routeId: "route_1", studentId: "stu_1" })).rejects.toThrow(
      /capacity/i
    );

    expect(mockPrisma.routeAssignment.create).not.toHaveBeenCalled();
  });

  it("replaces a student's prior assignment when reassigning to a different route", async () => {
    mockPrisma.route.findFirst.mockResolvedValue({
      id: "route_2",
      schoolId: "school_1",
      vehicle: { id: "veh_2", capacity: 5 },
    });
    mockPrisma.student.findFirst.mockResolvedValue({ id: "stu_1", sectionId: "sec_1" });
    mockPrisma.routeAssignment.findFirst.mockResolvedValue({
      id: "assign_old",
      routeId: "route_1",
      studentId: "stu_1",
    });
    mockPrisma.routeAssignment.count.mockResolvedValue(0);
    mockPrisma.routeAssignment.create.mockResolvedValue({ id: "assign_new", routeId: "route_2", studentId: "stu_1" });

    await assignStudentToRoute("school_1", { routeId: "route_2", studentId: "stu_1" });

    expect(mockPrisma.routeAssignment.delete).toHaveBeenCalledWith({ where: { id: "assign_old" } });
    expect(mockPrisma.routeAssignment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ routeId: "route_2", studentId: "stu_1" }) })
    );
  });

  it("does not re-check capacity when reassigning a student within the same route", async () => {
    mockPrisma.route.findFirst.mockResolvedValue({
      id: "route_1",
      schoolId: "school_1",
      vehicle: { id: "veh_1", capacity: 1 },
    });
    mockPrisma.student.findFirst.mockResolvedValue({ id: "stu_1", sectionId: "sec_1" });
    mockPrisma.pickupPoint.findFirst.mockResolvedValue({ id: "pp_1", routeId: "route_1" });
    mockPrisma.routeAssignment.findFirst.mockResolvedValue({
      id: "assign_1",
      routeId: "route_1",
      studentId: "stu_1",
    });
    mockPrisma.routeAssignment.create.mockResolvedValue({ id: "assign_1b", routeId: "route_1", studentId: "stu_1" });

    await assignStudentToRoute("school_1", { routeId: "route_1", studentId: "stu_1", pickupPointId: "pp_1" });

    expect(mockPrisma.routeAssignment.count).not.toHaveBeenCalled();
    expect(mockPrisma.routeAssignment.delete).toHaveBeenCalledWith({ where: { id: "assign_1" } });
  });
});

describe("transport.service - bulkAssignStudentsToRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stops assigning once the vehicle hits capacity mid-batch", async () => {
    mockPrisma.route.findFirst.mockResolvedValue({
      id: "route_1",
      schoolId: "school_1",
      vehicle: { id: "veh_1", capacity: 1 },
    });
    mockPrisma.student.findFirst
      .mockResolvedValueOnce({ id: "stu_1", sectionId: "sec_1" })
      .mockResolvedValueOnce({ id: "stu_2", sectionId: "sec_1" });
    mockPrisma.routeAssignment.findFirst.mockResolvedValue(null);
    mockPrisma.routeAssignment.count.mockResolvedValueOnce(0).mockResolvedValueOnce(1);
    mockPrisma.routeAssignment.create.mockResolvedValue({ id: "assign_1", routeId: "route_1", studentId: "stu_1" });

    await expect(
      bulkAssignStudentsToRoute("school_1", "route_1", { studentIds: ["stu_1", "stu_2"] })
    ).rejects.toThrow(/capacity/i);

    expect(mockPrisma.routeAssignment.create).toHaveBeenCalledTimes(1);
  });

  it("assigns every student when capacity allows", async () => {
    mockPrisma.route.findFirst.mockResolvedValue({
      id: "route_1",
      schoolId: "school_1",
      vehicle: { id: "veh_1", capacity: 5 },
    });
    mockPrisma.student.findFirst
      .mockResolvedValueOnce({ id: "stu_1", sectionId: "sec_1" })
      .mockResolvedValueOnce({ id: "stu_2", sectionId: "sec_1" });
    mockPrisma.routeAssignment.findFirst.mockResolvedValue(null);
    mockPrisma.routeAssignment.count.mockResolvedValueOnce(0).mockResolvedValueOnce(1);
    mockPrisma.routeAssignment.create
      .mockResolvedValueOnce({ id: "assign_1", routeId: "route_1", studentId: "stu_1" })
      .mockResolvedValueOnce({ id: "assign_2", routeId: "route_1", studentId: "stu_2" });

    const results = await bulkAssignStudentsToRoute("school_1", "route_1", { studentIds: ["stu_1", "stu_2"] });

    expect(results).toHaveLength(2);
    expect(mockPrisma.routeAssignment.create).toHaveBeenCalledTimes(2);
  });
});

describe("transport.service - createFuelLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("computes totalCost from litres * costPerLitre", async () => {
    mockPrisma.vehicle.findFirst.mockResolvedValue({ id: "veh_1", schoolId: "school_1" });
    mockPrisma.fuelLog.create.mockResolvedValue({ id: "fuel_1" });

    await createFuelLog("school_1", "user_1", "veh_1", { litres: 20, costPerLitre: 1.5 });

    expect(mockPrisma.fuelLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ vehicleId: "veh_1", filledById: "user_1", litres: 20, costPerLitre: 1.5, totalCost: 30 }),
      })
    );
  });

  it("rejects logging fuel for a vehicle outside this school", async () => {
    mockPrisma.vehicle.findFirst.mockResolvedValue(null);

    await expect(createFuelLog("school_1", "user_1", "veh_missing", { litres: 10, costPerLitre: 1 })).rejects.toThrow(
      /not found/i
    );
    expect(mockPrisma.fuelLog.create).not.toHaveBeenCalled();
  });
});
