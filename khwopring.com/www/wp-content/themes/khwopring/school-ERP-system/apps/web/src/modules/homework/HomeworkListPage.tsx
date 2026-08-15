import { useEffect, useState } from "react";
import { Paperclip, Trash2 } from "lucide-react";
import { homeworkApi, type HomeworkRecord } from "./homework.api";
import { HomeworkFormDialog } from "./HomeworkFormDialog";
import { academicApi, type SectionRecord, type SubjectRecord } from "@/modules/academic/academic.api";
import { useAuthStore } from "@/store/auth.store";
import { Can } from "@/components/Can";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function HomeworkListPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManage = hasPermission("homework:manage");

  const [sections, setSections] = useState<SectionRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [sectionId, setSectionId] = useState<string>("");
  const [homework, setHomework] = useState<HomeworkRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    academicApi.listSections().then(setSections);
    academicApi.listSubjects().then(setSubjects);
  }, []);

  function reload() {
    setLoading(true);
    homeworkApi
      .list({ sectionId: sectionId || undefined })
      .then(setHomework)
      .finally(() => setLoading(false));
  }
  useEffect(reload, [sectionId]);

  async function handleDelete(id: string) {
    try {
      await homeworkApi.remove(id);
      toast({ title: "Homework removed" });
      reload();
    } catch (err) {
      toast({ title: "Failed to remove homework", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date(new Date().toDateString());

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Homework</h1>
          <p className="text-sm text-muted-foreground">Assignments by section and subject.</p>
        </div>
        <div className="flex items-center gap-2">
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
          <Can anyOf={["homework:manage"]}>
            <HomeworkFormDialog sections={sections} subjects={subjects} onCreated={reload} />
          </Can>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {homework.map((hw) => (
            <Card key={hw.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{hw.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {hw.section.class.name} - {hw.section.name} &middot; {hw.subject.name}
                    </p>
                  </div>
                  <Badge variant={isOverdue(hw.dueDate) ? "destructive" : "secondary"}>
                    Due {new Date(hw.dueDate).toLocaleDateString()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{hw.description}</p>
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-muted-foreground">
                    {hw.teacher.firstName} {hw.teacher.lastName}
                  </p>
                  <div className="flex items-center gap-2">
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
                    {canManage && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(hw.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {homework.length === 0 && (
            <Card className="lg:col-span-2">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No homework assigned yet.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
