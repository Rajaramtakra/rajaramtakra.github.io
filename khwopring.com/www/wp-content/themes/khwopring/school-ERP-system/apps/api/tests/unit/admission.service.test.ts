import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  admissionApplication: {
    findFirst: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
  },
  section: { findFirst: vi.fn() },
  school: { findUniqueOrThrow: vi.fn() },
  student: { findUnique: vi.fn(), count: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mockPrisma }));

import { submit, moveToReview, decide, enroll } from "../../src/modules/admissions/admission.service";

function baseApplication(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "app_1",
    schoolId: "school_1",
    status: "DRAFT",
    guardians: [{ id: "g1" }],
    documents: [],
    dateOfBirth: new Date("2015-01-01"),
    gender: "MALE",
    studentFirstName: "Ada",
    studentLastName: "Lovelace",
    address: "123 Main St",
    academicSessionId: "session_1",
    ...overrides,
  };
}

describe("admission.service state machine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows DRAFT -> SUBMITTED when guardians exist", async () => {
    mockPrisma.admissionApplication.findFirst.mockResolvedValue(baseApplication());
    mockPrisma.admissionApplication.update.mockResolvedValue(baseApplication({ status: "SUBMITTED" }));

    const result = await submit("school_1", "app_1");

    expect(result.status).toBe("SUBMITTED");
    expect(mockPrisma.admissionApplication.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "SUBMITTED" }) })
    );
  });

  it("rejects SUBMITTED with zero guardians", async () => {
    mockPrisma.admissionApplication.findFirst.mockResolvedValue(baseApplication({ guardians: [] }));
    await expect(submit("school_1", "app_1")).rejects.toThrow(/guardian/i);
  });

  it("rejects moving straight from DRAFT to REVIEW (must be SUBMITTED first)", async () => {
    mockPrisma.admissionApplication.findFirst.mockResolvedValue(baseApplication({ status: "DRAFT" }));
    await expect(moveToReview("school_1", "app_1", {})).rejects.toThrow(/Cannot move application/);
  });

  it("allows SUBMITTED -> REVIEW", async () => {
    mockPrisma.admissionApplication.findFirst.mockResolvedValue(baseApplication({ status: "SUBMITTED" }));
    mockPrisma.admissionApplication.update.mockResolvedValue(baseApplication({ status: "REVIEW" }));

    const result = await moveToReview("school_1", "app_1", { notes: "looks good" });
    expect(result.status).toBe("REVIEW");
  });

  it("rejects decide() unless status is REVIEW", async () => {
    mockPrisma.admissionApplication.findFirst.mockResolvedValue(baseApplication({ status: "SUBMITTED" }));
    await expect(
      decide("school_1", "app_1", "user_1", { decision: "APPROVED" })
    ).rejects.toThrow(/Cannot move application/);
  });

  it("allows REVIEW -> APPROVED and REVIEW -> REJECTED", async () => {
    mockPrisma.admissionApplication.findFirst.mockResolvedValue(baseApplication({ status: "REVIEW" }));
    mockPrisma.admissionApplication.update.mockResolvedValue(baseApplication({ status: "APPROVED" }));

    const result = await decide("school_1", "app_1", "user_1", { decision: "APPROVED" });
    expect(result.status).toBe("APPROVED");
  });

  it("rejects enroll() unless status is APPROVED", async () => {
    mockPrisma.admissionApplication.findFirst.mockResolvedValue(baseApplication({ status: "SUBMITTED" }));
    await expect(enroll("school_1", "app_1", { sectionId: "sec_1" })).rejects.toThrow(/Cannot move application/);
  });

  it("rejects enroll() when the target section does not exist", async () => {
    mockPrisma.admissionApplication.findFirst.mockResolvedValue(baseApplication({ status: "APPROVED" }));
    mockPrisma.section.findFirst.mockResolvedValue(null);

    await expect(enroll("school_1", "app_1", { sectionId: "missing_section" })).rejects.toThrow(/section/i);
  });
});
