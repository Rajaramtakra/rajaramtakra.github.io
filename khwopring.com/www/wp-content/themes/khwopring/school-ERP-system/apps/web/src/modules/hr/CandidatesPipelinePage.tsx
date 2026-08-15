import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCandidateSchema, type CreateCandidateInput } from "@erp/shared";
import { ArrowRight, Plus, XCircle } from "lucide-react";
import { hrApi, type CandidateApplicationRecord, type CandidateApplicationStatusValue, type JobPostingRecord } from "./hr.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Can } from "@/components/Can";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const STATUS_VARIANT: Record<CandidateApplicationStatusValue, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  APPLIED: "default",
  SHORTLISTED: "secondary",
  INTERVIEW_SCHEDULED: "warning",
  INTERVIEWED: "warning",
  OFFERED: "success",
  REJECTED: "destructive",
  WITHDRAWN: "secondary",
  HIRED: "success",
};

const NEXT_STAGE: Partial<Record<CandidateApplicationStatusValue, CandidateApplicationStatusValue>> = {
  APPLIED: "SHORTLISTED",
  SHORTLISTED: "INTERVIEW_SCHEDULED",
  INTERVIEW_SCHEDULED: "INTERVIEWED",
  INTERVIEWED: "OFFERED",
  OFFERED: "HIRED",
};

const TERMINAL: CandidateApplicationStatusValue[] = ["REJECTED", "WITHDRAWN", "HIRED"];

function AddCandidateDialog({ jobPostings, onCreated }: { jobPostings: JobPostingRecord[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [jobPostingId, setJobPostingId] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCandidateInput>({ resolver: zodResolver(createCandidateSchema) });

  async function onSubmit(values: CreateCandidateInput) {
    if (!jobPostingId) {
      toast({ title: "Select a job posting first", variant: "destructive" });
      return;
    }
    try {
      const candidate = await hrApi.candidates.create(values as never);
      await hrApi.applications.create({ jobPostingId, candidateId: candidate.id });
      reset();
      setJobPostingId("");
      setOpen(false);
      onCreated();
    } catch (err) {
      toast({ title: "Failed to add candidate", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> Add candidate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add candidate</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label>Job posting</Label>
            <Select value={jobPostingId} onValueChange={setJobPostingId}>
              <SelectTrigger>
                <SelectValue placeholder="Select job posting" />
              </SelectTrigger>
              <SelectContent>
                {jobPostings.map((jp) => (
                  <SelectItem key={jp.id} value={jp.id}>
                    {jp.title} ({jp.department})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Full name</Label>
              <Input {...register("fullName")} />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input {...register("phone")} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              Add candidate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CandidatesPipelinePage() {
  const [jobPostings, setJobPostings] = useState<JobPostingRecord[]>([]);
  const [jobPostingFilter, setJobPostingFilter] = useState<string | undefined>(undefined);
  const [applications, setApplications] = useState<CandidateApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hrApi.jobPostings.list({ pageSize: 100 }).then((res) => setJobPostings(res.data));
  }, []);

  function reload() {
    setLoading(true);
    hrApi.applications
      .list({ pageSize: 100, jobPostingId: jobPostingFilter })
      .then((res) => setApplications(res.data))
      .finally(() => setLoading(false));
  }
  useEffect(reload, [jobPostingFilter]);

  async function advance(app: CandidateApplicationRecord) {
    const next = NEXT_STAGE[app.status];
    if (!next) return;
    try {
      await hrApi.applications.updateStatus(app.id, next);
      toast({ title: `Moved to ${next}` });
      reload();
    } catch (err) {
      toast({ title: "Failed to advance stage", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  async function reject(app: CandidateApplicationRecord) {
    try {
      await hrApi.applications.updateStatus(app.id, "REJECTED");
      toast({ title: "Application rejected" });
      reload();
    } catch (err) {
      toast({ title: "Failed to reject application", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Candidates</h1>
          <p className="text-sm text-muted-foreground">Track candidates through the recruitment pipeline.</p>
        </div>
        <Can anyOf={["hr_recruitment:manage"]}>
          <AddCandidateDialog jobPostings={jobPostings} onCreated={reload} />
        </Can>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <Select
            value={jobPostingFilter ?? "ALL"}
            onValueChange={(v) => setJobPostingFilter(v === "ALL" ? undefined : v)}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="All job postings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All job postings</SelectItem>
              {jobPostings.map((jp) => (
                <SelectItem key={jp.id} value={jp.id}>
                  {jp.title}
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
                  <TableHead>Candidate</TableHead>
                  <TableHead>Job posting</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <Link to={`/hr/candidates/${app.candidateId}`} className="font-medium text-primary hover:underline">
                        {app.candidate.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>{app.jobPosting.title}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[app.status]}>{app.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Can anyOf={["hr_recruitment:manage"]}>
                        <div className="flex justify-end gap-2">
                          {NEXT_STAGE[app.status] && (
                            <Button variant="outline" size="sm" onClick={() => advance(app)}>
                              <ArrowRight className="h-3.5 w-3.5" /> Advance
                            </Button>
                          )}
                          {!TERMINAL.includes(app.status) && (
                            <Button variant="destructive" size="sm" onClick={() => reject(app)}>
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </Button>
                          )}
                        </div>
                      </Can>
                    </TableCell>
                  </TableRow>
                ))}
                {applications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No candidates in the pipeline.
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
