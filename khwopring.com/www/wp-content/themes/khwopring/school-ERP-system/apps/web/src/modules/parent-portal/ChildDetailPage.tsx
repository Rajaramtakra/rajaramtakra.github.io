import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Paperclip } from "lucide-react";
import {
  parentApi,
  type ChildAttendanceRecord,
  type ChildHomeworkRecord,
  type ChildRecord,
  type ChildTimetableEntry,
} from "./parent.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ATTENDANCE_VARIANT: Record<string, "success" | "destructive" | "warning" | "secondary" | "default"> = {
  PRESENT: "success",
  ABSENT: "destructive",
  LATE: "warning",
  HALF_DAY: "secondary",
  EXCUSED: "default",
};

const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export function ChildDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [attendance, setAttendance] = useState<ChildAttendanceRecord[]>([]);
  const [homework, setHomework] = useState<ChildHomeworkRecord[]>([]);
  const [timetable, setTimetable] = useState<ChildTimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    Promise.all([
      parentApi.listMyChildren(),
      parentApi.getChildAttendance(studentId),
      parentApi.getChildHomework(studentId),
      parentApi.getChildTimetable(studentId),
    ])
      .then(([childrenList, attendanceList, homeworkList, timetableList]) => {
        setChildren(childrenList);
        setAttendance(attendanceList);
        setHomework(homeworkList);
        setTimetable(timetableList.sort((a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek) || a.startTime.localeCompare(b.startTime)));
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  const child = children.find((c) => c.id === studentId);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{child ? `${child.firstName} ${child.lastName}` : "Child"}</h1>
        {child && (
          <p className="text-sm text-muted-foreground">
            {child.section.class.name} - {child.section.name} &middot; {child.academicSession.name}
          </p>
        )}
      </div>

      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="homework">Homework</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <Card>
            <CardContent className="space-y-2 p-4">
              {attendance.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <span>{new Date(a.date).toLocaleDateString()}</span>
                  <Badge variant={ATTENDANCE_VARIANT[a.status] ?? "default"}>{a.status}</Badge>
                </div>
              ))}
              {attendance.length === 0 && <p className="text-sm text-muted-foreground">No attendance records yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="homework">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {homework.map((hw) => (
              <Card key={hw.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{hw.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p className="text-muted-foreground">
                    {hw.subject.name} &middot; {hw.teacher.firstName} {hw.teacher.lastName}
                  </p>
                  <p>{hw.description}</p>
                  <div className="flex items-center justify-between pt-1">
                    <Badge variant="secondary">Due {new Date(hw.dueDate).toLocaleDateString()}</Badge>
                    {hw.attachmentUrl && (
                      <a
                        href={`/uploads/${hw.attachmentUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Paperclip className="h-3 w-3" /> Attachment
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {homework.length === 0 && (
              <Card className="lg:col-span-2">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">No homework assigned yet.</CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="timetable">
          <Card>
            <CardContent className="space-y-2 p-4">
              {timetable.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">
                      {entry.dayOfWeek} &middot; {entry.startTime}&ndash;{entry.endTime}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.subject.name} &middot; {entry.teacher.firstName} {entry.teacher.lastName}
                      {entry.room ? ` · ${entry.room}` : ""}
                    </p>
                  </div>
                </div>
              ))}
              {timetable.length === 0 && <p className="text-sm text-muted-foreground">No timetable entries yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
