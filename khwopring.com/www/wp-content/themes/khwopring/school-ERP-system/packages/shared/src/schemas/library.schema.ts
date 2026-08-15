import { z } from "zod";

/**
 * Not part of shared enums.ts (module isolation while multiple agents build in parallel) —
 * these are simple free-text categories, not stored as a Postgres enum on the Book model.
 */
export const BOOK_CATEGORIES = [
  "FICTION",
  "NON_FICTION",
  "SCIENCE",
  "MATHEMATICS",
  "HISTORY",
  "BIOGRAPHY",
  "REFERENCE",
  "MAGAZINE",
  "OTHER",
] as const;
export type BookCategory = (typeof BOOK_CATEGORIES)[number];

export const createBookSchema = z.object({
  isbn: z.string().max(30).optional(),
  title: z.string().min(1).max(200),
  author: z.string().min(1).max(150),
  publisher: z.string().max(150).optional(),
  category: z.string().max(60).optional(),
  totalCopies: z.coerce.number().int().min(1).max(1000).default(1),
  vendorId: z.string().min(1).optional(),
  shelfLocation: z.string().max(60).optional(),
});
export type CreateBookInput = z.infer<typeof createBookSchema>;

export const updateBookSchema = z.object({
  isbn: z.string().max(30).optional(),
  title: z.string().min(1).max(200).optional(),
  author: z.string().min(1).max(150).optional(),
  publisher: z.string().max(150).optional(),
  category: z.string().max(60).optional(),
  vendorId: z.string().min(1).optional(),
  shelfLocation: z.string().max(60).optional(),
});
export type UpdateBookInput = z.infer<typeof updateBookSchema>;

export const bookSearchSchema = z.object({
  category: z.string().optional(),
});
export type BookSearchInput = z.infer<typeof bookSearchSchema>;

export const issueBookSchema = z
  .object({
    bookId: z.string().min(1),
    studentId: z.string().min(1).optional(),
    teacherId: z.string().min(1).optional(),
    dueDate: z.coerce.date().optional(),
  })
  .refine((v) => Boolean(v.studentId) !== Boolean(v.teacherId), {
    message: "Provide exactly one of studentId or teacherId",
  });
export type IssueBookInput = z.infer<typeof issueBookSchema>;

export const returnBookSchema = z.object({
  bookIssueId: z.string().min(1),
});
export type ReturnBookInput = z.infer<typeof returnBookSchema>;

export const reserveBookSchema = z.object({
  bookId: z.string().min(1),
  studentId: z.string().min(1),
});
export type ReserveBookInput = z.infer<typeof reserveBookSchema>;
