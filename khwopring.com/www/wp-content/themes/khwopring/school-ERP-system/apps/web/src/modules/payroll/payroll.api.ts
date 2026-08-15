import { api } from "@/lib/api";

export interface SalaryComponent {
  id: string;
  name: string;
  amount: number;
}

export interface PayrollPerson {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
}

export interface SalaryStructure {
  id: string;
  basicSalary: number;
  teacher?: PayrollPerson | null;
  staff?: PayrollPerson | null;
  allowances: SalaryComponent[];
  deductions: SalaryComponent[];
  createdAt: string;
}

export type PayrollStatus = "DRAFT" | "PROCESSED" | "PAID";

export interface Payslip {
  id: string;
  payrollRunId?: string;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  filePath?: string | null;
  createdAt?: string;
  teacher?: (PayrollPerson & { salaryStructure?: SalaryStructure | null }) | null;
  staff?: (PayrollPerson & { salaryStructure?: SalaryStructure | null }) | null;
  payrollRun?: { month: number; year: number };
}

export interface PayrollRun {
  id: string;
  month: number;
  year: number;
  status: PayrollStatus;
  processedAt?: string | null;
  createdAt: string;
  payslips?: Payslip[];
  _count?: { payslips: number };
}

export const payrollApi = {
  listStructures: () =>
    api.get<{ salaryStructures: SalaryStructure[] }>("/payroll/structures").then((r) => r.data.salaryStructures),
  getStructure: (id: string) =>
    api.get<{ salaryStructure: SalaryStructure }>(`/payroll/structures/${id}`).then((r) => r.data.salaryStructure),
  createStructure: (data: {
    teacherId?: string;
    staffId?: string;
    basicSalary: number;
    allowances: { name: string; amount: number }[];
    deductions: { name: string; amount: number }[];
  }) => api.post<{ salaryStructure: SalaryStructure }>("/payroll/structures", data).then((r) => r.data.salaryStructure),
  addAllowance: (id: string, data: { name: string; amount: number }) =>
    api.post<{ salaryStructure: SalaryStructure }>(`/payroll/structures/${id}/allowances`, data).then((r) => r.data.salaryStructure),
  addDeduction: (id: string, data: { name: string; amount: number }) =>
    api.post<{ salaryStructure: SalaryStructure }>(`/payroll/structures/${id}/deductions`, data).then((r) => r.data.salaryStructure),

  listRuns: () => api.get<{ payrollRuns: PayrollRun[] }>("/payroll/runs").then((r) => r.data.payrollRuns),
  createRun: (data: { month: number; year: number }) =>
    api.post<{ payrollRun: PayrollRun }>("/payroll/runs", data).then((r) => r.data.payrollRun),
  getRun: (id: string) => api.get<{ payrollRun: PayrollRun }>(`/payroll/runs/${id}`).then((r) => r.data.payrollRun),
  processRun: (id: string) => api.post<{ payrollRun: PayrollRun }>(`/payroll/runs/${id}/process`).then((r) => r.data.payrollRun),
  markRunPaid: (id: string) => api.post<{ payrollRun: PayrollRun }>(`/payroll/runs/${id}/mark-paid`).then((r) => r.data.payrollRun),

  listMyPayslips: () => api.get<{ payslips: Payslip[] }>("/payroll/payslips/mine").then((r) => r.data.payslips),
  getPayslip: (id: string) => api.get<{ payslip: Payslip }>(`/payroll/payslips/${id}`).then((r) => r.data.payslip),
};
