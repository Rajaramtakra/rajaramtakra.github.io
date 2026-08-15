import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createAcademicSessionSchema,
  createChapterSchema,
  createClassSchema,
  createSectionSchema,
  createSubjectSchema,
  createSyllabusSchema,
  type CreateAcademicSessionInput,
  type CreateChapterInput,
  type CreateClassInput,
  type CreateSectionInput,
  type CreateSubjectInput,
  type CreateSyllabusInput,
} from "@erp/shared";
import { Plus, Star, Trash2 } from "lucide-react";
import {
  academicApi,
  type AcademicSession,
  type ClassRecord,
  type SectionRecord,
  type SubjectRecord,
  type SyllabusRecord,
} from "./academic.api";
import { teacherApi, type TeacherRecord } from "../teachers/teacher.api";
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

function SessionsTab() {
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [open, setOpen] = useState(false);

  function reload() {
    academicApi.listSessions().then(setSessions);
  }
  useEffect(reload, []);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateAcademicSessionInput>({
    resolver: zodResolver(createAcademicSessionSchema),
  });

  async function onSubmit(values: CreateAcademicSessionInput) {
    try {
      await academicApi.createSession(values as never);
      toast({ title: "Academic session created" });
      reset();
      setOpen(false);
      reload();
    } catch (err) {
      toast({ title: "Failed to create session", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold text-foreground">Academic Sessions</CardTitle>
        <Can anyOf={["academic_session:manage"]}>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" /> New session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New academic session</DialogTitle>
              </DialogHeader>
              <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input placeholder="2026-2027" {...register("name")} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
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
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{new Date(s.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(s.endDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  {s.isCurrent ? (
                    <Badge variant="success">
                      <Star className="mr-1 h-3 w-3" /> Current
                    </Badge>
                  ) : (
                    <Can anyOf={["academic_session:manage"]}>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0"
                        onClick={() => academicApi.setCurrentSession(s.id).then(reload)}
                      >
                        Set as current
                      </Button>
                    </Can>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function SectionCoordinatorSelect({ section, teachers, onChanged }: { section: SectionRecord; teachers: TeacherRecord[]; onChanged: () => void }) {
  return (
    <Select
      value={section.coordinatorTeacherId ?? "none"}
      onValueChange={(v) =>
        academicApi.assignSectionCoordinator(section.id, v === "none" ? null : v).then(() => {
          toast({ title: "Coordinator updated" });
          onChanged();
        })
      }
    >
      <SelectTrigger className="h-7 w-[160px] text-xs">
        <SelectValue placeholder="Coordinator" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No coordinator</SelectItem>
        {teachers.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.firstName} {t.lastName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ClassesTab() {
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [sectionDialogClassId, setSectionDialogClassId] = useState<string | null>(null);

  function reload() {
    academicApi.listClasses().then(setClasses);
  }
  useEffect(() => {
    academicApi.listSessions().then(setSessions);
    teacherApi.search({ pageSize: 200 }).then((r) => setTeachers(r.data));
    reload();
  }, []);

  const classForm = useForm<CreateClassInput>({ resolver: zodResolver(createClassSchema) });
  const sectionForm = useForm<CreateSectionInput>({ resolver: zodResolver(createSectionSchema) });

  async function onCreateClass(values: CreateClassInput) {
    try {
      await academicApi.createClass(values);
      toast({ title: "Class created" });
      classForm.reset();
      setOpen(false);
      reload();
    } catch (err) {
      toast({ title: "Failed to create class", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  async function onCreateSection(values: CreateSectionInput) {
    try {
      await academicApi.createSection({ ...values, classId: sectionDialogClassId! });
      toast({ title: "Section created" });
      sectionForm.reset();
      setSectionDialogClassId(null);
      reload();
    } catch (err) {
      toast({ title: "Failed to create section", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold text-foreground">Classes &amp; Sections</CardTitle>
        <Can anyOf={["class:manage"]}>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" /> New class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New class</DialogTitle>
              </DialogHeader>
              <form className="space-y-3" onSubmit={classForm.handleSubmit(onCreateClass)}>
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input placeholder="Grade 4" {...classForm.register("name")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Academic session</Label>
                  <Select onValueChange={(v) => classForm.setValue("academicSessionId", v)}>
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
                <DialogFooter>
                  <Button type="submit" disabled={classForm.formState.isSubmitting}>
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </Can>
      </CardHeader>
      <CardContent className="space-y-4">
        {classes.map((klass) => (
          <div key={klass.id} className="rounded-lg border border-border p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium">{klass.name}</p>
              <Can anyOf={["section:manage"]}>
                <Dialog
                  open={sectionDialogClassId === klass.id}
                  onOpenChange={(v) => setSectionDialogClassId(v ? klass.id : null)}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4" /> Add section
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>New section for {klass.name}</DialogTitle>
                    </DialogHeader>
                    <form className="space-y-3" onSubmit={sectionForm.handleSubmit(onCreateSection)}>
                      <div className="space-y-1.5">
                        <Label>Name</Label>
                        <Input placeholder="A" {...sectionForm.register("name")} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Capacity</Label>
                        <Input type="number" placeholder="40" {...sectionForm.register("capacity", { valueAsNumber: true })} />
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={sectionForm.formState.isSubmitting}>
                          Create
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </Can>
            </div>
            <div className="flex flex-wrap gap-2">
              {klass.sections.length === 0 && <p className="text-sm text-muted-foreground">No sections yet.</p>}
              {klass.sections.map((section) => (
                <div key={section.id} className="flex items-center gap-2">
                  <Badge variant="secondary">
                    Section {section.name}
                    {section.capacity ? ` (cap. ${section.capacity})` : ""}
                  </Badge>
                  <Can anyOf={["section:manage"]}>
                    <SectionCoordinatorSelect section={section} teachers={teachers} onChanged={reload} />
                  </Can>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SubjectsTab() {
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [open, setOpen] = useState(false);

  function reload() {
    academicApi.listSubjects().then(setSubjects);
  }
  useEffect(reload, []);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<CreateSubjectInput>({
    resolver: zodResolver(createSubjectSchema),
  });

  async function onSubmit(values: CreateSubjectInput) {
    try {
      await academicApi.createSubject(values);
      toast({ title: "Subject created" });
      reset();
      setOpen(false);
      reload();
    } catch (err) {
      toast({ title: "Failed to create subject", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold text-foreground">Subjects</CardTitle>
        <Can anyOf={["subject:manage"]}>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" /> New subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New subject</DialogTitle>
              </DialogHeader>
              <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input placeholder="Mathematics" {...register("name")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Code</Label>
                  <Input placeholder="MATH101" {...register("code")} />
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
              <TableHead>Code</TableHead>
              <TableHead>Elective</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.map((subject) => (
              <TableRow key={subject.id}>
                <TableCell className="font-medium">{subject.name}</TableCell>
                <TableCell>{subject.code}</TableCell>
                <TableCell>{subject.isElective ? "Yes" : "No"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ChapterRow({ chapter, onChanged }: { chapter: SyllabusRecord["chapters"][number]; onChanged: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded border border-border px-3 py-1.5">
      <label className="flex flex-1 items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border"
          checked={chapter.isCompleted}
          onChange={(e) => academicApi.updateChapter(chapter.id, { isCompleted: e.target.checked }).then(onChanged)}
        />
        <span className={chapter.isCompleted ? "text-muted-foreground line-through" : ""}>{chapter.title}</span>
      </label>
      <Can anyOf={["syllabus:manage"]}>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-destructive"
          onClick={() => academicApi.deleteChapter(chapter.id).then(onChanged)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </Can>
    </div>
  );
}

function SyllabusCard({ syllabus, onChanged }: { syllabus: SyllabusRecord; onChanged: () => void }) {
  const [addingChapter, setAddingChapter] = useState(false);
  const chapterForm = useForm<CreateChapterInput>({
    resolver: zodResolver(createChapterSchema),
    defaultValues: { order: syllabus.chapters.length },
  });

  async function onAddChapter(values: CreateChapterInput) {
    try {
      await academicApi.createChapter(syllabus.id, values);
      chapterForm.reset({ order: syllabus.chapters.length + 1 });
      setAddingChapter(false);
      onChanged();
    } catch (err) {
      toast({ title: "Failed to add chapter", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  const completedCount = syllabus.chapters.filter((c) => c.isCompleted).length;

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="font-medium">{syllabus.title}</p>
          <p className="text-xs text-muted-foreground">
            {syllabus.subject.name} &middot; {syllabus.class.name} &middot; {syllabus.academicSession.name}
          </p>
        </div>
        <Badge variant="secondary">
          {completedCount}/{syllabus.chapters.length} chapters done
        </Badge>
      </div>
      {syllabus.description && <p className="mb-2 text-sm text-muted-foreground">{syllabus.description}</p>}
      <div className="space-y-1.5">
        {syllabus.chapters.map((chapter) => (
          <ChapterRow key={chapter.id} chapter={chapter} onChanged={onChanged} />
        ))}
      </div>
      <Can anyOf={["syllabus:manage"]}>
        {addingChapter ? (
          <form className="mt-2 flex items-end gap-2" onSubmit={chapterForm.handleSubmit(onAddChapter)}>
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Chapter title</Label>
              <Input className="h-8" {...chapterForm.register("title")} />
            </div>
            <div className="w-20 space-y-1">
              <Label className="text-xs">Order</Label>
              <Input className="h-8" type="number" {...chapterForm.register("order", { valueAsNumber: true })} />
            </div>
            <Button type="submit" size="sm" disabled={chapterForm.formState.isSubmitting}>
              Add
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAddingChapter(false)}>
              Cancel
            </Button>
          </form>
        ) : (
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setAddingChapter(true)}>
            <Plus className="h-4 w-4" /> Add chapter
          </Button>
        )}
      </Can>
    </div>
  );
}

function SyllabusTab() {
  const [syllabi, setSyllabi] = useState<SyllabusRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [open, setOpen] = useState(false);

  function reload() {
    academicApi.listSyllabi().then(setSyllabi);
  }
  useEffect(() => {
    reload();
    academicApi.listSubjects().then(setSubjects);
    academicApi.listClasses().then(setClasses);
    academicApi.listSessions().then(setSessions);
  }, []);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<CreateSyllabusInput>({
    resolver: zodResolver(createSyllabusSchema),
  });

  async function onSubmit(values: CreateSyllabusInput) {
    try {
      await academicApi.createSyllabus(values);
      toast({ title: "Syllabus created" });
      reset();
      setOpen(false);
      reload();
    } catch (err) {
      toast({ title: "Failed to create syllabus", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold text-foreground">Syllabus &amp; Chapters</CardTitle>
        <Can anyOf={["syllabus:manage"]}>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" /> New syllabus
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New syllabus</DialogTitle>
              </DialogHeader>
              <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input placeholder="Term 1 Syllabus" {...register("title")} />
                  {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                </div>
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
                  <Label>Class</Label>
                  <Select onValueChange={(v) => setValue("classId", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
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
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Input {...register("description")} />
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
      <CardContent className="space-y-4">
        {syllabi.length === 0 && <p className="text-sm text-muted-foreground">No syllabi created yet.</p>}
        {syllabi.map((syllabus) => (
          <SyllabusCard key={syllabus.id} syllabus={syllabus} onChanged={reload} />
        ))}
      </CardContent>
    </Card>
  );
}

export function AcademicSetupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Academic Setup</h1>
        <p className="text-sm text-muted-foreground">Manage academic sessions, classes, sections, and subjects.</p>
      </div>
      <Tabs defaultValue="sessions">
        <TabsList>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="classes">Classes &amp; Sections</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
        </TabsList>
        <TabsContent value="sessions">
          <SessionsTab />
        </TabsContent>
        <TabsContent value="classes">
          <ClassesTab />
        </TabsContent>
        <TabsContent value="subjects">
          <SubjectsTab />
        </TabsContent>
        <TabsContent value="syllabus">
          <SyllabusTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
