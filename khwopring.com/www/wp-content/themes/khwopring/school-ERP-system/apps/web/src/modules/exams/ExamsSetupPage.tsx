import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createExamSchema,
  createExamScheduleSchema,
  createGradeScaleSchema,
  EXAM_TYPES,
  type CreateExamInput,
  type CreateExamScheduleInput,
  type CreateGradeScaleInput,
} from "@erp/shared";
import { Plus } from "lucide-react";
import { examApi, type ExamRecord, type ExamScheduleRecord, type GradeScaleRecord } from "./exam.api";
import { AdmitCardsCoScholasticTab } from "./AdmitCardsCoScholasticTab";
import { academicApi, type AcademicSession, type SectionRecord, type SubjectRecord } from "@/modules/academic/academic.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Can } from "@/components/Can";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function ExamsTab() {
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [open, setOpen] = useState(false);

  function reload() {
    examApi.listExams().then(setExams);
  }
  useEffect(() => {
    academicApi.listSessions().then(setSessions);
    reload();
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateExamInput>({ resolver: zodResolver(createExamSchema) });

  async function onSubmit(values: CreateExamInput) {
    try {
      await examApi.createExam(values as never);
      toast({ title: "Exam created" });
      reset();
      setOpen(false);
      reload();
    } catch (err) {
      toast({ title: "Failed to create exam", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold text-foreground">Exams</CardTitle>
        <Can anyOf={["exam:manage"]}>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" /> New exam
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New exam</DialogTitle>
              </DialogHeader>
              <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input placeholder="Mid Term 2026" {...register("name")} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Exam type</Label>
                    <Select onValueChange={(v) => setValue("examType", v as CreateExamInput["examType"])}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXAM_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Academic session</Label>
                    <Select onValueChange={(v) => setValue("academicSessionId", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select session" />
                      </SelectTrigger>
                      <SelectContent>
                        {sessions.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Start date</Label>
                    <Input type="date" {...register("startDate")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>End date</Label>
                    <Input type="date" {...register("endDate")} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </Can>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.map((exam) => (
              <TableRow key={exam.id}>
                <TableCell className="font-medium">{exam.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{exam.examType.replace("_", " ")}</Badge>
                </TableCell>
                <TableCell>{exam.academicSession?.name}</TableCell>
                <TableCell>{new Date(exam.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(exam.endDate).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
            {exams.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No exams created yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ScheduleTab() {
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [sections, setSections] = useState<SectionRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [examId, setExamId] = useState("");
  const [schedules, setSchedules] = useState<ExamScheduleRecord[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    examApi.listExams().then((list) => {
      setExams(list);
      if (list.length > 0) setExamId(list[0].id);
    });
    academicApi.listSections().then(setSections);
    academicApi.listSubjects().then(setSubjects);
  }, []);

  function reload() {
    if (!examId) return;
    examApi.listSchedules({ examId }).then(setSchedules);
  }
  useEffect(reload, [examId]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<CreateExamScheduleInput>({ resolver: zodResolver(createExamScheduleSchema) });

  async function onSubmit(values: CreateExamScheduleInput) {
    try {
      await examApi.createSchedule({ ...values, examId } as never);
      toast({ title: "Schedule entry created" });
      reset();
      setOpen(false);
      reload();
    } catch (err) {
      toast({ title: "Failed to create schedule entry", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base font-semibold text-foreground">Schedule</CardTitle>
          <Select value={examId} onValueChange={setExamId}>
            <SelectTrigger className="w-56">
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
        </div>
        <Can anyOf={["exam:manage"]}>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={!examId}>
                <Plus className="h-4 w-4" /> Add schedule entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New schedule entry</DialogTitle>
              </DialogHeader>
              <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Subject</Label>
                    <Select onValueChange={(v) => setValue("subjectId", v)}>
                      <SelectTrigger>
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
                  <div className="space-y-1.5">
                    <Label>Section</Label>
                    <Select onValueChange={(v) => setValue("sectionId", v)}>
                      <SelectTrigger>
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
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Exam date</Label>
                  <Input type="date" {...register("examDate")} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Start time</Label>
                    <Input type="time" {...register("startTime")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>End time</Label>
                    <Input type="time" {...register("endTime")} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Max marks</Label>
                    <Input type="number" {...register("maxMarks", { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Passing marks</Label>
                    <Input type="number" {...register("passingMarks", { valueAsNumber: true })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </Can>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Max marks</TableHead>
              <TableHead>Passing marks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.subject?.name}</TableCell>
                <TableCell>
                  {s.section?.class?.name} - {s.section?.name}
                </TableCell>
                <TableCell>{new Date(s.examDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  {s.startTime} - {s.endTime}
                </TableCell>
                <TableCell>{s.maxMarks}</TableCell>
                <TableCell>{s.passingMarks}</TableCell>
              </TableRow>
            ))}
            {schedules.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No schedule entries for this exam yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function GradeScalesTab() {
  const [gradeScales, setGradeScales] = useState<GradeScaleRecord[]>([]);
  const [open, setOpen] = useState(false);

  function reload() {
    examApi.listGradeScales().then(setGradeScales);
  }
  useEffect(reload, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateGradeScaleInput>({ resolver: zodResolver(createGradeScaleSchema) });

  async function onSubmit(values: CreateGradeScaleInput) {
    try {
      await examApi.createGradeScale(values as never);
      toast({ title: "Grade scale created" });
      reset();
      setOpen(false);
      reload();
    } catch (err) {
      toast({ title: "Failed to create grade scale", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold text-foreground">Grade Scales</CardTitle>
        <Can anyOf={["exam:manage"]}>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" /> New grade scale
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New grade scale row</DialogTitle>
              </DialogHeader>
              <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input placeholder="Distinction" {...register("name")} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Min percent</Label>
                    <Input type="number" step="0.01" {...register("minPercent", { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Max percent</Label>
                    <Input type="number" step="0.01" {...register("maxPercent", { valueAsNumber: true })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Grade</Label>
                    <Input placeholder="A+" {...register("grade")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>GPA point</Label>
                    <Input type="number" step="0.01" {...register("gpaPoint", { valueAsNumber: true })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </Can>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Range</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>GPA point</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gradeScales.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="font-medium">{g.name}</TableCell>
                <TableCell>
                  {g.minPercent}% - {g.maxPercent}%
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{g.grade}</Badge>
                </TableCell>
                <TableCell>{g.gpaPoint}</TableCell>
              </TableRow>
            ))}
            {gradeScales.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No grade scale rows defined yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function ExamsSetupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Exam Setup</h1>
        <p className="text-sm text-muted-foreground">Manage exams, their subject/section schedules, and grade scales.</p>
      </div>
      <Tabs defaultValue="exams">
        <TabsList>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="grades">Grade Scales</TabsTrigger>
          <TabsTrigger value="admit-cards">Admit Cards &amp; Co-Scholastic</TabsTrigger>
        </TabsList>
        <TabsContent value="exams">
          <ExamsTab />
        </TabsContent>
        <TabsContent value="schedule">
          <ScheduleTab />
        </TabsContent>
        <TabsContent value="grades">
          <GradeScalesTab />
        </TabsContent>
        <TabsContent value="admit-cards">
          <AdmitCardsCoScholasticTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
