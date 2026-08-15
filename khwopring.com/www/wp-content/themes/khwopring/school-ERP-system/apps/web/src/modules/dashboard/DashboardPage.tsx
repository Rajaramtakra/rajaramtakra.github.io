import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  ClipboardCheck,
  Download,
  GraduationCap,
  HeartHandshake,
  NotebookPen,
  Printer,
  School,
  ScrollText,
  UserCheck,
  Users,
} from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { timetableApi, type TimetableEntryRecord } from "@/modules/timetable/timetable.api";
import { parentApi, type ChildRecord } from "@/modules/parent-portal/parent.api";
import { idCardApi, downloadBlob, printBlob, type IdCardData } from "@/modules/students/idCard.api";
import { StudentIdCard, StudentIdCardSkeleton } from "@/modules/students/components/StudentIdCard";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DashboardSummary {
  totals: {
    students: number;
    activeStudents: number;
    suspendedStudents: number;
    alumniStudents: number;
    teachers: number;
    classes: number;
    sections: number;
  };
  admissionsByStatus: { status: string; count: number }[];
  recentAdmissions: {
    id: string;
    applicationNumber: string;
    studentFirstName: string;
    studentLastName: string;
    status: string;
    createdAt: string;
  }[];
  recentStudents: {
    id: string;
    registrationNumber: string;
    firstName: string;
    lastName: string;
    admissionDate: string;
    section: { name: string; class: { name: string } };
  }[];
  attendanceToday: { byStatus: { status: string; count: number }[]; totalMarked: number };
  homeworkDueThisWeek: number;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  DRAFT: "secondary",
  SUBMITTED: "default",
  REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  ENROLLED: "success",
};

const DAY_NAMES = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function TeacherDashboard({ firstName }: { firstName: string }) {
  const [entries, setEntries] = useState<TimetableEntryRecord[] | null>(null);

  useEffect(() => {
    timetableApi.listMine().then(setEntries).catch(() => setEntries([]));
  }, []);

  const today = DAY_NAMES[new Date().getDay()];
  const todaysClasses = (entries ?? []).filter((e) => e.dayOfWeek === today).sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Good day, {firstName}</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s your teaching day at a glance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4" /> Today&apos;s classes ({today.charAt(0) + today.slice(1).toLowerCase()})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {entries === null ? (
              <Skeleton className="h-24 w-full" />
            ) : todaysClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No classes scheduled today.</p>
            ) : (
              todaysClasses.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">
                      {entry.section.class.name} - {entry.section.name} &middot; {entry.subject.name}
                    </p>
                    {entry.room && <p className="text-xs text-muted-foreground">Room {entry.room}</p>}
                  </div>
                  <Badge variant="outline">
                    {entry.startTime}&ndash;{entry.endTime}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Link to="/attendance" className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-accent">
              <ClipboardCheck className="h-4 w-4 text-primary" /> Mark attendance
            </Link>
            <Link to="/homework" className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-accent">
              <ScrollText className="h-4 w-4 text-primary" /> Assign homework
            </Link>
            <Link to="/lesson-plans" className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-accent">
              <NotebookPen className="h-4 w-4 text-primary" /> Plan a lesson
            </Link>
            <Link to="/timetable" className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-accent">
              <CalendarClock className="h-4 w-4 text-primary" /> View full schedule
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ParentDashboard({ firstName }: { firstName: string }) {
  const [children, setChildren] = useState<ChildRecord[] | null>(null);

  useEffect(() => {
    parentApi.listMyChildren().then(setChildren).catch(() => setChildren([]));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {firstName}</h1>
        <p className="text-sm text-muted-foreground">Keep track of your children&apos;s school life.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children === null ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : children.length === 0 ? (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No children are linked to your account yet. Contact the school office if this seems wrong.
            </CardContent>
          </Card>
        ) : (
          children.map((child) => (
            <Link key={child.id} to={`/my-children/${child.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-3 p-5">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {child.firstName[0]}
                      {child.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {child.firstName} {child.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {child.section.class.name} - {child.section.name}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      <Card>
        <CardContent className="flex items-center gap-3 p-5 text-sm text-muted-foreground">
          <HeartHandshake className="h-4 w-4 text-primary" />
          Open a child above to see attendance, homework, and their weekly timetable.
        </CardContent>
      </Card>
    </div>
  );
}

function StudentDashboard({ firstName }: { firstName: string }) {
  const [card, setCard] = useState<IdCardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    idCardApi
      .getMyCard()
      .then(setCard)
      .catch(() => setCard(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleDownload(side: "front" | "both") {
    try {
      const blob = await idCardApi.downloadMyCardPdf(side);
      downloadBlob(blob, `my-id-card-${side}.pdf`);
    } catch (err) {
      toast({ title: "Download failed", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  async function handlePrint() {
    try {
      const blob = await idCardApi.downloadMyCardPdf("both");
      printBlob(blob);
    } catch (err) {
      toast({ title: "Print failed", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {firstName}</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s your student identity card.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My ID Card</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-start gap-6">
          {loading ? (
            <StudentIdCardSkeleton />
          ) : card ? (
            <StudentIdCard card={card} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Your ID card isn&apos;t available yet. Contact the school office if this seems wrong.
            </p>
          )}
          {card && (
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={() => handleDownload("front")}>
                <Download className="h-4 w-4" /> Download front
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDownload("both")}>
                <Download className="h-4 w-4" /> Download front &amp; back
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4" /> Print
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboard({ firstName }: { firstName: string }) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/dashboard/summary")
      .then(({ data }) => {
        if (!cancelled) setSummary(data.summary);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening across your school today.</p>
      </div>

      {loading || !summary ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Students" value={summary.totals.students} icon={Users} />
            <StatCard label="Total Teachers" value={summary.totals.teachers} icon={UserCheck} />
            <StatCard label="Classes" value={summary.totals.classes} icon={School} />
            <StatCard label="Sections" value={summary.totals.sections} icon={GraduationCap} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Present today" value={summary.attendanceToday.totalMarked} icon={ClipboardCheck} />
            <StatCard label="Homework due this week" value={summary.homeworkDueThisWeek} icon={ScrollText} />
            <StatCard label="Active students" value={summary.totals.activeStudents} icon={Users} />
            <StatCard label="Alumni" value={summary.totals.alumniStudents} icon={GraduationCap} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Admissions pipeline</CardTitle>
              </CardHeader>
              <CardContent className="h-72 pl-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.admissionsByStatus} margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                    <XAxis dataKey="status" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={28} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Student status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active</span>
                  <span className="font-medium">{summary.totals.activeStudents}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Suspended</span>
                  <span className="font-medium">{summary.totals.suspendedStudents}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Alumni</span>
                  <span className="font-medium">{summary.totals.alumniStudents}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent admission applications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {summary.recentAdmissions.length === 0 && (
                  <p className="text-sm text-muted-foreground">No applications yet.</p>
                )}
                {summary.recentAdmissions.map((a) => (
                  <Link
                    key={a.id}
                    to={`/admissions/${a.id}`}
                    className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-accent"
                  >
                    <div>
                      <p className="font-medium">
                        {a.studentFirstName} {a.studentLastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{a.applicationNumber}</p>
                    </div>
                    <Badge variant={STATUS_VARIANT[a.status] ?? "default"}>{a.status}</Badge>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent enrollments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {summary.recentStudents.length === 0 && (
                  <p className="text-sm text-muted-foreground">No students enrolled yet.</p>
                )}
                {summary.recentStudents.map((s) => (
                  <Link
                    key={s.id}
                    to={`/students/${s.id}`}
                    className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-accent"
                  >
                    <div>
                      <p className="font-medium">
                        {s.firstName} {s.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{s.registrationNumber}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {s.section.class.name} - {s.section.name}
                    </span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.fullName.split(" ")[0] ?? "";

  if (user?.roles.includes("PARENT")) return <ParentDashboard firstName={firstName} />;
  if (user?.roles.includes("TEACHER")) return <TeacherDashboard firstName={firstName} />;
  if (user?.roles.includes("STUDENT")) return <StudentDashboard firstName={firstName} />;
  return <AdminDashboard firstName={firstName} />;
}
