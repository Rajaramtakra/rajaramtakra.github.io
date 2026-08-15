import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  book: { findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn() },
  bookCopy: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  bookIssue: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  bookReservation: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  student: { findFirst: vi.fn() },
  teacher: { findFirst: vi.fn() },
  $transaction: vi.fn((fn: (tx: unknown) => unknown) => fn(mockPrisma)),
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mockPrisma }));

import {
  generateLibraryCardPdfForStudent,
  issueBook,
  markIssueLost,
  returnBook,
} from "../../src/modules/library/library.service";

describe("library.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("returnBook", () => {
    it("computes the overdue fine as daysLate * finePerDay (5 days late)", async () => {
      const now = new Date("2026-07-14T00:00:00.000Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const dueDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      mockPrisma.bookIssue.findFirst.mockResolvedValue({
        id: "issue_1",
        bookCopyId: "copy_1",
        status: "ISSUED",
        dueDate,
      });
      mockPrisma.bookCopy.update.mockResolvedValue({ id: "copy_1", status: "AVAILABLE" });
      mockPrisma.bookIssue.update.mockResolvedValue({ id: "issue_1", status: "RETURNED", fineAmount: 5 });

      await returnBook("school_1", { bookIssueId: "issue_1" });

      expect(mockPrisma.bookCopy.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "copy_1" }, data: { status: "AVAILABLE" } })
      );
      expect(mockPrisma.bookIssue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "issue_1" },
          data: expect.objectContaining({ status: "RETURNED", fineAmount: 5 }),
        })
      );
    });

    it("charges no fine when the book is returned on or before the due date", async () => {
      const now = new Date("2026-07-14T00:00:00.000Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      mockPrisma.bookIssue.findFirst.mockResolvedValue({
        id: "issue_2",
        bookCopyId: "copy_2",
        status: "ISSUED",
        dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      });
      mockPrisma.bookCopy.update.mockResolvedValue({ id: "copy_2", status: "AVAILABLE" });
      mockPrisma.bookIssue.update.mockResolvedValue({ id: "issue_2", status: "RETURNED", fineAmount: 0 });

      await returnBook("school_1", { bookIssueId: "issue_2" });

      expect(mockPrisma.bookIssue.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ fineAmount: 0 }) })
      );
    });

    it("rejects returning an issue that was already returned", async () => {
      mockPrisma.bookIssue.findFirst.mockResolvedValue({
        id: "issue_3",
        bookCopyId: "copy_3",
        status: "RETURNED",
        dueDate: new Date(),
      });

      await expect(returnBook("school_1", { bookIssueId: "issue_3" })).rejects.toThrow(/already been returned/i);
    });
  });

  describe("issueBook", () => {
    it("fails gracefully with a clear message when no copy is available, suggesting reservation", async () => {
      mockPrisma.book.findFirst.mockResolvedValue({ id: "book_1", schoolId: "school_1" });
      mockPrisma.bookCopy.findFirst.mockResolvedValue(null);

      await expect(issueBook("school_1", { bookId: "book_1", studentId: "stu_1" })).rejects.toThrow(
        /reserve/i
      );
      expect(mockPrisma.bookIssue.create).not.toHaveBeenCalled();
    });

    it("throws when the book itself does not exist in this school", async () => {
      mockPrisma.book.findFirst.mockResolvedValue(null);

      await expect(issueBook("school_1", { bookId: "missing", studentId: "stu_1" })).rejects.toThrow(
        /book not found/i
      );
    });

    it("issues an available copy and defaults the due date to 14 days out", async () => {
      const now = new Date("2026-07-14T00:00:00.000Z");
      vi.useFakeTimers();
      vi.setSystemTime(now);

      mockPrisma.book.findFirst.mockResolvedValue({ id: "book_1", schoolId: "school_1" });
      mockPrisma.bookCopy.findFirst.mockResolvedValue({ id: "copy_1", bookId: "book_1", status: "AVAILABLE" });
      mockPrisma.bookCopy.update.mockResolvedValue({ id: "copy_1", status: "ISSUED" });
      mockPrisma.bookIssue.create.mockResolvedValue({ id: "issue_1" });

      await issueBook("school_1", { bookId: "book_1", studentId: "stu_1" });

      expect(mockPrisma.bookIssue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bookCopyId: "copy_1",
            studentId: "stu_1",
            dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          }),
        })
      );
    });
  });

  describe("markIssueLost", () => {
    it("rejects marking an already-returned issue as lost", async () => {
      mockPrisma.bookIssue.findFirst.mockResolvedValue({ id: "issue_4", bookCopyId: "copy_4", status: "RETURNED" });

      await expect(markIssueLost("school_1", "issue_4")).rejects.toThrow(/only active issues/i);
    });
  });

  describe("generateLibraryCardPdfForStudent", () => {
    it("rejects when the student has no QR code issued yet", async () => {
      mockPrisma.student.findFirst.mockResolvedValue({
        id: "stu_1",
        schoolId: "school_1",
        idCardQrCode: null,
      });

      await expect(generateLibraryCardPdfForStudent("school_1", "stu_1")).rejects.toThrow(/qr code/i);
    });

    it("generates a PDF buffer for a student with an issued QR code", async () => {
      mockPrisma.student.findFirst.mockResolvedValue({
        id: "stu_1",
        schoolId: "school_1",
        firstName: "Ada",
        lastName: "Lovelace",
        registrationNumber: "REG-1",
        idCardQrCode: "qr-code-abc",
        section: { name: "A", class: { name: "5" } },
        school: { name: "Greenwood School" },
      });

      const buffer = await generateLibraryCardPdfForStudent("school_1", "stu_1");

      expect(buffer.length).toBeGreaterThan(0);
    });
  });
});
