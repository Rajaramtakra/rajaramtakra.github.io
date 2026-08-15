import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Download } from "lucide-react";
import { payrollApi, type Payslip } from "./payroll.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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

function sum(components: { amount: number }[]) {
  return components.reduce((total, c) => total + c.amount, 0);
}

export function PayslipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    payrollApi
      .getPayslip(id)
      .then(setPayslip)
      .catch(() => setError("This payslip could not be loaded, or you do not have access to it."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !payslip) {
    return <p className="py-16 text-center text-sm text-muted-foreground">{error ?? "Payslip not found."}</p>;
  }

  const person = payslip.teacher ?? payslip.staff;
  const structure = person?.salaryStructure;
  const basicSalary = structure?.basicSalary ?? 0;
  const deductionsTotal = sum(structure?.deductions ?? []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Payslip &middot; {payslip.payrollRun ? `${MONTH_NAMES[payslip.payrollRun.month - 1]} ${payslip.payrollRun.year}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            {person ? `${person.firstName} ${person.lastName}` : "Unknown"} &middot; {person?.employeeCode}
          </p>
        </div>
        {payslip.filePath && (
          <Button variant="outline" size="sm" asChild>
            <a href={`/uploads/${payslip.filePath}`} target="_blank" rel="noreferrer">
              <Download className="h-4 w-4" /> Download PDF
            </a>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Earnings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Basic salary</span>
            <span className="font-medium">{basicSalary.toFixed(2)}</span>
          </div>
          {(structure?.allowances ?? []).map((a) => (
            <div key={a.id} className="flex items-center justify-between">
              <span className="text-muted-foreground">{a.name}</span>
              <span className="font-medium">{a.amount.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-border pt-2">
            <span className="font-medium">Gross salary</span>
            <span className="font-semibold">{payslip.grossSalary.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deductions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(structure?.deductions ?? []).length === 0 && <p className="text-muted-foreground">None</p>}
          {(structure?.deductions ?? []).map((d) => (
            <div key={d.id} className="flex items-center justify-between">
              <span className="text-muted-foreground">{d.name}</span>
              <span className="font-medium">{d.amount.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-border pt-2">
            <span className="font-medium">Total deductions</span>
            <span className="font-semibold">{deductionsTotal > 0 ? deductionsTotal.toFixed(2) : payslip.totalDeductions.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <span className="text-lg font-medium">Net salary</span>
          <Badge variant="success" className="px-3 py-1 text-base font-semibold">
            {payslip.netSalary.toFixed(2)}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
