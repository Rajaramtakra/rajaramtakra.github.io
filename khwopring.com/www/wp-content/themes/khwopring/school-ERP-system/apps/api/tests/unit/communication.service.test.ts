import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  message: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  announcement: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  notificationLog: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  userRole: { findMany: vi.fn() },
  student: { findMany: vi.fn() },
  bulkMessageJob: { create: vi.fn(), update: vi.fn(), findMany: vi.fn() },
  $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mockPrisma }));

import { sendMessage, getInbox, markMessageRead, sendBulkMessage } from "../../src/modules/communication/message.service";
import { listAnnouncements, audiencesForRoles } from "../../src/modules/communication/announcement.service";

describe("message.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.message.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: `msg_${data.recipientId}`, ...data })
    );
    mockPrisma.notificationLog.create.mockResolvedValue({ id: "log_1" });
  });

  it("fans out sendMessage into one Message.create call per recipient", async () => {
    const messages = await sendMessage("school_1", "sender_1", {
      recipientIds: ["user_a", "user_b", "user_c"],
      subject: "Reminder",
      body: "Please submit the form",
    });

    expect(mockPrisma.message.create).toHaveBeenCalledTimes(3);
    expect(mockPrisma.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          schoolId: "school_1",
          senderId: "sender_1",
          recipientId: "user_a",
          subject: "Reminder",
          body: "Please submit the form",
        }),
      })
    );
    expect(messages).toHaveLength(3);
  });

  it("logs a stubbed NotificationLog entry per recipient without any real network send", async () => {
    await sendMessage("school_1", "sender_1", {
      recipientIds: ["user_a", "user_b"],
      body: "Hello",
    });

    expect(mockPrisma.notificationLog.create).toHaveBeenCalledTimes(2);
    expect(mockPrisma.notificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ schoolId: "school_1", channel: "IN_APP", status: "SENT", body: "Hello" }),
      })
    );
  });

  it("returns only the caller's own inbox messages", async () => {
    mockPrisma.message.findMany.mockResolvedValue([{ id: "m1", recipientId: "user_a" }]);
    await getInbox("school_1", "user_a");
    expect(mockPrisma.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { schoolId: "school_1", recipientId: "user_a" } })
    );
  });

  it("marks a message read only when it belongs to the requesting recipient", async () => {
    mockPrisma.message.findFirst.mockResolvedValue({ id: "m1", recipientId: "user_a" });
    mockPrisma.message.update.mockResolvedValue({ id: "m1", isRead: true });

    await markMessageRead("school_1", "m1", "user_a");

    expect(mockPrisma.message.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "m1", schoolId: "school_1", recipientId: "user_a" } })
    );
    expect(mockPrisma.message.update).toHaveBeenCalledWith({ where: { id: "m1" }, data: { isRead: true } });
  });

  it("throws when marking a message as read that does not belong to the caller", async () => {
    mockPrisma.message.findFirst.mockResolvedValue(null);
    await expect(markMessageRead("school_1", "m1", "someone_else")).rejects.toThrow(/not found/i);
  });

  describe("sendBulkMessage", () => {
    it("resolves recipients from both roleName and section filters, deduplicated", async () => {
      mockPrisma.userRole.findMany.mockResolvedValue([{ userId: "user_teacher_1" }]);
      mockPrisma.student.findMany.mockResolvedValue([{ userId: "user_student_1" }, { userId: "user_student_1" }]);
      mockPrisma.bulkMessageJob.create.mockResolvedValue({ id: "job_1" });
      mockPrisma.bulkMessageJob.update.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: "job_1", ...data })
      );

      const job = await sendBulkMessage("school_1", "sender_1", {
        channel: "IN_APP",
        sectionId: "sec_1",
        roleName: "TEACHER",
        body: "Reminder for tomorrow",
      });

      expect(mockPrisma.message.create).toHaveBeenCalledTimes(2);
      expect(job).toMatchObject({ status: "SENT", sentCount: 2 });
    });

    it("rejects when no recipients match the audience filters", async () => {
      mockPrisma.userRole.findMany.mockResolvedValue([]);

      await expect(
        sendBulkMessage("school_1", "sender_1", { channel: "IN_APP", roleName: "GHOST_ROLE", body: "Hi" })
      ).rejects.toThrow(/no recipients/i);

      expect(mockPrisma.bulkMessageJob.create).not.toHaveBeenCalled();
    });
  });
});

describe("announcement.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("always includes ALL plus the audience mapped from the caller's roles", () => {
    expect(audiencesForRoles(["TEACHER"])).toEqual(expect.arrayContaining(["ALL", "TEACHERS"]));
    expect(audiencesForRoles(["STUDENT"])).toEqual(expect.arrayContaining(["ALL", "STUDENTS"]));
    expect(audiencesForRoles(["PARENT"])).toEqual(expect.arrayContaining(["ALL", "PARENTS"]));
    expect(audiencesForRoles(["SCHOOL_ADMIN"])).toEqual(expect.arrayContaining(["ALL", "STAFF"]));
  });

  it("deduplicates audiences when a user has multiple roles mapping to the same audience", () => {
    const audiences = audiencesForRoles(["SCHOOL_ADMIN", "PRINCIPAL"]);
    expect(audiences.filter((a) => a === "STAFF")).toHaveLength(1);
  });

  it("filters the announcement feed to the requester's matching audiences", async () => {
    mockPrisma.announcement.findMany.mockResolvedValue([{ id: "a1", audience: "TEACHERS" }]);

    await listAnnouncements("school_1", ["TEACHER"]);

    expect(mockPrisma.announcement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          schoolId: "school_1",
          deletedAt: null,
          audience: { in: expect.arrayContaining(["ALL", "TEACHERS"]) },
        }),
      })
    );
  });
});
