import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  section: { findFirst: vi.fn(), update: vi.fn() },
  syllabus: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  chapter: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

vi.mock("../../src/lib/prisma", () => ({ prisma: mockPrisma }));

import {
  assignSectionCoordinator,
  createChapter,
  createSyllabus,
  updateChapter,
} from "../../src/modules/academic/academic.service";

describe("academic.service — syllabus, chapters, coordinator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("assignSectionCoordinator", () => {
    it("rejects when the section does not belong to this school", async () => {
      mockPrisma.section.findFirst.mockResolvedValue(null);

      await expect(assignSectionCoordinator("school_1", "sec_1", { coordinatorTeacherId: "teacher_1" })).rejects.toThrow(
        /section not found/i
      );
      expect(mockPrisma.section.update).not.toHaveBeenCalled();
    });

    it("assigns the coordinator teacher on the section", async () => {
      mockPrisma.section.findFirst.mockResolvedValue({ id: "sec_1", schoolId: "school_1" });
      mockPrisma.section.update.mockResolvedValue({ id: "sec_1", coordinatorTeacherId: "teacher_1" });

      const result = await assignSectionCoordinator("school_1", "sec_1", { coordinatorTeacherId: "teacher_1" });

      expect(result.coordinatorTeacherId).toBe("teacher_1");
      expect(mockPrisma.section.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "sec_1" }, data: { coordinatorTeacherId: "teacher_1" } })
      );
    });
  });

  describe("createSyllabus", () => {
    it("creates a syllabus for the given subject/class/session", async () => {
      mockPrisma.syllabus.create.mockResolvedValue({ id: "syl_1", title: "Term 1 Syllabus" });

      const result = await createSyllabus("school_1", {
        subjectId: "sub_1",
        classId: "class_1",
        academicSessionId: "sess_1",
        title: "Term 1 Syllabus",
      });

      expect(result.id).toBe("syl_1");
      expect(mockPrisma.syllabus.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ schoolId: "school_1", subjectId: "sub_1", classId: "class_1" }),
        })
      );
    });
  });

  describe("createChapter", () => {
    it("rejects adding a chapter to a syllabus outside this school", async () => {
      mockPrisma.syllabus.findFirst.mockResolvedValue(null);

      await expect(createChapter("school_1", "syl_1", { title: "Chapter 1", order: 1 })).rejects.toThrow(
        /syllabus not found/i
      );
      expect(mockPrisma.chapter.create).not.toHaveBeenCalled();
    });

    it("creates a chapter under the syllabus", async () => {
      mockPrisma.syllabus.findFirst.mockResolvedValue({ id: "syl_1", schoolId: "school_1" });
      mockPrisma.chapter.create.mockResolvedValue({ id: "chap_1", title: "Chapter 1" });

      const result = await createChapter("school_1", "syl_1", { title: "Chapter 1", order: 1 });

      expect(result.id).toBe("chap_1");
      expect(mockPrisma.chapter.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ syllabusId: "syl_1", title: "Chapter 1" }) })
      );
    });
  });

  describe("updateChapter", () => {
    it("rejects updating a chapter that does not belong to this school", async () => {
      mockPrisma.chapter.findFirst.mockResolvedValue(null);

      await expect(updateChapter("school_1", "chap_1", { isCompleted: true })).rejects.toThrow(/chapter not found/i);
      expect(mockPrisma.chapter.update).not.toHaveBeenCalled();
    });

    it("marks a chapter as completed", async () => {
      mockPrisma.chapter.findFirst.mockResolvedValue({ id: "chap_1" });
      mockPrisma.chapter.update.mockResolvedValue({ id: "chap_1", isCompleted: true });

      const result = await updateChapter("school_1", "chap_1", { isCompleted: true });

      expect(result.isCompleted).toBe(true);
      expect(mockPrisma.chapter.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "chap_1" }, data: expect.objectContaining({ isCompleted: true }) })
      );
    });
  });
});
