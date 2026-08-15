import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Briefcase } from "lucide-react";
import { hrApi, type CandidateApplicationStatusValue, type JobPostingRecord, type JobPostingStatusValue } from "./hr.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Can } from "@/components/Can";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_VARIANT: Record<JobPostingStatusValue, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  OPEN: "success",
  CLOSED: "secondary",
  ON_HOLD: "warning",
};

const APPLICATION_STATUS_VARIANT: Record<
  CandidateApplicationStatusValue,
  "default" | "secondary" | "success" | "destructive" | "warning"
> = {
  APPLIED: "default",
  SHORTLISTED: "secondary",
  INTERVIEW_SCHEDULED: "warning",
  INTERVIEWED: "warning",
  OFFERED: "success",
  REJECTED: "destructive",
  WITHDRAWN: "secondary",
  HIRED: "success",
};

export function JobPostingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [posting, setPosting] = useState<JobPostingRecord | null>(null);
  const [loading, setLoading] = useState(true);

  function reload() {
    if (!id) return;
    setLoading(true);
    hrApi.jobPostings.get(id).then(setPosting).finally(() => setLoading(false));
  }
  useEffect(reload, [id]);

  async function handleStatusChange(status: string) {
    if (!posting) return;
    try {
      await hrApi.jobPostings.updateStatus(posting.id, status as JobPostingStatusValue);
      toast({ title: "Job posting status updated" });
      reload();
    } catch (err) {
      toast({ title: "Failed to update status", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  if (loading || !posting) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{posting.title}</h1>
          <p className="text-sm text-muted-foreground">{posting.department}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[posting.status]} className="text-sm">
            {posting.status}
          </Badge>
          <Can anyOf={["hr_recruitment:manage"]}>
            <Select value={posting.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-36">
                <Briefcase className="mr-1 h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["OPEN", "CLOSED", "ON_HOLD"] as const).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Can>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="whitespace-pre-wrap">{posting.description}</p>
          {posting.requirements && (
            <div>
              <p className="font-medium text-muted-foreground">Requirements</p>
              <p className="whitespace-pre-wrap">{posting.requirements}</p>
            </div>
          )}
          <p className="text-muted-foreground">Openings: {posting.openings}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(posting.applications ?? []).map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <Link to={`/hr/candidates/${app.candidateId}`} className="font-medium text-primary hover:underline">
                      {app.candidate.fullName}
                    </Link>
                  </TableCell>
                  <TableCell>{new Date(app.appliedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={APPLICATION_STATUS_VARIANT[app.status]}>{app.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {(posting.applications ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No applications yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
