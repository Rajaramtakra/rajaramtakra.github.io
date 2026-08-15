import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import {
  reportsApi,
  type BankStatementReport,
  type ChequeRow,
  type DailySalesReport,
  type DayBookReport,
  type FeeCollectionRow,
  type PendingFeeRow,
  type RankRow,
  type RouteWiseTransportReport,
  type StockReportRow,
  type StudentReportRow,
  type SubjectWiseRow,
  type WorkingDaysReport,
} from "./reports.api";
import { academicApi, type ClassRecord, type SectionRecord, type SubjectRecord } from "@/modules/academic/academic.api";
import { examApi, type ExamRecord } from "@/modules/exams/exam.api";
import { transportApi, type Route } from "@/modules/transport/transport.api";
import { accountingApi, type BankAccount } from "@/modules/accounting/accounting.api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

function LoadingRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function StudentReportTable({ rows, loading }: { rows: StudentReportRow[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Registration No.</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Class</TableHead>
          <TableHead>Section</TableHead>
          <TableHead>Roll No.</TableHead>
          <TableHead>Date of Birth</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((s) => (
          <TableRow key={s.id}>
            <TableCell>{s.registrationNumber}</TableCell>
            <TableCell>
              {s.firstName} {s.lastName}
            </TableCell>
            <TableCell>{s.section?.class?.name ?? "-"}</TableCell>
            <TableCell>{s.section?.name ?? "-"}</TableCell>
            <TableCell>{s.rollNumber ?? "-"}</TableCell>
            <TableCell>{new Date(s.dateOfBirth).toLocaleDateString()}</TableCell>
          </TableRow>
        ))}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              No students found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function BirthdayReportTab() {
  const [month, setMonth] = useState<string>("ALL");
  const [rows, setRows] = useState<StudentReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    reportsApi
      .getBirthdayReport(month === "ALL" ? undefined : month)
      .then(setRows)
      .finally(() => setLoading(false));
  }, [month]);

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All months</SelectItem>
              {MONTHS.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => reportsApi.downloadBirthdayReportCsv(month === "ALL" ? undefined : month)}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
        <StudentReportTable rows={rows} loading={loading} />
      </CardContent>
    </Card>
  );
}

function ClassWiseReportTab() {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [classId, setClassId] = useState<string>("ALL");
  const [rows, setRows] = useState<StudentReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    academicApi.listClasses().then(setClasses);
  }, []);

  useEffect(() => {
    setLoading(true);
    reportsApi
      .getClassWiseStudentReport({ classId: classId === "ALL" ? undefined : classId })
      .then(setRows)
      .finally(() => setLoading(false));
  }, [classId]);

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => reportsApi.downloadClassWiseStudentReportCsv({ classId: classId === "ALL" ? undefined : classId })}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
        <StudentReportTable rows={rows} loading={loading} />
      </CardContent>
    </Card>
  );
}

function SubjectWiseReportTab() {
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [examId, setExamId] = useState("");
  const [rows, setRows] = useState<SubjectWiseRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    academicApi.listSubjects().then(setSubjects);
    examApi.listExams().then(setExams);
  }, []);

  useEffect(() => {
    if (!subjectId || !examId) return;
    setLoading(true);
    reportsApi.getSubjectWiseReport({ subjectId, examId }).then(setRows).finally(() => setLoading(false));
  }, [subjectId, examId]);

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <Select value={examId} onValueChange={setExamId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select exam" />
              </SelectTrigger>
              <SelectContent>
                {exams.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" disabled={!subjectId || !examId} onClick={() => reportsApi.downloadSubjectWiseReportCsv({ subjectId, examId })}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
        {loading ? (
          <LoadingRows />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Registration No.</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Roll No.</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead>Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.studentId}>
                  <TableCell>{r.registrationNumber}</TableCell>
                  <TableCell>{r.firstName} {r.lastName}</TableCell>
                  <TableCell>{r.rollNumber ?? "-"}</TableCell>
                  <TableCell>{r.subjectName}</TableCell>
                  <TableCell>{r.marksObtained} / {r.maxMarks}</TableCell>
                  <TableCell>{r.grade ?? "-"}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {subjectId && examId ? "No marks found." : "Select an exam and subject."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function FeeCollectionsReportTab() {
  const [rows, setRows] = useState<FeeCollectionRow[]>([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    reportsApi.getFeeCollectionsReport({}).then(setRows).finally(() => setLoading(false));
  }
  useEffect(reload, []);

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => reportsApi.downloadFeeCollectionsCsv({})}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
        {loading ? (
          <LoadingRows />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt No.</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Received By</TableHead>
                <TableHead>Paid At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.receiptNumber ?? "-"}</TableCell>
                  <TableCell>{r.studentName} ({r.registrationNumber})</TableCell>
                  <TableCell>{r.amount.toFixed(2)}</TableCell>
                  <TableCell>{r.method}</TableCell>
                  <TableCell>{r.receivedByName}</TableCell>
                  <TableCell>{new Date(r.paidAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No collections found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function PendingFeesReportTab() {
  const [rows, setRows] = useState<PendingFeeRow[]>([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    reportsApi.getPendingFeesReport({}).then(setRows).finally(() => setLoading(false));
  }
  useEffect(reload, []);

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => reportsApi.downloadPendingFeesCsv({})}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
        {loading ? (
          <LoadingRows />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice No.</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Outstanding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.invoiceId}>
                  <TableCell>{r.invoiceNumber}</TableCell>
                  <TableCell>{r.studentName} ({r.registrationNumber})</TableCell>
                  <TableCell>{r.academicSessionName}</TableCell>
                  <TableCell>{new Date(r.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>{r.status}</TableCell>
                  <TableCell>{r.outstanding.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No pending fees.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ChequeListReportTab() {
  const [rows, setRows] = useState<ChequeRow[]>([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    reportsApi.getChequeListReport().then(setRows).finally(() => setLoading(false));
  }
  useEffect(reload, []);

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => reportsApi.downloadChequeListCsv()}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
        {loading ? (
          <LoadingRows />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt No.</TableHead>
                <TableHead>Cheque No.</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.receiptNumber ?? "-"}</TableCell>
                  <TableCell>{r.transactionRef ?? "-"}</TableCell>
                  <TableCell>{r.studentName} ({r.registrationNumber})</TableCell>
                  <TableCell>{r.amount.toFixed(2)}</TableCell>
                  <TableCell>{new Date(r.paidAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No cheque payments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function RankReportTab() {
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [sections, setSections] = useState<SectionRecord[]>([]);
  const [examId, setExamId] = useState("");
  const [sectionId, setSectionId] = useState("ALL");
  const [rows, setRows] = useState<RankRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    examApi.listExams().then(setExams);
    academicApi.listSections().then(setSections);
  }, []);

  useEffect(() => {
    if (!examId) return;
    setLoading(true);
    reportsApi
      .getRankReport({ examId, sectionId: sectionId === "ALL" ? undefined : sectionId })
      .then(setRows)
      .finally(() => setLoading(false));
  }, [examId, sectionId]);

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <Select value={examId} onValueChange={setExamId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select exam" />
              </SelectTrigger>
              <SelectContent>
                {exams.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sectionId} onValueChange={setSectionId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All sections</SelectItem>
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.class?.name} - {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={!examId}
            onClick={() => reportsApi.downloadRankReportCsv({ examId, sectionId: sectionId === "ALL" ? undefined : sectionId })}
          >
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
        {loading ? (
          <LoadingRows />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Total Marks</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>GPA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.studentId}>
                  <TableCell>{r.rank ?? "-"}</TableCell>
                  <TableCell>{r.studentName} ({r.registrationNumber})</TableCell>
                  <TableCell>{r.totalMarks ?? "-"}</TableCell>
                  <TableCell>{r.percentage != null ? `${r.percentage.toFixed(1)}%` : "-"}</TableCell>
                  <TableCell>{r.gpa ?? "-"}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {examId ? "No published report cards found." : "Select an exam."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function WorkingDaysReportTab() {
  const [sections, setSections] = useState<SectionRecord[]>([]);
  const [sectionId, setSectionId] = useState("");
  const [report, setReport] = useState<WorkingDaysReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    academicApi.listSections().then(setSections);
  }, []);

  useEffect(() => {
    if (!sectionId) return;
    setLoading(true);
    reportsApi.getWorkingDaysReport({ sectionId }).then(setReport).finally(() => setLoading(false));
  }, [sectionId]);

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Select value={sectionId} onValueChange={setSectionId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent>
              {sections.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.class?.name} - {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" disabled={!sectionId} onClick={() => reportsApi.downloadWorkingDaysReportCsv({ sectionId })}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
        {loading ? (
          <LoadingRows />
        ) : report ? (
          <>
            <p className="text-sm text-muted-foreground">Working days in range: {report.workingDays}</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>Attendance %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.students.map((s) => (
                  <TableRow key={s.studentId}>
                    <TableCell>{s.studentName} ({s.registrationNumber})</TableCell>
                    <TableCell>{s.present}</TableCell>
                    <TableCell>{s.absent}</TableCell>
                    <TableCell>{s.attendancePercentage}%</TableCell>
                  </TableRow>
                ))}
                {report.students.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No attendance records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Select a section.</p>
        )}
      </CardContent>
    </Card>
  );
}

function RouteWiseTransportReportTab() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routeId, setRouteId] = useState("");
  const [report, setReport] = useState<RouteWiseTransportReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    transportApi.listRoutes().then(setRoutes);
  }, []);

  useEffect(() => {
    if (!routeId) return;
    setLoading(true);
    reportsApi.getRouteWiseTransportReport(routeId).then(setReport).finally(() => setLoading(false));
  }, [routeId]);

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <Select value={routeId} onValueChange={setRouteId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Select route" />
          </SelectTrigger>
          <SelectContent>
            {routes.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {loading ? (
          <LoadingRows />
        ) : report ? (
          <>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Headcount</p>
                <p className="font-medium">
                  {report.headcount}
                  {report.vehicleCapacity != null ? ` / ${report.vehicleCapacity}` : ""}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Fee / Student</p>
                <p className="font-medium">{report.monthlyFeePerStudent.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Monthly Fee</p>
                <p className="font-medium">{report.totalMonthlyFee.toFixed(2)}</p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Pickup Point</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.students.map((s) => (
                  <TableRow key={s.studentId}>
                    <TableCell>{s.studentName} ({s.registrationNumber})</TableCell>
                    <TableCell>{s.pickupPointName ?? "-"}</TableCell>
                  </TableRow>
                ))}
                {report.students.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No students assigned to this route.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Select a route.</p>
        )}
      </CardContent>
    </Card>
  );
}

function DayBookReportTab() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState<DayBookReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    reportsApi.getDayBookReport(date).then(setReport).finally(() => setLoading(false));
  }, [date]);

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <Input type="date" className="w-48" value={date} onChange={(e) => setDate(e.target.value)} />
        {loading ? (
          <LoadingRows />
        ) : report ? (
          <>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Debit</p>
                <p className="font-medium">{report.totalDebit.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Credit</p>
                <p className="font-medium">{report.totalCredit.toFixed(2)}</p>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Journal Lines</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Voucher</TableHead>
                    <TableHead>Debit</TableHead>
                    <TableHead>Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.journalLines.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell>{l.accountName}</TableCell>
                      <TableCell>{l.description}</TableCell>
                      <TableCell>{l.voucherNumber ?? "-"}</TableCell>
                      <TableCell>{l.debit.toFixed(2)}</TableCell>
                      <TableCell>{l.credit.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  {report.journalLines.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No journal activity for this date.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Cash Book Entries</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Debit</TableHead>
                    <TableHead>Credit</TableHead>
                    <TableHead>Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.cashBookEntries.map((e, i) => (
                    <TableRow key={i}>
                      <TableCell>{e.description}</TableCell>
                      <TableCell>{e.debit.toFixed(2)}</TableCell>
                      <TableCell>{e.credit.toFixed(2)}</TableCell>
                      <TableCell>{e.balance.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  {report.cashBookEntries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No cash book activity for this date.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Select a date.</p>
        )}
      </CardContent>
    </Card>
  );
}

function BankStatementReportTab() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bankAccountId, setBankAccountId] = useState("");
  const [report, setReport] = useState<BankStatementReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    accountingApi.listBankAccounts().then(setBankAccounts);
  }, []);

  useEffect(() => {
    if (!bankAccountId) return;
    setLoading(true);
    reportsApi.getBankStatementReport(bankAccountId).then(setReport).finally(() => setLoading(false));
  }, [bankAccountId]);

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <Select value={bankAccountId} onValueChange={setBankAccountId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select bank account" />
          </SelectTrigger>
          <SelectContent>
            {bankAccounts.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.bankName} · {b.accountNumber}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {loading ? (
          <LoadingRows />
        ) : report ? (
          <>
            <p className="text-sm text-muted-foreground">Closing balance: <span className="font-medium text-foreground">{report.closingBalance.toFixed(2)}</span></p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Voucher</TableHead>
                  <TableHead>Debit</TableHead>
                  <TableHead>Credit</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.entries.map((e, i) => (
                  <TableRow key={i}>
                    <TableCell>{new Date(e.date).toLocaleDateString()}</TableCell>
                    <TableCell>{e.description}</TableCell>
                    <TableCell>{e.voucherNumber ?? "-"}</TableCell>
                    <TableCell>{e.debit.toFixed(2)}</TableCell>
                    <TableCell>{e.credit.toFixed(2)}</TableCell>
                    <TableCell>{e.balance.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {report.entries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No transactions posted to this account.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Select a bank account.</p>
        )}
      </CardContent>
    </Card>
  );
}

function StockReportTab() {
  const [category, setCategory] = useState("");
  const [rows, setRows] = useState<StockReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    reportsApi.getStockReport(category || undefined).then(setRows).finally(() => setLoading(false));
  }, [category]);

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <Input
            className="w-56"
            placeholder="Filter by category..."
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Button variant="outline" size="sm" onClick={() => reportsApi.downloadStockReportCsv(category || undefined)}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
        {loading ? (
          <LoadingRows />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Reorder Level</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.category}</TableCell>
                  <TableCell>{r.quantity}</TableCell>
                  <TableCell>{r.unit}</TableCell>
                  <TableCell>{r.reorderLevel}</TableCell>
                  <TableCell>
                    <Badge variant={r.belowReorderLevel ? "destructive" : "success"}>
                      {r.belowReorderLevel ? "Reorder now" : "OK"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No inventory items found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function DailySalesReportTab() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState<DailySalesReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    reportsApi.getDailySalesReport(date).then(setReport).finally(() => setLoading(false));
  }, [date]);

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <Input type="date" className="w-48" value={date} onChange={(e) => setDate(e.target.value)} />
        {loading ? (
          <LoadingRows />
        ) : report ? (
          <>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Sales Count</p>
                <p className="font-medium">{report.totalSalesCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Amount</p>
                <p className="font-medium">{report.totalAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Collected</p>
                <p className="font-medium">{report.totalCollected.toFixed(2)}</p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Sold By</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.sales.map((s) => (
                  <TableRow key={s.saleId}>
                    <TableCell>{s.saleNumber}</TableCell>
                    <TableCell>{s.counterpartyName}</TableCell>
                    <TableCell>{s.soldByName}</TableCell>
                    <TableCell>{s.itemCount}</TableCell>
                    <TableCell>{s.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>{s.paidAmount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {report.sales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No sales recorded for this date.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Select a date.</p>
        )}
      </CardContent>
    </Card>
  );
}

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">Cross-module reports, exportable as CSV.</p>
      </div>
      <Tabs defaultValue="birthdays">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="birthdays">Birthday List</TabsTrigger>
          <TabsTrigger value="class-wise">Class Wise Students</TabsTrigger>
          <TabsTrigger value="subject-wise">Subject Wise</TabsTrigger>
          <TabsTrigger value="fee-collections">Fee Collections</TabsTrigger>
          <TabsTrigger value="pending-fees">Pending Fees</TabsTrigger>
          <TabsTrigger value="cheques">Cheque List</TabsTrigger>
          <TabsTrigger value="rank">Rank Report</TabsTrigger>
          <TabsTrigger value="working-days">Class Working Days</TabsTrigger>
          <TabsTrigger value="route-wise">Route Wise</TabsTrigger>
          <TabsTrigger value="day-book">Day Book</TabsTrigger>
          <TabsTrigger value="bank-statement">Bank Statement</TabsTrigger>
          <TabsTrigger value="stock">Stock Report</TabsTrigger>
          <TabsTrigger value="daily-sales">Daily Sales</TabsTrigger>
        </TabsList>
        <TabsContent value="birthdays">
          <BirthdayReportTab />
        </TabsContent>
        <TabsContent value="class-wise">
          <ClassWiseReportTab />
        </TabsContent>
        <TabsContent value="subject-wise">
          <SubjectWiseReportTab />
        </TabsContent>
        <TabsContent value="fee-collections">
          <FeeCollectionsReportTab />
        </TabsContent>
        <TabsContent value="pending-fees">
          <PendingFeesReportTab />
        </TabsContent>
        <TabsContent value="cheques">
          <ChequeListReportTab />
        </TabsContent>
        <TabsContent value="rank">
          <RankReportTab />
        </TabsContent>
        <TabsContent value="working-days">
          <WorkingDaysReportTab />
        </TabsContent>
        <TabsContent value="route-wise">
          <RouteWiseTransportReportTab />
        </TabsContent>
        <TabsContent value="day-book">
          <DayBookReportTab />
        </TabsContent>
        <TabsContent value="bank-statement">
          <BankStatementReportTab />
        </TabsContent>
        <TabsContent value="stock">
          <StockReportTab />
        </TabsContent>
        <TabsContent value="daily-sales">
          <DailySalesReportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
