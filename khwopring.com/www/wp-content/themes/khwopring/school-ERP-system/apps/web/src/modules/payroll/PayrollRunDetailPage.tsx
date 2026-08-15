import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, PlayCircle } from "lucide-react";
import { payrollApi, type PayrollRun } from "./payroll.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Can } from "@/components/Can";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function PayrollRunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [run, setRun] = useState<PayrollRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  function reload() {
    if (!id) return;
    setLoading(true);
    payrollApi.getRun(id).then(setRun).finally(() => setLoading(false));
  }
  useEffect(reload, [id]);

  async function handleProcess() {
    if (!run) return;
    setBusy(true);
    try {
      await payrollApi.processRun(run.id);
      toast({ title: "Payroll run processed" });
      reload();
    } catch (err) {
      toast({ title: "Failed to process run", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkPaid() {
    if (!run) return;
    setBusy(true);
    try {
      await payrollApi.markRunPaid(run.id);
      toast({ title: "Payroll run marked as paid; payslip PDFs generated" });
      reload();
    } catch (err) {
      toast({ title: "Failed to mark run as paid", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  if (loading || !run) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {MONTH_NAMES[run.month - 1]} {run.year} payroll
          </h1>
          <p className="text-sm text-muted-foreground">{run.payslips?.length ?? 0} payslip(s) generated</p>
        </div>
        <Badge variant={STATUS_VARIANT[run.status]} className="text-sm">
          {run.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payslips</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net pay</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(run.payslips ?? []).map((p) => {
                const person = p.teacher ?? p.staff;
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link to={`/payroll/payslips/${p.id}`} className="font-medium text-primary hover:underline">
                        {person ? `${person.firstName} ${person.lastName}` : "Unknown"}
                      </Link>
                      <div className="text-xs text-muted-foreground">{person?.employeeCode}</div>
                    </TableCell>
                    <TableCell>{p.grossSalary.toFixed(2)}</TableCell>
                    <TableCell>{p.totalDeductions.toFixed(2)}</TableCell>
                    <TableCell className="font-medium">{p.netSalary.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
              {(run.payslips ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No payslips for this run.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Can anyOf={["payroll:manage"]}>
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {run.status === "DRAFT" && (
              <Button onClick={handleProcess} disabled={busy}>
                <PlayCircle className="h-4 w-4" /> Process
              </Button>
            )}
            {run.status === "PROCESSED" && (
              <Button onClick={handleMarkPaid} disabled={busy}>
                <CheckCircle2 className="h-4 w-4" /> Mark paid
              </Button>
            )}
            {run.status === "PAID" && <p className="text-sm text-muted-foreground">This payroll run has been paid out.</p>}
          </CardContent>
        </Card>
      </Can>
    </div>
  );
}
