import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { payrollApi, type Payslip } from "./payroll.api";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

export function MyPayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[] | null>(null);

  useEffect(() => {
    payrollApi
      .listMyPayslips()
      .then(setPayslips)
      .catch(() => setPayslips([]));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Payslips</h1>
        <p className="text-sm text-muted-foreground">Your salary payslips, one per payroll period.</p>
      </div>

      <Card>
        <CardContent className="p-5">
          {payslips === null ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net pay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link to={`/payroll/payslips/${p.id}`} className="font-medium text-primary hover:underline">
                        {p.payrollRun ? `${MONTH_NAMES[p.payrollRun.month - 1]} ${p.payrollRun.year}` : "-"}
                      </Link>
                    </TableCell>
                    <TableCell>{p.grossSalary.toFixed(2)}</TableCell>
                    <TableCell>{p.totalDeductions.toFixed(2)}</TableCell>
                    <TableCell className="font-medium">{p.netSalary.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {payslips.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No payslips yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
