import { randomUUID } from "node:crypto";
import fs from "node:fs";
import type { Permission } from "@erp/shared";
import { prisma } from "../../lib/prisma";
import { ForbiddenError, NotFoundError } from "../../lib/errors";
import { getOwnStudentId } from "../../lib/students";
import { renderPdfBuffer, generateQrPng } from "../../lib/pdf";
import { storage } from "../../lib/storage";
import { env } from "../../config/env";

const CARD_INCLUDE = {
  section: { include: { class: true } },
  academicSession: true,
  school: true,
  guardians: { include: { guardian: true }, orderBy: { isPrimary: "desc" as const } },
} as const;

type CardStudent = Awaited<ReturnType<typeof getActiveStudentForCard>>;

async function getActiveStudentForCard(schoolId: string, studentId: string) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId, deletedAt: null },
    include: CARD_INCLUDE,
  });
  if (!student) throw new NotFoundError("Student not found");
  if (student.status !== "ACTIVE") {
    throw new ForbiddenError("The ID card is only available for active students");
  }
  if (!student.idCardQrCode) {
    // Backfills students that existed before this feature (or slipped through without a QR code).
    return prisma.student.update({
      where: { id: student.id },
      data: { idCardQrCode: randomUUID(), idCardIssuedAt: new Date() },
      include: CARD_INCLUDE,
    });
  }
  return student;
}

function toCardData(student: CardStudent) {
  const primaryGuardian = student.guardians[0]?.guardian;
  return {
    id: student.id,
    photoUrl: student.photoUrl,
    fullName: `${student.firstName} ${student.lastName}`,
    registrationNumber: student.registrationNumber,
    rollNumber: student.rollNumber,
    className: student.section.class.name,
    sectionName: student.section.name,
    dateOfBirth: student.dateOfBirth,
    gender: student.gender,
    bloodGroup: student.bloodGroup,
    address: student.address,
    guardianName: primaryGuardian?.fullName ?? null,
    guardianPhone: primaryGuardian?.phone ?? null,
    admissionDate: student.admissionDate,
    academicSessionName: student.academicSession.name,
    status: student.status,
    idCardVersion: student.idCardVersion,
    idCardIssuedAt: student.idCardIssuedAt,
    qrCode: student.idCardQrCode!,
    school: {
      name: student.school.name,
      logoUrl: student.school.logoUrl,
      primaryColor: student.school.idCardPrimaryColor ?? "#1d4ed8",
      secondaryColor: student.school.idCardSecondaryColor ?? "#1e293b",
    },
    verifyUrl: `${env.CORS_ORIGIN}/verify/${student.idCardQrCode}`,
  };
}

export type CardData = ReturnType<typeof toCardData>;

export async function assembleCardData(schoolId: string, studentId: string): Promise<CardData> {
  const student = await getActiveStudentForCard(schoolId, studentId);
  return toCardData(student);
}

/** Enforces that a `student:read_own`-only caller may only fetch their own card. */
export async function assembleCardDataForRequester(
  schoolId: string,
  studentId: string,
  requester: { userId: string; permissions: Permission[] }
): Promise<CardData> {
  if (!requester.permissions.includes("student:read")) {
    const ownStudentId = await getOwnStudentId(schoolId, requester.userId);
    if (ownStudentId !== studentId) throw new ForbiddenError("You may only view your own ID card");
  }
  return assembleCardData(schoolId, studentId);
}

export async function assembleMyCardData(schoolId: string, userId: string): Promise<CardData> {
  const studentId = await getOwnStudentId(schoolId, userId);
  return assembleCardData(schoolId, studentId);
}

export async function regenerateCard(schoolId: string, studentId: string) {
  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId, deletedAt: null } });
  if (!student) throw new NotFoundError("Student not found");
  return prisma.student.update({
    where: { id: studentId },
    data: { idCardQrCode: randomUUID(), idCardIssuedAt: new Date(), idCardVersion: { increment: 1 } },
  });
}

export async function verifyByQrCode(code: string) {
  const student = await prisma.student.findFirst({
    where: { idCardQrCode: code, deletedAt: null },
    include: { section: { include: { class: true } }, school: true },
  });
  if (!student || !student.school.idCardQrVerificationEnabled) {
    throw new NotFoundError("This ID card could not be verified");
  }
  return {
    fullName: `${student.firstName} ${student.lastName}`,
    registrationNumber: student.registrationNumber,
    className: student.section.class.name,
    sectionName: student.section.name,
    schoolName: student.school.name,
    status: student.status,
  };
}

const CARD_WIDTH = 153; // 2.125in at 72dpi (CR-80 card, portrait/badge orientation)
const CARD_HEIGHT = 243; // 3.375in at 72dpi

function safeImage(doc: PDFKit.PDFDocument, relativePath: string | null | undefined, x: number, y: number, size: number) {
  if (!relativePath) return false;
  try {
    const absolutePath = storage.resolveAbsolutePath(relativePath);
    if (!fs.existsSync(absolutePath)) return false;
    doc.image(absolutePath, x, y, { fit: [size, size] });
    return true;
  } catch {
    return false;
  }
}

/**
 * Fills a soft curving band across the given vertical range, in the style of the reference
 * badge design. By default the flat edge is at `top` and the wave bulges toward `top + bandHeight`
 * (used for the header, whose wave dips down into the content below). Pass `flipped: true` to
 * mirror it vertically — flat edge at `top + bandHeight`, wave bulging up toward `top` (used for
 * the footer band, whose wave should curve up into the content above it, not down off the card).
 */
function drawCurveBand(
  doc: PDFKit.PDFDocument,
  color: string,
  top: number,
  bandHeight: number,
  curveDepth: number,
  flipped = false
) {
  doc.save();
  if (!flipped) {
    doc
      .moveTo(0, top)
      .lineTo(CARD_WIDTH, top)
      .lineTo(CARD_WIDTH, top + bandHeight - curveDepth)
      .bezierCurveTo(
        CARD_WIDTH * 0.65,
        top + bandHeight + curveDepth,
        CARD_WIDTH * 0.35,
        top + bandHeight - curveDepth * 2,
        0,
        top + bandHeight
      )
      .closePath()
      .fill(color);
  } else {
    const bottom = top + bandHeight;
    doc
      .moveTo(0, bottom)
      .lineTo(CARD_WIDTH, bottom)
      .lineTo(CARD_WIDTH, top + curveDepth)
      .bezierCurveTo(CARD_WIDTH * 0.65, top - curveDepth, CARD_WIDTH * 0.35, top + curveDepth * 2, 0, top)
      .closePath()
      .fill(color);
  }
  doc.restore();
}

async function drawFront(doc: PDFKit.PDFDocument, data: CardData) {
  const { school } = data;
  doc.rect(0, 0, CARD_WIDTH, CARD_HEIGHT).fill("#ffffff");

  // Top curved band with logo + school name (name is forced to a single line with
  // an ellipsis so it can never wrap into and collide with the subtitle below it).
  const headerBandHeight = 44;
  drawCurveBand(doc, school.primaryColor, 0, headerBandHeight, 14);
  const logoSize = 22;
  const textX = 10 + logoSize + 6;
  const textWidth = CARD_WIDTH - textX - 8;
  doc.circle(10 + logoSize / 2, 9 + logoSize / 2, logoSize / 2 + 2).fill("#ffffff");
  if (!safeImage(doc, school.logoUrl, 10, 9, logoSize)) {
    doc
      .fillColor(school.primaryColor)
      .fontSize(10)
      .text(school.name.charAt(0), 10, 9 + logoSize / 2 - 5, { width: logoSize, align: "center" });
  }
  doc
    .fillColor("#ffffff")
    .fontSize(7.5)
    .text(school.name, textX, 9, { width: textWidth, height: 10, ellipsis: true });
  doc.fontSize(5).text("STUDENT ID CARD", textX, 21, { width: textWidth, height: 7, ellipsis: true });

  // Decorative circle accent + centered photo
  const cx = CARD_WIDTH / 2;
  const photoR = 28;
  const cy = headerBandHeight + 8 + photoR;
  doc.circle(cx, cy, photoR + 8).fill(school.secondaryColor);
  doc.circle(cx, cy, photoR + 3).fill("#ffffff");
  if (data.photoUrl) {
    doc.save();
    doc.circle(cx, cy, photoR).clip();
    if (!safeImage(doc, data.photoUrl, cx - photoR, cy - photoR, photoR * 2)) {
      doc.circle(cx, cy, photoR).fill("#e2e8f0");
    }
    doc.restore();
  } else {
    doc.circle(cx, cy, photoR).fill("#e2e8f0");
    doc
      .fillColor(school.secondaryColor)
      .fontSize(16)
      .text(data.fullName.charAt(0), cx - photoR, cy - 8, { width: photoR * 2, align: "center" });
  }

  // Name + class, centered (also single-line, to guarantee predictable vertical rhythm below)
  let y = cy + photoR + 10;
  doc
    .fillColor("#0f172a")
    .fontSize(10)
    .text(data.fullName, 8, y, { width: CARD_WIDTH - 16, height: 12, align: "center", ellipsis: true });
  y += 13;
  doc
    .fillColor(school.secondaryColor)
    .fontSize(7)
    .text(`${data.className} - ${data.sectionName}`, 8, y, {
      width: CARD_WIDTH - 16,
      height: 9,
      align: "center",
      ellipsis: true,
    });
  y += 11;

  doc.moveTo(16, y).lineTo(CARD_WIDTH - 16, y).lineWidth(0.5).strokeColor("#e2e8f0").stroke();
  y += 7;

  const row = (label: string, value: string | null | undefined) => {
    doc.fillColor("#64748b").fontSize(6.5).text(label, 16, y, { width: 42, height: 8, ellipsis: true });
    doc
      .fillColor("#0f172a")
      .fontSize(6.5)
      .text(value ?? "-", 60, y, { width: CARD_WIDTH - 76, height: 8, ellipsis: true });
    y += 10.5;
  };
  row("ID", data.registrationNumber);
  row("DOB", data.dateOfBirth.toDateString());
  row("Roll No", data.rollNumber);
  row("Blood Grp", data.bloodGroup);

  // Bottom curved band with QR — sized so it starts safely below the last row drawn above.
  const bottomBandHeight = 40;
  const bandTop = CARD_HEIGHT - bottomBandHeight;
  drawCurveBand(doc, school.primaryColor, bandTop, bottomBandHeight, 14, true);
  const qrBuffer = await generateQrPng(data.verifyUrl);
  const qrSize = 26;
  const qrX = cx - qrSize / 2;
  const qrY = CARD_HEIGHT - qrSize - 8;
  doc.rect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 6).fill("#ffffff");
  doc.image(qrBuffer, qrX, qrY, { fit: [qrSize, qrSize] });
  doc.fillColor("#ffffff").fontSize(5).text(`Card v${data.idCardVersion}`, 8, CARD_HEIGHT - 10, {
    width: CARD_WIDTH - 16,
    align: "right",
  });
}

function drawBack(doc: PDFKit.PDFDocument, data: CardData) {
  const { school } = data;
  doc.rect(0, 0, CARD_WIDTH, CARD_HEIGHT).fill(school.secondaryColor);
  drawCurveBand(doc, school.primaryColor, 0, 30, 10);
  doc.fillColor("#ffffff").fontSize(9).text("Student Details", 12, 34);

  let y = 54;
  const line = (label: string, value: string | null | undefined) => {
    doc.fontSize(7).fillColor("#ffffff").text(`${label}`, 12, y, { width: CARD_WIDTH - 24 });
    y += 9;
    doc.fontSize(7.5).fillColor("#ffffff").text(value ?? "-", 12, y, { width: CARD_WIDTH - 24 });
    y += 16;
  };
  line("Date of Birth", data.dateOfBirth.toDateString());
  line("Blood Group", data.bloodGroup);
  line("Address", data.address);
  line("Guardian", data.guardianName);
  line("Emergency Contact", data.guardianPhone);

  doc
    .fontSize(5.5)
    .fillColor("#ffffff")
    .text(
      "This card is the property of the school. If found, please return it to the school office.",
      12,
      y + 4,
      { width: CARD_WIDTH - 24 }
    );

  doc.fontSize(6.5).text("Authorized Signature:", 12, CARD_HEIGHT - 24);
  doc.moveTo(12, CARD_HEIGHT - 12).lineTo(CARD_WIDTH - 12, CARD_HEIGHT - 12).lineWidth(0.5).stroke("#ffffff");
}

export async function generateCardPdf(
  schoolId: string,
  studentId: string,
  side: "front" | "back" | "both"
): Promise<Buffer> {
  const data = await assembleCardData(schoolId, studentId);
  return renderPdfBuffer(
    async (doc) => {
      if (side !== "back") await drawFront(doc, data);
      if (side === "both") doc.addPage({ size: [CARD_WIDTH, CARD_HEIGHT], margin: 0 });
      if (side !== "front") drawBack(doc, data);
    },
    { size: [CARD_WIDTH, CARD_HEIGHT], margin: 0 }
  );
}

export async function generateCardPdfForRequester(
  schoolId: string,
  studentId: string,
  side: "front" | "back" | "both",
  requester: { userId: string; permissions: Permission[] }
): Promise<Buffer> {
  await assembleCardDataForRequester(schoolId, studentId, requester);
  return generateCardPdf(schoolId, studentId, side);
}

export async function generateQrPngForRequester(
  schoolId: string,
  studentId: string,
  requester: { userId: string; permissions: Permission[] }
): Promise<Buffer> {
  const data = await assembleCardDataForRequester(schoolId, studentId, requester);
  return generateQrPng(data.verifyUrl);
}

const PAGE_WIDTH = 595; // A4 portrait, points
const PAGE_HEIGHT = 842;
const GRID_COLS = 3;
const GRID_ROWS = 3;
const CARDS_PER_PAGE = GRID_COLS * GRID_ROWS;
const MARGIN_X = (PAGE_WIDTH - GRID_COLS * CARD_WIDTH) / (GRID_COLS + 1);
const MARGIN_Y = (PAGE_HEIGHT - GRID_ROWS * CARD_HEIGHT) / (GRID_ROWS + 1);

function gridPosition(index: number) {
  const col = index % GRID_COLS;
  const row = Math.floor(index / GRID_COLS);
  return {
    x: MARGIN_X + col * (CARD_WIDTH + MARGIN_X),
    y: MARGIN_Y + row * (CARD_HEIGHT + MARGIN_Y),
  };
}

/** One PDF, A4 pages, cards laid out in a cutting grid: a fronts page followed by the matching backs page per batch. */
export async function bulkGenerateCardsPdf(schoolId: string, studentIds: string[]): Promise<Buffer> {
  const cards: CardData[] = [];
  for (const studentId of studentIds) {
    cards.push(await assembleCardData(schoolId, studentId));
  }

  return renderPdfBuffer(
    async (doc) => {
      for (let batchStart = 0; batchStart < cards.length; batchStart += CARDS_PER_PAGE) {
        const batch = cards.slice(batchStart, batchStart + CARDS_PER_PAGE);
        if (batchStart > 0) doc.addPage({ size: "A4", margin: 0 });

        for (let i = 0; i < batch.length; i++) {
          const { x, y } = gridPosition(i);
          doc.save();
          doc.translate(x, y);
          await drawFront(doc, batch[i]);
          doc.restore();
        }

        doc.addPage({ size: "A4", margin: 0 });
        for (let i = 0; i < batch.length; i++) {
          const { x, y } = gridPosition(i);
          doc.save();
          doc.translate(x, y);
          drawBack(doc, batch[i]);
          doc.restore();
        }
      }
    },
    { size: "A4", margin: 0 }
  );
}
