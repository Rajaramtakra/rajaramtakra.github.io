import { useEffect, useState } from "react";
import { CalendarCheck, CalendarDays, ClipboardList, UserCog, UserCheck } from "lucide-react";
import { attendanceApi, type AttendanceStatusValue, type StaffAttendanceRecord, type StudentAttendanceRecord } from "./attendance.api";
import { academicApi, type SectionRecord } from "@/modules/academic/academic.api";
import { studentApi, type StudentRecord } from "@/modules/students/student.api";
import { teacherApi, type TeacherRecord } from "@/modules/teachers/teacher.api";
import { useAuthStore } from "@/store/auth.store";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUSES: AttendanceStatusValue[] = ["PRESENT", "ABSENT", "LATE", "HALF_DAY", "EXCUSED"];

const STATUS_VARIANT: Record<AttendanceStatusValue, "success" | "destructive" | "warning" | "secondary" | "default"> = {
  PRESENT: "success",
  ABSENT: "destructive",
  LATE: "warning",
  HALF_DAY: "secondary",
  EXCUSED: "default",
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function MarkStudentAttendanceTab() {
  const [sections, setSections] = useState<SectionRecord[]>([]);
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(todayIso());
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatusValue>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    academicApi.listSections().then((list) => {
      setSections(list);
      if (list.length > 0) setSectionId(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!sectionId) return;
    setLoading(true);
    studentApi
      .search({ sectionId, status: "ACTIVE", pageSize: 100 })
      .then((res) => {
        setStudents(res.data);
        setStatuses(Object.fromEntries(res.data.map((s) => [s.id, "PRESENT" as AttendanceStatusValue])));
      })
      .finally(() => setLoading(false));
  }, [sectionId]);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await attendanceApi.markStudents({
        sectionId,
        date,
        entries: students.map((s) => ({ studentId: s.id, status: statuses[s.id] ?? "PRESENT" })),
      });
      toast({ title: "Attendance saved" });
    } catch (err) {
      toast({ title: "Failed to save attendance", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
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
        <Input type="date" className="w-44" value={date} onChange={(e) => setDate(e.target.value)} />
        <Button onClick={handleSubmit} disabled={submitting || students.length === 0}>
          <CalendarCheck className="h-4 w-4" /> Save attendance
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registration #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-48">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.registrationNumber}</TableCell>
                    <TableCell>
                      {s.firstName} {s.lastName}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={statuses[s.id] ?? "PRESENT"}
                        onValueChange={(v) => setStatuses((prev) => ({ ...prev, [s.id]: v as AttendanceStatusValue }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((st) => (
                            <SelectItem key={st} value={st}>
                              {st}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {students.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No active students in this section.
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

function StudentAttendanceReportTab() {
  const [sections, setSections] = useState<SectionRecord[]>([]);
  const [sectionId, setSectionId] = useState("");
  const [records, setRecords] = useState<StudentAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    academicApi.listSections().then(setSections);
  }, []);

  function reload() {
    setLoading(true);
    attendanceApi
      .listStudents({ sectionId: sectionId || undefined })
      .then(setRecords)
      .finally(() => setLoading(false));
  }
  useEffect(reload, [sectionId]);

  return (
    <div className="space-y-4">
      <Select value={sectionId || "ALL"} onValueChange={(v) => setSectionId(v === "ALL" ? "" : v)}>
        <SelectTrigger className="w-56">
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

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {r.student.firstName} {r.student.lastName}
                    </TableCell>
                    <TableCell>
                      {r.section.class.name} - {r.section.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {records.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No attendance records found.
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

function MyAttendanceTab() {
  const [records, setRecords] = useState<StaffAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceApi
      .listStaff({})
      .then(setRecords)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No attendance records yet.
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

function StaffAttendanceAdminTab() {
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [teacherId, setTeacherId] = useState("");
  const [date, setDate] = useState(todayIso());
  const [status, setStatus] = useState<AttendanceStatusValue>("PRESENT");
  const [records, setRecords] = useState<StaffAttendanceRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    teacherApi.search({ pageSize: 100 }).then((res) => {
      setTeachers(res.data);
      if (res.data.length > 0) setTeacherId(res.data[0].id);
    });
  }, []);

  function reload() {
    if (!teacherId) return;
    attendanceApi.listStaff({ teacherId }).then(setRecords);
  }
  useEffect(reload, [teacherId]);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await attendanceApi.markStaff({ teacherId, date, status });
      toast({ title: "Attendance saved" });
      reload();
    } catch (err) {
      toast({ title: "Failed to save attendance", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={teacherId} onValueChange={setTeacherId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Select teacher" />
          </SelectTrigger>
          <SelectContent>
            {teachers.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.firstName} {t.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" className="w-44" value={date} onChange={(e) => setDate(e.target.value)} />
        <Select value={status} onValueChange={(v) => setStatus(v as AttendanceStatusValue)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((st) => (
              <SelectItem key={st} value={st}>
                {st}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleSubmit} disabled={submitting || !teacherId}>
          <CalendarCheck className="h-4 w-4" /> Save
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No attendance records for this teacher yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function AttendanceMarkPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canMark = hasPermission("attendance_student:mark");
  const canReadAll = hasPermission("attendance_student:read");
  const canManageStaffAttendance = hasPermission("attendance_staff:mark", "attendance_staff:read");
  const isSelfServiceStaff = hasPermission("attendance_staff:read_own") && !canManageStaffAttendance;

  const defaultTab = canMark ? "mark" : canReadAll ? "report" : canManageStaffAttendance ? "staff" : "mine";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
        <p className="text-sm text-muted-foreground">Mark and review student attendance.</p>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          {canMark && (
            <TabsTrigger value="mark">
              <ClipboardList className="mr-1.5 h-4 w-4" /> Mark attendance
            </TabsTrigger>
          )}
          {canReadAll && (
            <TabsTrigger value="report">
              <CalendarDays className="mr-1.5 h-4 w-4" /> Report
            </TabsTrigger>
          )}
          {canManageStaffAttendance && (
            <TabsTrigger value="staff">
              <UserCog className="mr-1.5 h-4 w-4" /> Staff attendance
            </TabsTrigger>
          )}
          {isSelfServiceStaff && (
            <TabsTrigger value="mine">
              <UserCheck className="mr-1.5 h-4 w-4" /> My attendance
            </TabsTrigger>
          )}
        </TabsList>
        {canMark && (
          <TabsContent value="mark">
            <MarkStudentAttendanceTab />
          </TabsContent>
        )}
        {canReadAll && (
          <TabsContent value="report">
            <StudentAttendanceReportTab />
          </TabsContent>
        )}
        {canManageStaffAttendance && (
          <TabsContent value="staff">
            <StaffAttendanceAdminTab />
          </TabsContent>
        )}
        {isSelfServiceStaff && (
          <TabsContent value="mine">
            <MyAttendanceTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
