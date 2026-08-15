import { renderPdfBuffer } from "../../lib/pdf";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface SalaryComponent {
  name: string;
  amount: unknown;
}

interface PersonForPdf {
  firstName: string;
  lastName: string;
  employeeCode: string;
  salaryStructure: { basicSalary: unknown; allowances: SalaryComponent[]; deductions: SalaryComponent[] } | null;
}

export interface PayslipForPdf {
  id: string;
  grossSalary: unknown;
  totalDeductions: unknown;
  netSalary: unknown;
  payrollRun: { month: number; year: number };
  teacher: PersonForPdf | null;
  staff: PersonForPdf | null;
}

/** Renders a single payslip as a PDF buffer: basic + allowances - deductions = net, for the given payroll period. */
export async function renderPayslipPdf(payslip: PayslipForPdf): Promise<Buffer> {
  const person = payslip.teacher ?? payslip.staff;
  const structure = person?.salaryStructure ?? null;

  return renderPdfBuffer((doc) => {
    doc.fontSize(18).text("Payslip", { align: "center" });
    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .fillColor("#555555")
      .text(`${MONTH_NAMES[payslip.payrollRun.month - 1] ?? payslip.payrollRun.month} ${payslip.payrollRun.year}`, {
        align: "center",
      });
    doc.moveDown();

    doc.fillColor("#000000").fontSize(11);
    doc.text(`Employee: ${person?.firstName ?? "-"} ${person?.lastName ?? ""}`.trim());
    doc.text(`Employee code: ${person?.employeeCode ?? "-"}`);
    doc.moveDown();

    doc.fontSize(12).text("Earnings", { underline: true });
    doc.fontSize(11).text(`Basic salary: ${Number(structure?.basicSalary ?? 0).toFixed(2)}`);
    for (const allowance of structure?.allowances ?? []) {
      doc.text(`${allowance.name}: ${Number(allowance.amount).toFixed(2)}`);
    }
    doc.moveDown(0.5);

    doc.fontSize(12).text("Deductions", { underline: true });
    const deductions = structure?.deductions ?? [];
    if (deductions.length === 0) {
      doc.fontSize(11).text("None");
    } else {
      for (const deduction of deductions) {
        doc.fontSize(11).text(`${deduction.name}: ${Number(deduction.amount).toFixed(2)}`);
      }
    }
    doc.moveDown();

    doc.fontSize(11).text(`Gross salary: ${Number(payslip.grossSalary).toFixed(2)}`);
    doc.text(`Total deductions: ${Number(payslip.totalDeductions).toFixed(2)}`);
    doc.moveDown(0.3);
    doc.fontSize(14).text(`Net salary: ${Number(payslip.netSalary).toFixed(2)}`, { underline: true });
  });
}
