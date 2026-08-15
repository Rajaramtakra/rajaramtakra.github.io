import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { payrollApi, type PayrollRun } from "./payroll.api";
import { NewPayrollRunDialog } from "./NewPayrollRunDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  DRAFT: "secondary",
  PROCESSED: "warning",
  PAID: "success",
};

export function PayrollRunsPage() {
  const [runs, setRuns] = useState<PayrollRun[] | null>(null);

  function reload() {
    payrollApi
      .listRuns()
      .then(setRuns)
      .catch(() => setRuns([]));
  }

  useEffect(reload, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payroll runs</h1>
          <p className="text-sm text-muted-foreground">Generate and track monthly payroll processing.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/payroll">
              <Users className="h-4 w-4" /> Salary structures
            </Link>
          </Button>
          <NewPayrollRunDialog onCreated={reload} />
        </div>
      </div>

      <Card>
        <CardContent className="p-5">
          {runs === null ? (
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
                  <TableHead>Payslips</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <Link to={`/payroll/runs/${run.id}`} className="font-medium text-primary hover:underline">
                        {MONTH_NAMES[run.month - 1]} {run.year}
                      </Link>
                    </TableCell>
                    <TableCell>{run._count?.payslips ?? run.payslips?.length ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[run.status]}>{run.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {runs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No payroll runs yet.
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
