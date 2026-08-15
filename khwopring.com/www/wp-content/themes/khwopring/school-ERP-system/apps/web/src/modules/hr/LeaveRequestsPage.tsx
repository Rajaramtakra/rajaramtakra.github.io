import { useEffect, useState } from "react";
import { CalendarOff, CheckCircle2, ClipboardList, UserCheck, XCircle } from "lucide-react";
import { hrApi, type LeaveRequestRecord, type LeaveStatusValue } from "./hr.api";
import { teacherApi } from "@/modules/teachers/teacher.api";
import { useAuthStore } from "@/store/auth.store";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUS_VARIANT: Record<LeaveStatusValue, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

function employeeName(request: LeaveRequestRecord) {
  if (request.teacher) return `${request.teacher.firstName} ${request.teacher.lastName}`;
  if (request.staff) return `${request.staff.firstName} ${request.staff.lastName}`;
  return "-";
}

function LeaveApprovalTab() {
  const [status, setStatus] = useState<string | undefined>("PENDING");
  const [requests, setRequests] = useState<LeaveRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    hrApi.leaveRequests
      .listAll({ status })
      .then(setRequests)
      .finally(() => setLoading(false));
  }
  useEffect(reload, [status]);

  async function decide(id: string, decision: "APPROVED" | "REJECTED") {
    try {
      await hrApi.leaveRequests.decide(id, decision);
      toast({ title: `Leave request ${decision.toLowerCase()}` });
      reload();
    } catch (err) {
      toast({ title: "Failed to record decision", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <div className="space-y-4">
      <Select value={status ?? "ALL"} onValueChange={(v) => setStatus(v === "ALL" ? undefined : v)}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          {(["PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{employeeName(r)}</TableCell>
                    <TableCell>{r.leaveType}</TableCell>
                    <TableCell>{new Date(r.fromDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(r.toDate).toLocaleDateString()}</TableCell>
                    <TableCell className="max-w-xs truncate">{r.reason}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "PENDING" && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => decide(r.id, "APPROVED")}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => decide(r.id, "REJECTED")}>
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No leave requests found.
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

function MyLeaveRequestsTab() {
  const [ownProfile, setOwnProfile] = useState<{ teacherId?: string; staffId?: string } | null>(null);
  const [requests, setRequests] = useState<LeaveRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaveType, setLeaveType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reload() {
    setLoading(true);
    hrApi.leaveRequests
      .listMine()
      .then(setRequests)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    teacherApi
      .getMyProfile()
      .then((t) => setOwnProfile({ teacherId: t.id }))
      .catch(() =>
        hrApi.staff
          .getMyProfile()
          .then((s) => setOwnProfile({ staffId: s.id }))
          .catch(() => setOwnProfile(null))
      );
    reload();
  }, []);

  async function handleSubmit() {
    if (!ownProfile) {
      toast({ title: "No teacher or staff profile is linked to your account", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await hrApi.leaveRequests.create({
        teacherId: ownProfile.teacherId,
        staffId: ownProfile.staffId,
        leaveType,
        fromDate,
        toDate,
        reason,
      });
      toast({ title: "Leave request submitted" });
      setLeaveType("");
      setFromDate("");
      setToDate("");
      setReason("");
      reload();
    } catch (err) {
      toast({ title: "Failed to submit leave request", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3 p-5">
          <p className="text-sm font-medium">New leave request</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Leave type</Label>
              <Input placeholder="e.g. Sick, Casual, Earned" value={leaveType} onChange={(e) => setLeaveType(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>From</Label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>To</Label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Reason</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={submitting || !ownProfile}>
            <CalendarOff className="h-4 w-4" /> Submit request
          </Button>
          {!ownProfile && (
            <p className="text-xs text-muted-foreground">
              No teacher or staff profile is linked to your account, so leave requests cannot be submitted.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.leaveType}</TableCell>
                    <TableCell>{new Date(r.fromDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(r.toDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No leave requests yet.
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

export function LeaveRequestsPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canApprove = hasPermission("staff:manage");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leave Requests</h1>
        <p className="text-sm text-muted-foreground">Review staff leave requests or submit your own.</p>
      </div>

      <Tabs defaultValue={canApprove ? "approval" : "mine"}>
        <TabsList>
          {canApprove && (
            <TabsTrigger value="approval">
              <ClipboardList className="mr-1.5 h-4 w-4" /> HR approval
            </TabsTrigger>
          )}
          <TabsTrigger value="mine">
            <UserCheck className="mr-1.5 h-4 w-4" /> My requests
          </TabsTrigger>
        </TabsList>
        {canApprove && (
          <TabsContent value="approval">
            <LeaveApprovalTab />
          </TabsContent>
        )}
        <TabsContent value="mine">
          <MyLeaveRequestsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
