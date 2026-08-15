import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { receptionApi } from "./reception.api";
import { academicApi, type SectionRecord } from "@/modules/academic/academic.api";
import { studentApi } from "@/modules/students/student.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function NewPtmMeetingDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [sections, setSections] = useState<SectionRecord[]>([]);
  const [sectionId, setSectionId] = useState("");
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [venue, setVenue] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) academicApi.listSections().then(setSections);
  }, [open]);

  async function handleSubmit() {
    if (!sectionId || !title || !scheduledAt) return;
    setSubmitting(true);
    try {
      const { data: students } = await studentApi.search({ sectionId, pageSize: 200, status: "ACTIVE" });
      if (students.length === 0) {
        toast({ title: "No active students in this section", variant: "destructive" });
        return;
      }
      await receptionApi.createPtmMeeting({
        title,
        scheduledAt: new Date(scheduledAt).toISOString(),
        sectionId,
        venue: venue || undefined,
        notes: notes || undefined,
        studentIds: students.map((s) => s.id),
      });
      toast({ title: `PTM meeting scheduled for ${students.length} students` });
      setTitle("");
      setScheduledAt("");
      setVenue("");
      setNotes("");
      setOpen(false);
      onCreated();
    } catch (err) {
      toast({ title: "Failed to schedule meeting", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> Schedule PTM
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule a parent-teacher meeting</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Section</Label>
            <Select value={sectionId} onValueChange={setSectionId}>
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
            <p className="text-xs text-muted-foreground">All active students in the section will be invited.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Term 1 PTM" />
          </div>
          <div className="space-y-1.5">
            <Label>Date &amp; time</Label>
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Venue (optional)</Label>
            <Input value={venue} onChange={(e) => setVenue(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting || !sectionId || !title || !scheduledAt}>
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
