import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { receptionApi, type PtmMeetingDetail } from "./reception.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Can } from "@/components/Can";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function PtmMeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [meeting, setMeeting] = useState<PtmMeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Record<string, { attended: boolean; remarks: string }>>({});

  function reload() {
    if (!id) return;
    setLoading(true);
    receptionApi
      .getPtmMeeting(id)
      .then((m) => {
        setMeeting(m);
        setDraft(
          Object.fromEntries(
            m.attendances.map((a) => [a.studentId, { attended: a.attended, remarks: a.remarks ?? "" }])
          )
        );
      })
      .finally(() => setLoading(false));
  }
  useEffect(reload, [id]);

  async function handleSave() {
    if (!id || !meeting) return;
    setSaving(true);
    try {
      await receptionApi.recordPtmAttendance(
        id,
        meeting.attendances.map((a) => ({
          studentId: a.studentId,
          attended: draft[a.studentId]?.attended ?? false,
          remarks: draft[a.studentId]?.remarks || undefined,
        }))
      );
      toast({ title: "Attendance saved" });
      reload();
    } catch (err) {
      toast({ title: "Failed to save attendance", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (loading || !meeting) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{meeting.title}</h1>
        <p className="text-sm text-muted-foreground">
          {new Date(meeting.scheduledAt).toLocaleString()}
          {meeting.venue ? ` · ${meeting.venue}` : ""}
          {meeting.section ? ` · ${meeting.section.class.name} - ${meeting.section.name}` : ""}
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Attendance</CardTitle>
          <Can anyOf={["reception:manage"]}>
            <Button onClick={handleSave} disabled={saving}>
              Save attendance
            </Button>
          </Can>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Attended</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meeting.attendances.map((a) => (
                <TableRow key={a.studentId}>
                  <TableCell>
                    {a.student.firstName} {a.student.lastName} ({a.student.registrationNumber})
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={draft[a.studentId]?.attended ?? false}
                      onCheckedChange={(v) =>
                        setDraft((prev) => ({ ...prev, [a.studentId]: { ...prev[a.studentId], attended: v } }))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8"
                      value={draft[a.studentId]?.remarks ?? ""}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          [a.studentId]: { ...prev[a.studentId], remarks: e.target.value },
                        }))
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
