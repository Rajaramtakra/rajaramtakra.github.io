import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  candidateApplication: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  jobPosting: { findFirst: vi.fn() },
  candidate: { findFirst: vi.fn() },
  teacher: { findFirst: vi.fn() },
  staffMember: { findFirst: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
  interview: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  $transaction: vi.fn((cb: unknown) => (typeof cb === "function" ? cb(mockPrisma) : Promise.all(cb as unknown[]))),
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mockPrisma }));

import { updateApplicationStatus, scheduleInterview } from "../../src/modules/hr/recruitment.service";
import { createLeaveRequestSchema } from "@erp/shared";

function baseApplication(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "app_1",
    schoolId: "school_1",
    status: "APPLIED",
    candidate: { id: "cand_1", fullName: "Jane Doe", email: "jane@example.com", phone: "1234567" },
    jobPosting: { id: "job_1", department: "Science", status: "OPEN" },
    offerLetter: null,
    ...overrides,
  };
}

describe("recruitment.service application pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects moving an application directly from APPLIED to HIRED", async () => {
    mockPrisma.candidateApplication.findFirst.mockResolvedValue(baseApplication({ status: "APPLIED" }));

    await expect(updateApplicationStatus("school_1", "app_1", { status: "HIRED" })).rejects.toThrow(
      /Cannot move application/
    );
    expect(mockPrisma.candidateApplication.update).not.toHaveBeenCalled();
  });

  it("allows APPLIED -> SHORTLISTED", async () => {
    mockPrisma.candidateApplication.findFirst.mockResolvedValue(baseApplication({ status: "APPLIED" }));
    mockPrisma.candidateApplication.update.mockResolvedValue(baseApplication({ status: "SHORTLISTED" }));

    const result = await updateApplicationStatus("school_1", "app_1", { status: "SHORTLISTED" });
    expect(result.status).toBe("SHORTLISTED");
  });

  it("rejects REJECTED -> anything (terminal state)", async () => {
    mockPrisma.candidateApplication.findFirst.mockResolvedValue(baseApplication({ status: "REJECTED" }));

    await expect(updateApplicationStatus("school_1", "app_1", { status: "SHORTLISTED" })).rejects.toThrow(
      /Cannot move application/
    );
  });

  it("refuses to schedule an interview for an application still in APPLIED", async () => {
    mockPrisma.candidateApplication.findFirst.mockResolvedValue(baseApplication({ status: "APPLIED" }));

    await expect(
      scheduleInterview("school_1", {
        candidateApplicationId: "app_1",
        scheduledAt: new Date("2026-08-01"),
        interviewerId: "teacher_1",
      })
    ).rejects.toThrow(/Cannot schedule an interview/);
  });
});

describe("createLeaveRequestSchema teacherId XOR staffId", () => {
  it("rejects a payload with neither teacherId nor staffId", () => {
    const result = createLeaveRequestSchema.safeParse({
      leaveType: "SICK",
      fromDate: "2026-08-01",
      toDate: "2026-08-02",
      reason: "Not feeling well",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a payload with both teacherId and staffId", () => {
    const result = createLeaveRequestSchema.safeParse({
      teacherId: "teacher_1",
      staffId: "staff_1",
      leaveType: "SICK",
      fromDate: "2026-08-01",
      toDate: "2026-08-02",
      reason: "Not feeling well",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a payload with exactly teacherId", () => {
    const result = createLeaveRequestSchema.safeParse({
      teacherId: "teacher_1",
      leaveType: "SICK",
      fromDate: "2026-08-01",
      toDate: "2026-08-02",
      reason: "Not feeling well",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a payload with exactly staffId", () => {
    const result = createLeaveRequestSchema.safeParse({
      staffId: "staff_1",
      leaveType: "CASUAL",
      fromDate: "2026-08-01",
      toDate: "2026-08-02",
      reason: "Personal work",
    });
    expect(result.success).toBe(true);
  });
});
