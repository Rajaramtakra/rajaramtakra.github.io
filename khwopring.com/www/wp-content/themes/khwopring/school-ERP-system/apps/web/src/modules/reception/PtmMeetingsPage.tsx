import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { receptionApi, type PtmMeeting } from "./reception.api";
import { NewPtmMeetingDialog } from "./NewPtmMeetingDialog";
import { Can } from "@/components/Can";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function PtmMeetingsPage() {
  const [meetings, setMeetings] = useState<PtmMeeting[]>([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    receptionApi.listPtmMeetings().then(setMeetings).finally(() => setLoading(false));
  }
  useEffect(reload, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Parent-Teacher Meetings</h1>
          <p className="text-sm text-muted-foreground">Schedule PTMs and record attendance.</p>
        </div>
        <Can anyOf={["reception:manage"]}>
          <NewPtmMeetingDialog onCreated={reload} />
        </Can>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Invited</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetings.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <Link to={`/reception/ptm-meetings/${m.id}`} className="font-medium text-primary hover:underline">
                        {m.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {m.section ? `${m.section.class.name} - ${m.section.name}` : "-"}
                    </TableCell>
                    <TableCell>{new Date(m.scheduledAt).toLocaleString()}</TableCell>
                    <TableCell>{m.venue ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{m._count?.attendances ?? 0} students</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {meetings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No PTM meetings scheduled.
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
