import { renderPdfBuffer } from "../../lib/pdf";

export interface AdmitCardScheduleRow {
  subjectName: string;
  examDate: Date;
  startTime: string;
  endTime: string;
  maxMarks: number;
}

export interface AdmitCardInput {
  school: { name: string; address: string | null };
  examName: string;
  academicSessionName: string;
  studentName: string;
  registrationNumber: string;
  rollNumber: string | null;
  className: string;
  sectionName: string;
  schedules: AdmitCardScheduleRow[];
}

function drawAdmitCard(doc: PDFKit.PDFDocument, input: AdmitCardInput) {
  doc.fontSize(16).text(input.school.name, { align: "center" });
  doc.fontSize(9).fillColor("gray");
  if (input.school.address) doc.text(input.school.address, { align: "center" });
  doc.fillColor("black");
  doc.moveDown();

  doc.fontSize(18).text("Admit Card", { align: "center" });
  doc.moveDown();

  doc.fontSize(11);
  doc.text(`Exam: ${input.examName}`);
  doc.text(`Academic Session: ${input.academicSessionName}`);
  doc.text(`Student: ${input.studentName} (${input.registrationNumber})`);
  doc.text(`Class: ${input.className} - ${input.sectionName}`);
  if (input.rollNumber) doc.text(`Roll No: ${input.rollNumber}`);
  doc.moveDown();

  doc.fontSize(12).text("Exam Schedule", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10);
  for (const s of input.schedules) {
    doc.text(`${s.subjectName}: ${s.examDate.toDateString()}  ${s.startTime}-${s.endTime}  (Max Marks: ${s.maxMarks})`);
  }
  doc.moveDown(3);
  doc.fontSize(9).text("Signature of Student: ______________________        Signature of Principal: ______________________");
}

export function generateBulkAdmitCardsPdf(cards: AdmitCardInput[]): Promise<Buffer> {
  return renderPdfBuffer((doc) => {
    cards.forEach((card, i) => {
      if (i > 0) doc.addPage();
      drawAdmitCard(doc, card);
    });
  });
}
