import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { examApi, type ExamRecord, type ExamScheduleRecord } from "./exam.api";
import { academicApi, type SectionRecord, type SubjectRecord } from "@/modules/academic/academic.api";
import { studentApi, type StudentRecord } from "@/modules/students/student.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function MarksEntryPage() {
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [sections, setSections] = useState<SectionRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [examId, setExamId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [schedules, setSchedules] = useState<ExamScheduleRecord[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [marks, setMarks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    examApi.listExams().then((list) => {
      setExams(list);
      if (list.length > 0) setExamId(list[0].id);
    });
    academicApi.listSections().then((list) => {
      setSections(list);
      if (list.length > 0) setSectionId(list[0].id);
    });
    academicApi.listSubjects().then(setSubjects);
  }, []);

  useEffect(() => {
    if (!examId || !sectionId) {
      setSchedules([]);
      return;
    }
    examApi.listSchedules({ examId, sectionId }).then(setSchedules);
  }, [examId, sectionId]);

  useEffect(() => {
    if (subjectId || schedules.length === 0) return;
    setSubjectId(schedules[0].subjectId);
  }, [schedules, subjectId]);

  const schedule = useMemo(
    () => schedules.find((s) => s.subjectId === subjectId) ?? null,
    [schedules, subjectId]
  );

  useEffect(() => {
    if (!sectionId) return;
    setLoading(true);
    studentApi
      .search({ sectionId, status: "ACTIVE", pageSize: 100 })
      .then((res) => setStudents(res.data))
      .finally(() => setLoading(false));
  }, [sectionId]);

  useEffect(() => {
    if (!schedule) {
      setMarks({});
      return;
    }
    examApi.listMarks(schedule.id).then((existing) => {
      setMarks(Object.fromEntries(existing.map((m) => [m.studentId, m.marksObtained])));
    });
  }, [schedule]);

  async function handleSubmit() {
    if (!schedule) return;
    setSubmitting(true);
    try {
      await examApi.enterMarks({
        examScheduleId: schedule.id,
        entries: students.map((s) => ({ studentId: s.id, marksObtained: marks[s.id] ?? 0 })),
      });
      toast({ title: "Marks saved" });
    } catch (err) {
      toast({ title: "Failed to save marks", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Marks Entry</h1>
        <p className="text-sm text-muted-foreground">Enter marks for every student in a section, subject by subject.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Select value={examId} onValueChange={setExamId}>
          <SelectTrigger className="sm:w-56">
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
          <SelectTrigger className="sm:w-56">
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
        <Select value={subjectId} onValueChange={setSubjectId}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="Select subject" />
          </SelectTrigger>
          <SelectContent>
            {schedules.map((s) => (
              <SelectItem key={s.subjectId} value={s.subjectId}>
                {subjects.find((subj) => subj.id === s.subjectId)?.name ?? s.subject?.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleSubmit} disabled={submitting || !schedule || students.length === 0}>
          <Save className="h-4 w-4" /> Save marks
        </Button>
      </div>

      {!schedule && (examId || sectionId) && (
        <p className="text-sm text-muted-foreground">
          No exam schedule found for this exam/section/subject combination yet. Create one under Exam Setup &rarr; Schedule.
        </p>
      )}

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
                  <TableHead className="w-40">Marks obtained</TableHead>
                  <TableHead className="w-28">Max marks</TableHead>
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
                      <Input
                        type="number"
                        min={0}
                        max={schedule?.maxMarks}
                        className="h-8 w-28"
                        disabled={!schedule}
                        value={marks[s.id] ?? ""}
                        onChange={(e) =>
                          setMarks((prev) => ({ ...prev, [s.id]: e.target.value === "" ? 0 : Number(e.target.value) }))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{schedule?.maxMarks ?? "-"}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {students.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
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
