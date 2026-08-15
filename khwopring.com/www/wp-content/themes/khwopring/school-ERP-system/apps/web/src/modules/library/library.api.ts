import { api } from "@/lib/api";
import type { PaginatedResult } from "@erp/shared";

export interface BookCopy {
  id: string;
  bookId: string;
  copyCode: string;
  status: "AVAILABLE" | "ISSUED" | "LOST" | "DAMAGED";
  createdAt: string;
}

export interface Book {
  id: string;
  isbn?: string | null;
  title: string;
  author: string;
  publisher?: string | null;
  category?: string | null;
  totalCopies: number;
  coverImagePath?: string | null;
  vendorId?: string | null;
  shelfLocation?: string | null;
  copies: BookCopy[];
  createdAt: string;
}

interface IssuePersonRef {
  id: string;
  firstName: string;
  lastName: string;
  registrationNumber?: string;
  employeeCode?: string;
}

export interface BookIssue {
  id: string;
  bookCopyId: string;
  studentId?: string | null;
  teacherId?: string | null;
  issuedAt: string;
  dueDate: string;
  returnedAt?: string | null;
  status: "ISSUED" | "RETURNED" | "OVERDUE" | "LOST";
  fineAmount: number | string;
  bookCopy: { id: string; copyCode: string; book: { id: string; title: string; author: string } };
  student?: IssuePersonRef | null;
  teacher?: IssuePersonRef | null;
}

export interface BookReservation {
  id: string;
  bookId: string;
  studentId: string;
  reservedAt: string;
  status: "PENDING" | "FULFILLED" | "CANCELLED";
  book: { id: string; title: string; author: string };
  student: IssuePersonRef;
}

export interface BookDetail extends Book {
  issues: BookIssue[];
}

export interface CreateBookPayload {
  isbn?: string;
  title: string;
  author: string;
  publisher?: string;
  category?: string;
  totalCopies: number;
  vendorId?: string;
  shelfLocation?: string;
}

export const libraryApi = {
  listBooks: (params: { page?: number; pageSize?: number; search?: string; category?: string }) =>
    api.get<PaginatedResult<Book>>("/library/books", { params }).then((r) => r.data),
  getBook: (id: string) => api.get<{ book: BookDetail }>(`/library/books/${id}`).then((r) => r.data.book),
  createBook: (data: CreateBookPayload) => api.post<{ book: Book }>("/library/books", data).then((r) => r.data.book),
  updateBook: (id: string, data: Partial<CreateBookPayload>) => api.patch(`/library/books/${id}`, data),
  uploadCover: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post<{ book: Book }>(`/library/books/${id}/cover`, form, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data.book);
  },
  issueBook: (data: { bookId: string; studentId?: string; teacherId?: string; dueDate?: string }) =>
    api.post<{ issue: BookIssue }>("/library/issues", data).then((r) => r.data.issue),
  listActiveIssues: () => api.get<{ issues: BookIssue[] }>("/library/issues").then((r) => r.data.issues),
  listMyIssues: () => api.get<{ issues: BookIssue[] }>("/library/issues/mine").then((r) => r.data.issues),
  returnBook: (bookIssueId: string) =>
    api.post<{ issue: BookIssue }>("/library/issues/return", { bookIssueId }).then((r) => r.data.issue),
  markIssueLost: (id: string) => api.post<{ issue: BookIssue }>(`/library/issues/${id}/lost`).then((r) => r.data.issue),
  reserveBook: (data: { bookId: string; studentId: string }) =>
    api.post<{ reservation: BookReservation }>("/library/reservations", data).then((r) => r.data.reservation),
  listReservations: () =>
    api.get<{ reservations: BookReservation[] }>("/library/reservations").then((r) => r.data.reservations),
  listReservationsForBook: (bookId: string) =>
    api.get<{ reservations: BookReservation[] }>(`/library/books/${bookId}/reservations`).then((r) => r.data.reservations),
  issueToReservation: (id: string) =>
    api.post<{ issue: BookIssue }>(`/library/reservations/${id}/issue`).then((r) => r.data.issue),
  downloadLibraryCardPdf: (studentId: string) =>
    api.get(`/library/students/${studentId}/card/pdf`, { responseType: "blob" }).then((r) => r.data as Blob),
};
