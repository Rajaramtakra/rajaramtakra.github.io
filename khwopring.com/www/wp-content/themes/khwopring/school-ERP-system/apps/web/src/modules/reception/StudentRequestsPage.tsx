import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { receptionApi, type StudentRequest, type StudentRequestStatus } from "./reception.api";
import { NewStudentRequestDialog } from "./NewStudentRequestDialog";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Can } from "@/components/Can";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_VARIANT: Record<StudentRequestStatus, "default" | "secondary" | "success" | "warning"> = {
  OPEN: "warning",
  IN_PROGRESS: "default",
  RESOLVED: "success",
  CLOSED: "secondary",
};

const STATUSES: StudentRequestStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export function StudentRequestsPage() {
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [status, setStatus] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    receptionApi
      .listStudentRequests({ status: status === "ALL" ? undefined : status })
      .then(setRequests)
      .finally(() => setLoading(false));
  }
  useEffect(reload, [status]);

  async function handleStatusChange(id: string, next: StudentRequestStatus) {
    try {
      await receptionApi.updateStudentRequestStatus(id, next);
      toast({ title: "Request updated" });
      reload();
    } catch (err) {
      toast({ title: "Failed to update request", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Student Requests</h1>
          <p className="text-sm text-muted-foreground">Certificates, concessions, and other front-desk requests.</p>
        </div>
        <Can anyOf={["reception:manage"]}>
          <NewStudentRequestDialog onCreated={reload} />
        </Can>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
                  <TableHead>Student</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Link to={`/students/${r.student.id}`} className="font-medium text-primary hover:underline">
                        {r.student.firstName} {r.student.lastName}
                      </Link>
                    </TableCell>
                    <TableCell>{r.category}</TableCell>
                    <TableCell>{r.subject}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[r.status]}>{r.status.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Can anyOf={["reception:manage"]}>
                        <Select value={r.status} onValueChange={(v) => handleStatusChange(r.id, v as StudentRequestStatus)}>
                          <SelectTrigger className="ml-auto h-8 w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s.replace("_", " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Can>
                    </TableCell>
                  </TableRow>
                ))}
                {requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No requests found.
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
