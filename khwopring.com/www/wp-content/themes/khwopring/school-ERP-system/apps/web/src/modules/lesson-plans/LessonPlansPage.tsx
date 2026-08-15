import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createLessonPlanSchema, type CreateLessonPlanInput } from "@erp/shared";
import { NotebookPen, Plus, Trash2 } from "lucide-react";
import { lessonPlanApi, type LessonPlanRecord } from "./lessonPlan.api";
import { teacherApi } from "@/modules/teachers/teacher.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function NewLessonPlanDialog({
  assignments,
  onCreated,
}: {
  assignments: { sectionId: string; subjectId: string; label: string }[];
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateLessonPlanInput>({ resolver: zodResolver(createLessonPlanSchema) });

  async function onSubmit(values: CreateLessonPlanInput) {
    try {
      await lessonPlanApi.create(values as never);
      reset();
      setOpen(false);
      onCreated();
    } catch (err) {
      toast({ title: "Failed to create lesson plan", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> New lesson plan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New lesson plan</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label>Class &amp; subject</Label>
            <Select
              onValueChange={(v) => {
                const [sectionId, subjectId] = v.split("::");
                setValue("sectionId", sectionId);
                setValue("subjectId", subjectId);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your assignment" />
              </SelectTrigger>
              <SelectContent>
                {assignments.map((a) => (
                  <SelectItem key={`${a.sectionId}::${a.subjectId}`} value={`${a.sectionId}::${a.subjectId}`}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Planned date</Label>
            <Input type="date" {...register("plannedDate")} />
            {errors.plannedDate && <p className="text-xs text-destructive">{errors.plannedDate.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Content</Label>
            <Textarea rows={5} {...register("content")} />
            {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LessonPlansPage() {
  const [assignments, setAssignments] = useState<{ sectionId: string; subjectId: string; label: string }[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlanRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherApi.getMyProfile().then((teacher) => {
      const list = (teacher.subjectAssignments ?? []).map((a) => ({
        sectionId: a.section.id,
        subjectId: a.subject.id,
        label: `${a.section.class.name} - ${a.section.name} · ${a.subject.name}`,
      }));
      setAssignments(list);
    });
  }, []);

  function reload() {
    setLoading(true);
    lessonPlanApi
      .list({})
      .then(setLessonPlans)
      .finally(() => setLoading(false));
  }
  useEffect(reload, []);

  async function handleDelete(id: string) {
    try {
      await lessonPlanApi.remove(id);
      toast({ title: "Lesson plan removed" });
      reload();
    } catch (err) {
      toast({ title: "Failed to remove lesson plan", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Lesson Plans</h1>
          <p className="text-sm text-muted-foreground">Your own teaching notes and plans, by class and subject.</p>
        </div>
        <NewLessonPlanDialog assignments={assignments} onCreated={reload} />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {lessonPlans.map((plan) => (
            <Card key={plan.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <NotebookPen className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">{plan.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {plan.section.class.name} - {plan.section.name} &middot; {plan.subject.name} &middot;{" "}
                        {new Date(plan.plannedDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(plan.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{plan.content}</p>
              </CardContent>
            </Card>
          ))}
          {lessonPlans.length === 0 && (
            <Card className="lg:col-span-2">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No lesson plans yet.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
