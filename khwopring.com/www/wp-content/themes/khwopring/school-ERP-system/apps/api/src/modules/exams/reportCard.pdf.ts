import type { Exam } from "@prisma/client";
import { renderPdfBuffer } from "../../lib/pdf";

export interface ReportCardSubjectRow {
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
  grade: string | null;
}

export interface ReportCardPdfInput {
  exam: Exam;
  studentName: string;
  registrationNumber: string;
  sectionLabel: string;
  subjectMarks: ReportCardSubjectRow[];
  totalMarks: number;
  totalMaxMarks: number;
  percentage: number;
  gpa: number | null;
  rank: number;
}

export function generateReportCardPdf(input: ReportCardPdfInput): Promise<Buffer> {
  return renderPdfBuffer((doc) => {
    doc.fontSize(18).text("Report Card", { align: "center" });
    doc.moveDown();

    doc.fontSize(11);
    doc.text(`Exam: ${input.exam.name}`);
    doc.text(`Student: ${input.studentName} (${input.registrationNumber})`);
    doc.text(`Section: ${input.sectionLabel}`);
    doc.moveDown();

    doc.fontSize(12).text("Subject-wise marks", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    for (const row of input.subjectMarks) {
      doc.text(`${row.subjectName}: ${row.marksObtained}/${row.maxMarks}   Grade: ${row.grade ?? "-"}`);
    }
    doc.moveDown();

    doc.fontSize(11);
    doc.text(`Total: ${input.totalMarks}/${input.totalMaxMarks}`);
    doc.text(`Percentage: ${input.percentage.toFixed(2)}%`);
    doc.text(`GPA: ${input.gpa !== null ? input.gpa.toFixed(2) : "-"}`);
    doc.text(`Rank: ${input.rank}`);
  });
}
