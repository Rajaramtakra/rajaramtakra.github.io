import { api } from "@/lib/api";

export interface IdCardData {
  id: string;
  photoUrl: string | null;
  fullName: string;
  registrationNumber: string;
  rollNumber: string | null;
  className: string;
  sectionName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string | null;
  address: string;
  guardianName: string | null;
  guardianPhone: string | null;
  admissionDate: string;
  academicSessionName: string;
  status: string;
  idCardVersion: number;
  idCardIssuedAt: string | null;
  qrCode: string;
  school: {
    name: string;
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
  };
  verifyUrl: string;
}

export interface VerificationResult {
  fullName: string;
  registrationNumber: string;
  className: string;
  sectionName: string;
  schoolName: string;
  status: string;
}

export type IdCardSide = "front" | "back" | "both";

export const idCardApi = {
  getMyCard: () => api.get<{ card: IdCardData }>("/students/me/id-card").then((r) => r.data.card),
  getCard: (studentId: string) =>
    api.get<{ card: IdCardData }>(`/students/${studentId}/id-card`).then((r) => r.data.card),

  downloadMyCardPdf: (side: IdCardSide) =>
    api
      .get(`/students/me/id-card/pdf`, { params: { side }, responseType: "blob" })
      .then((r) => r.data as Blob),
  downloadCardPdf: (studentId: string, side: IdCardSide) =>
    api
      .get(`/students/${studentId}/id-card/pdf`, { params: { side }, responseType: "blob" })
      .then((r) => r.data as Blob),

  getCardQrBlob: (studentId: string) =>
    api.get(`/students/${studentId}/id-card/qr.png`, { responseType: "blob" }).then((r) => r.data as Blob),

  regenerateCard: (studentId: string) =>
    api.post(`/students/${studentId}/id-card/regenerate`).then((r) => r.data.student),

  bulkPrintPdf: (studentIds: string[]) =>
    api
      .post("/students/id-cards/bulk-pdf", { studentIds }, { responseType: "blob" })
      .then((r) => r.data as Blob),

  verify: (code: string) =>
    api.get<{ verification: VerificationResult }>(`/id-cards/verify/${code}`).then((r) => r.data.verification),
};

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function printBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.addEventListener("load", () => win.print());
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
