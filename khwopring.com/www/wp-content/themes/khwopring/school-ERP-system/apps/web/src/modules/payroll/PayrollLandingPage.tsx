import { useAuthStore } from "@/store/auth.store";
import { SalaryStructuresPage } from "./SalaryStructuresPage";
import { MyPayslipsPage } from "./MyPayslipsPage";

/**
 * Single entry point for the "Payroll" nav item: users with `payroll:manage` land on salary
 * structures (and can navigate to payroll runs from there); users who only have
 * `payroll:read_own` land straight on their own payslips instead.
 */
export function PayrollLandingPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  if (hasPermission("payroll:manage")) return <SalaryStructuresPage />;
  return <MyPayslipsPage />;
}
