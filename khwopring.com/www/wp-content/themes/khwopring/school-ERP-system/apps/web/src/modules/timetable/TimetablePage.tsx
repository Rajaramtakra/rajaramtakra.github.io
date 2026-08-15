import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPeriodSchema, createTimetableEntrySchema, type CreatePeriodInput, type CreateTimetableEntryInput } from "@erp/shared";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import { timetableApi, type PeriodRecord, type TimetableEntryRecord } from "./timetable.api";
import { academicApi, type SectionRecord, type SubjectRecord } from "@/modules/academic/academic.api";
import { teacherApi, type TeacherRecord } from "@/modules/teachers/teacher.api";
import { useAuthStore } from "@/store/auth.store";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

const CUSTOM_TIME = "CUSTOM";

function NewEntryDialog({
  sectionId,
  subjects,
  teachers,
  periods,
  onCreated,
}: {
  sectionId: string;
  subjects: SubjectRecord[];
  teachers: TeacherRecord[];
  periods: PeriodRecord[];
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [periodChoice, setPeriodChoice] = useState<string>(periods[0]?.id ?? CUSTOM_TIME);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTimetableEntryInput>({
    resolver: zodResolver(createTimetableEntrySchema),
    defaultValues: { sectionId, dayOfWeek: "MONDAY", periodId: periods[0]?.id },
  });

  function handlePeriodChoice(value: string) {
    setPeriodChoice(value);
    if (value === CUSTOM_TIME) {
      setValue("periodId", undefined);
    } else {
      setValue("periodId", value);
      setValue("startTime", undefined);
      setValue("endTime", undefined);
    }
  }

  async function onSubmit(values: CreateTimetableEntryInput) {
    try {
      await timetableApi.create({ ...values, sectionId });
      reset({ sectionId, dayOfWeek: "MONDAY", periodId: periods[0]?.id });
      setPeriodChoice(periods[0]?.id ?? CUSTOM_TIME);
      setOpen(false);
      onCreated();
    } catch (err) {
      toast({ title: "Failed to create timetable entry", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> Add class
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add timetable entry</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label>Day</Label>
            <Select defaultValue="MONDAY" onValueChange={(v) => setValue("dayOfWeek", v as never)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Period</Label>
            <Select value={periodChoice} onValueChange={handlePeriodChoice}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.startTime}&ndash;{p.endTime})
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM_TIME}>Custom time...</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {periodChoice === CUSTOM_TIME && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start time</Label>
                <Input type="time" {...register("startTime")} />
                {errors.startTime && <p className="text-xs text-destructive">{errors.startTime.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>End time</Label>
                <Input type="time" {...register("endTime")} />
                {errors.endTime && <p className="text-xs text-destructive">{errors.endTime.message}</p>}
              </div>
            </div>
          )}
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
            <Label>Teacher</Label>
            <Select onValueChange={(v) => setValue("teacherId", v)}>
              <SelectTrigger>
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
          </div>
          <div className="space-y-1.5">
            <Label>Room</Label>
            <Input {...register("room")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ManagePeriodsDialog({ periods, onChanged }: { periods: PeriodRecord[]; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePeriodInput>({ resolver: zodResolver(createPeriodSchema), defaultValues: { isBreak: false } });

  async function onSubmit(values: CreatePeriodInput) {
    try {
      await timetableApi.createPeriod(values);
      toast({ title: "Period added" });
      reset({ isBreak: false });
      onChanged();
    } catch (err) {
      toast({ title: "Failed to add period", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    try {
      await timetableApi.deletePeriod(id);
      toast({ title: "Period removed" });
      onChanged();
    } catch (err) {
      toast({ title: "Failed to remove period", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarClock className="h-4 w-4" /> Manage periods
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Period master</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="max-h-56 space-y-2 overflow-y-auto">
            {periods.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                <div>
                  <span className="font-medium">{p.name}</span>{" "}
                  <span className="text-muted-foreground">
                    {p.startTime}&ndash;{p.endTime} {p.isBreak && "(Break)"}
                  </span>
                </div>
                <button onClick={() => handleDelete(p.id)} className="text-destructive hover:opacity-70" aria-label="Remove period">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {periods.length === 0 && <p className="text-sm text-muted-foreground">No periods defined yet.</p>}
          </div>

          <form className="space-y-3 border-t border-border pt-3" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input placeholder="Period 1" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Order</Label>
                <Input type="number" min={0} {...register("order", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label>Start time</Label>
                <Input type="time" {...register("startTime")} />
              </div>
              <div className="space-y-1.5">
                <Label>End time</Label>
                <Input type="time" {...register("endTime")} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isBreak"
                checked={watch("isBreak")}
                onChange={(e) => setValue("isBreak", e.target.checked)}
              />
              <Label htmlFor="isBreak">This is a break/recess period</Label>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                Add period
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WeeklyGrid({ entries, canManage, onDeleted }: { entries: TimetableEntryRecord[]; canManage: boolean; onDeleted: () => void }) {
  const byDay = useMemo(() => {
    const map = new Map<string, TimetableEntryRecord[]>();
    for (const day of DAYS) map.set(day, []);
    for (const entry of entries) map.get(entry.dayOfWeek)?.push(entry);
    for (const list of map.values()) list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return map;
  }, [entries]);

  async function handleDelete(id: string) {
    try {
      await timetableApi.remove(id);
      toast({ title: "Timetable entry removed" });
      onDeleted();
    } catch (err) {
      toast({ title: "Failed to remove entry", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3 overflow-x-auto sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {DAYS.filter((day) => day !== "SUNDAY" || (byDay.get(day)?.length ?? 0) > 0).map((day) => (
        <Card key={day}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{day}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(byDay.get(day) ?? []).map((entry) => (
              <div key={entry.id} className="rounded-md border border-border p-2 text-xs">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px]">
                    {entry.startTime}&ndash;{entry.endTime}
                  </Badge>
                  {canManage && (
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-destructive hover:opacity-70"
                      aria-label="Remove entry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="mt-1 font-medium">{entry.subject.name}</p>
                <p className="text-muted-foreground">
                  {entry.teacher.firstName} {entry.teacher.lastName}
                  {entry.room ? ` · ${entry.room}` : ""}
                </p>
              </div>
            ))}
            {(byDay.get(day) ?? []).length === 0 && <p className="text-xs text-muted-foreground">No classes.</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TimetablePage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManage = hasPermission("timetable:manage");

  const [sections, setSections] = useState<SectionRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [periods, setPeriods] = useState<PeriodRecord[]>([]);
  const [sectionId, setSectionId] = useState<string>("");
  const [entries, setEntries] = useState<TimetableEntryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  function reloadPeriods() {
    timetableApi.listPeriods().then(setPeriods);
  }

  useEffect(() => {
    if (!canManage) return;
    academicApi.listSections().then((list) => {
      setSections(list);
      if (list.length > 0) setSectionId(list[0].id);
    });
    academicApi.listSubjects().then(setSubjects);
    teacherApi.search({ pageSize: 100 }).then((res) => setTeachers(res.data));
    reloadPeriods();
  }, [canManage]);

  function reload() {
    setLoading(true);
    const request = canManage ? (sectionId ? timetableApi.listBySection(sectionId) : Promise.resolve([])) : timetableApi.listMine();
    request.then(setEntries).finally(() => setLoading(false));
  }

  useEffect(reload, [canManage, sectionId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Timetable</h1>
          <p className="text-sm text-muted-foreground">
            {canManage ? "Weekly class schedule for a section." : "Your weekly teaching schedule."}
          </p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
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
            <ManagePeriodsDialog periods={periods} onChanged={reloadPeriods} />
            {sectionId && (
              <NewEntryDialog sectionId={sectionId} subjects={subjects} teachers={teachers} periods={periods} onCreated={reload} />
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No timetable entries yet.
          </CardContent>
        </Card>
      ) : (
        <WeeklyGrid entries={entries} canManage={canManage} onDeleted={reload} />
      )}
    </div>
  );
}
