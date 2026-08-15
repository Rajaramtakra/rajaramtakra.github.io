import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Copy, FileUp, ThumbsUp, Upload, UserCheck } from "lucide-react";
import {
  hrApi,
  type CandidateApplicationStatusValue,
  type CandidateRecord,
  type InterviewRecommendationValue,
  type InterviewRecord,
} from "./hr.api";
import { InterviewScheduleDialog } from "./InterviewScheduleDialog";
import { OfferLetterDialog } from "./OfferLetterDialog";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Can } from "@/components/Can";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

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

const RECOMMENDATIONS: InterviewRecommendationValue[] = ["STRONG_YES", "YES", "NO", "STRONG_NO"];

function FeedbackForm({ interview, onSubmitted }: { interview: InterviewRecord; onSubmitted: () => void }) {
  const [rating, setRating] = useState("5");
  const [recommendation, setRecommendation] = useState<InterviewRecommendationValue>("YES");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await hrApi.interviews.submitFeedback(interview.id, {
        rating: Number(rating),
        recommendation,
        comments: comments || undefined,
      });
      toast({ title: "Feedback recorded" });
      onSubmitted();
    } catch (err) {
      toast({ title: "Failed to submit feedback", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-2 space-y-2 rounded-md border border-dashed border-border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={rating} onValueChange={setRating}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((r) => (
              <SelectItem key={r} value={String(r)}>
                {r} / 5
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={recommendation} onValueChange={(v) => setRecommendation(v as InterviewRecommendationValue)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RECOMMENDATIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {r.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Textarea placeholder="Comments (optional)" value={comments} onChange={(e) => setComments(e.target.value)} />
      <Button size="sm" onClick={handleSubmit} disabled={submitting}>
        <ThumbsUp className="h-3.5 w-3.5" /> Submit feedback
      </Button>
    </div>
  );
}

export function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [candidate, setCandidate] = useState<CandidateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversion, setConversion] = useState<{ email: string; temporaryPassword: string } | null>(null);

  function reload() {
    if (!id) return;
    setLoading(true);
    hrApi.candidates.get(id).then(setCandidate).finally(() => setLoading(false));
  }
  useEffect(reload, [id]);

  async function handleResumeUpload(file: File) {
    if (!id) return;
    try {
      await hrApi.candidates.uploadResume(id, file);
      toast({ title: "Resume uploaded" });
      reload();
    } catch (err) {
      toast({ title: "Upload failed", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  async function handleAcceptOffer(applicationId: string) {
    try {
      await hrApi.applications.acceptOfferLetter(applicationId);
      toast({ title: "Offer marked as accepted" });
      reload();
    } catch (err) {
      toast({ title: "Failed to accept offer", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  async function handleConvertToStaff(applicationId: string) {
    try {
      const result = await hrApi.applications.convertToStaff(applicationId);
      setConversion({ email: result.staffMember.email ?? "", temporaryPassword: result.temporaryPassword });
      toast({ title: "Candidate converted to staff member" });
      reload();
    } catch (err) {
      toast({ title: "Conversion failed", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  if (loading || !candidate) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{candidate.fullName}</h1>
          <p className="text-sm text-muted-foreground">
            {candidate.email} &middot; {candidate.phone}
          </p>
        </div>
      </div>

      {conversion && (
        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="space-y-2 p-4 text-sm">
            <p>Staff account created. Share these login credentials securely; the password will not be shown again.</p>
            <div className="flex items-center justify-between rounded-md bg-background px-3 py-2 font-mono text-xs">
              <span>{conversion.email}</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-background px-3 py-2 font-mono text-xs">
              <span>{conversion.temporaryPassword}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  navigator.clipboard.writeText(conversion.temporaryPassword);
                  toast({ title: "Copied to clipboard" });
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Resume</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          {candidate.resumeUrl ? (
            <a
              href={`/uploads/${candidate.resumeUrl}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
            >
              <FileUp className="h-3.5 w-3.5" /> View resume
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">No resume uploaded.</p>
          )}
          <Can anyOf={["hr_recruitment:manage"]}>
            <label>
              <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleResumeUpload(e.target.files[0])} />
              <Button type="button" variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4" /> Upload resume
                </span>
              </Button>
            </label>
          </Can>
        </CardContent>
      </Card>

      {(candidate.applications ?? []).map((app) => (
        <Card key={app.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{app.jobPosting.title}</CardTitle>
            <Badge variant={STATUS_VARIANT[app.status]}>{app.status}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">Interviews</p>
                <Can anyOf={["hr_recruitment:manage"]}>
                  {["SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEWED"].includes(app.status) && (
                    <InterviewScheduleDialog candidateApplicationId={app.id} onScheduled={reload} />
                  )}
                </Can>
              </div>
              <div className="space-y-2">
                {(app.interviews ?? []).map((interview) => (
                  <div key={interview.id} className="rounded-md border border-border p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span>
                        {new Date(interview.scheduledAt).toLocaleString()}
                        {interview.interviewer && (
                          <>
                            {" "}
                            &middot; {interview.interviewer.firstName} {interview.interviewer.lastName}
                          </>
                        )}
                        {interview.mode && <> &middot; {interview.mode}</>}
                      </span>
                      <Badge variant={interview.status === "COMPLETED" ? "success" : "secondary"}>{interview.status}</Badge>
                    </div>
                    {interview.feedback ? (
                      <p className="mt-2 text-muted-foreground">
                        Rating {interview.feedback.rating}/5 &middot; {interview.feedback.recommendation.replace("_", " ")}
                        {interview.feedback.comments && <> &mdash; {interview.feedback.comments}</>}
                      </p>
                    ) : (
                      interview.status === "SCHEDULED" && (
                        <Can anyOf={["hr_recruitment:manage"]}>
                          <FeedbackForm interview={interview} onSubmitted={reload} />
                        </Can>
                      )
                    )}
                  </div>
                ))}
                {(app.interviews ?? []).length === 0 && <p className="text-sm text-muted-foreground">No interviews scheduled.</p>}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Offer</p>
              {app.offerLetter ? (
                <div className="space-y-2 rounded-md border border-border p-3 text-sm">
                  <p>
                    {app.offerLetter.position} &middot; {Number(app.offerLetter.salaryOffered).toFixed(2)} &middot; Joining{" "}
                    {new Date(app.offerLetter.joiningDate).toLocaleDateString()}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {app.offerLetter.filePath && (
                      <a
                        href={`/uploads/${app.offerLetter.filePath}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
                      >
                        <FileUp className="h-3.5 w-3.5" /> View PDF
                      </a>
                    )}
                    {app.offerLetter.acceptedAt ? (
                      <Badge variant="success">Accepted {new Date(app.offerLetter.acceptedAt).toLocaleDateString()}</Badge>
                    ) : (
                      <Can anyOf={["hr_recruitment:manage"]}>
                        <Button size="sm" variant="outline" onClick={() => handleAcceptOffer(app.id)}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark as accepted
                        </Button>
                      </Can>
                    )}
                    {app.offerLetter.acceptedAt && app.status === "OFFERED" && (
                      <Can anyOf={["hr_recruitment:manage"]}>
                        <Button size="sm" onClick={() => handleConvertToStaff(app.id)}>
                          <UserCheck className="h-3.5 w-3.5" /> Convert to staff
                        </Button>
                      </Can>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {app.status === "INTERVIEWED" ? (
                    <Can anyOf={["hr_recruitment:manage"]}>
                      <OfferLetterDialog candidateApplicationId={app.id} onIssued={reload} />
                    </Can>
                  ) : (
                    <p className="text-sm text-muted-foreground">No offer letter issued yet.</p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {(candidate.applications ?? []).length === 0 && (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">This candidate has not applied to any job posting.</CardContent>
        </Card>
      )}
    </div>
  );
}
