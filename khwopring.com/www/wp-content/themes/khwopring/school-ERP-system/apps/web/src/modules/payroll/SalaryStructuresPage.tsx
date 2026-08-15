import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock } from "lucide-react";
import { payrollApi, type SalaryStructure } from "./payroll.api";
import { NewSalaryStructureDialog } from "./NewSalaryStructureDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

function sum(components: { amount: number }[]) {
  return components.reduce((total, c) => total + c.amount, 0);
}

export function SalaryStructuresPage() {
  const [structures, setStructures] = useState<SalaryStructure[] | null>(null);

  function reload() {
    payrollApi
      .listStructures()
      .then(setStructures)
      .catch(() => setStructures([]));
  }

  useEffect(reload, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payroll</h1>
          <p className="text-sm text-muted-foreground">Salary structures for teachers and staff.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/payroll/runs">
              <CalendarClock className="h-4 w-4" /> Payroll runs
            </Link>
          </Button>
          <NewSalaryStructureDialog onCreated={reload} />
        </div>
      </div>

      <Card>
        <CardContent className="p-5">
          {structures === null ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Basic salary</TableHead>
                  <TableHead>Allowances</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net (est.)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {structures.map((s) => {
                  const person = s.teacher ?? s.staff;
                  const allowancesTotal = sum(s.allowances);
                  const deductionsTotal = sum(s.deductions);
                  const net = s.basicSalary + allowancesTotal - deductionsTotal;
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-medium">
                          {person ? `${person.firstName} ${person.lastName}` : "Unknown"}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {person?.employeeCode}
                          <Badge variant="outline" className="text-[10px]">
                            {s.teacher ? "Teacher" : "Staff"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{s.basicSalary.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {s.allowances.length === 0 && <span className="text-xs text-muted-foreground">-</span>}
                          {s.allowances.map((a) => (
                            <Badge key={a.id} variant="success" className="text-[10px]">
                              {a.name}: {a.amount.toFixed(2)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {s.deductions.length === 0 && <span className="text-xs text-muted-foreground">-</span>}
                          {s.deductions.map((d) => (
                            <Badge key={d.id} variant="destructive" className="text-[10px]">
                              {d.name}: {d.amount.toFixed(2)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{net.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
                {structures.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No salary structures configured yet.
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
