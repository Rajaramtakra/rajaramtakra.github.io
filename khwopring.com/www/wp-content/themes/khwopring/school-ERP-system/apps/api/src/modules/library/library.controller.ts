import type { Request, Response } from "express";
import * as libraryService from "./library.service";
import { asyncHandler } from "../../middleware/asyncHandler";
import { recordAudit } from "../../lib/audit";
import { storage } from "../../lib/storage";
import { BadRequestError } from "../../lib/errors";

export const createBook = asyncHandler(async (req: Request, res: Response) => {
  const book = await libraryService.createBook(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "CREATE_BOOK", resource: "book", resourceId: book.id });
  res.status(201).json({ book });
});

export const listBooks = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, search, sortBy, sortDir, category } = req.query as Record<string, string>;
  const result = await libraryService.listBooks(
    req.user!.schoolId,
    { page: Number(page), pageSize: Number(pageSize), search, sortBy, sortDir: sortDir as "asc" | "desc" },
    { category }
  );
  res.json(result);
});

export const getBook = asyncHandler(async (req: Request, res: Response) => {
  const book = await libraryService.getBook(req.user!.schoolId, req.params.id);
  res.json({ book });
});

export const updateBook = asyncHandler(async (req: Request, res: Response) => {
  const book = await libraryService.updateBook(req.user!.schoolId, req.params.id, req.body);
  await recordAudit({ req, action: "UPDATE_BOOK", resource: "book", resourceId: book.id });
  res.json({ book });
});

export const uploadCover = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new BadRequestError("A cover image file is required");
  const { filePath } = await storage.save(req.file.buffer, req.file.originalname, `library/${req.params.id}`);
  const book = await libraryService.setBookCover(req.user!.schoolId, req.params.id, filePath);
  await recordAudit({ req, action: "UPLOAD_BOOK_COVER", resource: "book", resourceId: book.id });
  res.status(201).json({ book });
});

export const issueBook = asyncHandler(async (req: Request, res: Response) => {
  const issue = await libraryService.issueBook(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "ISSUE_BOOK", resource: "book_issue", resourceId: issue.id });
  res.status(201).json({ issue });
});

export const listActiveIssues = asyncHandler(async (req: Request, res: Response) => {
  const issues = await libraryService.listActiveIssues(req.user!.schoolId);
  res.json({ issues });
});

export const listMyIssues = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, teacherId } = req.query as Record<string, string>;
  const issues = await libraryService.listIssuesForCaller(
    req.user!.schoolId,
    { userId: req.user!.id, permissions: req.user!.permissions },
    { studentId, teacherId }
  );
  res.json({ issues });
});

export const returnBook = asyncHandler(async (req: Request, res: Response) => {
  const issue = await libraryService.returnBook(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "RETURN_BOOK", resource: "book_issue", resourceId: issue.id });
  res.json({ issue });
});

export const markIssueLost = asyncHandler(async (req: Request, res: Response) => {
  const issue = await libraryService.markIssueLost(req.user!.schoolId, req.params.id);
  await recordAudit({ req, action: "MARK_BOOK_LOST", resource: "book_issue", resourceId: issue.id });
  res.json({ issue });
});

export const reserveBook = asyncHandler(async (req: Request, res: Response) => {
  const reservation = await libraryService.reserveBook(req.user!.schoolId, req.body);
  await recordAudit({ req, action: "RESERVE_BOOK", resource: "book_reservation", resourceId: reservation.id });
  res.status(201).json({ reservation });
});

export const listAllReservations = asyncHandler(async (req: Request, res: Response) => {
  const reservations = await libraryService.listReservations(req.user!.schoolId, {});
  res.json({ reservations });
});

export const listReservationsForBook = asyncHandler(async (req: Request, res: Response) => {
  const reservations = await libraryService.listReservations(req.user!.schoolId, { bookId: req.params.id });
  res.json({ reservations });
});

export const issueToReservation = asyncHandler(async (req: Request, res: Response) => {
  const issue = await libraryService.issueToReservation(req.user!.schoolId, req.params.id);
  await recordAudit({ req, action: "ISSUE_TO_RESERVATION", resource: "book_reservation", resourceId: req.params.id });
  res.status(201).json({ issue });
});

export const downloadLibraryCardPdf = asyncHandler(async (req: Request, res: Response) => {
  const buffer = await libraryService.generateLibraryCardPdfForStudent(req.user!.schoolId, req.params.id);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="library-card-${req.params.id}.pdf"`);
  res.send(buffer);
});
