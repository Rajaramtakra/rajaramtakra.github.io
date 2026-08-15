import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { CalendarPlus } from "lucide-react";
import { hrApi } from "./hr.api";
import { teacherApi, type TeacherRecord } from "@/modules/teachers/teacher.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface FormValues {
  scheduledAt: string;
  mode: string;
}

export function InterviewScheduleDialog({
  candidateApplicationId,
  onScheduled,
}: {
  candidateApplicationId: string;
  onScheduled: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [interviewerId, setInterviewerId] = useState("");
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>();

  useEffect(() => {
    if (open) {
      teacherApi.search({ pageSize: 100 }).then((res) => {
        setTeachers(res.data);
        if (res.data.length > 0) setInterviewerId(res.data[0].id);
      });
    }
  }, [open]);

  async function onSubmit(values: FormValues) {
    if (!interviewerId) {
      toast({ title: "Select an interviewer", variant: "destructive" });
      return;
    }
    try {
      await hrApi.interviews.schedule({
        candidateApplicationId,
        scheduledAt: new Date(values.scheduledAt).toISOString(),
        mode: values.mode || undefined,
        interviewerId,
      });
      toast({ title: "Interview scheduled" });
      reset();
      setOpen(false);
      onScheduled();
    } catch (err) {
      toast({ title: "Failed to schedule interview", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarPlus className="h-3.5 w-3.5" /> Schedule interview
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule interview</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label>Date &amp; time</Label>
            <Input type="datetime-local" {...register("scheduledAt", { required: true })} />
          </div>
          <div className="space-y-1.5">
            <Label>Interviewer</Label>
            <Select value={interviewerId} onValueChange={setInterviewerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select interviewer" />
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
            <Label>Mode</Label>
            <Input placeholder="e.g. In-person, Video call" {...register("mode")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              Schedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
