import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, FileUp, Upload, XCircle } from "lucide-react";
import { admissionApi, type AdmissionApplication } from "./admission.api";
import { academicApi, type SectionRecord } from "@/modules/academic/academic.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Can } from "@/components/Can";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  DRAFT: "secondary",
  SUBMITTED: "default",
  REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  ENROLLED: "success",
};

const DOCUMENT_CATEGORIES = [
  "BIRTH_CERTIFICATE",
  "PREVIOUS_MARKSHEET",
  "PHOTO",
  "ID_PROOF",
  "ADDRESS_PROOF",
  "MEDICAL_RECORD",
  "OTHER",
];

export function AdmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<AdmissionApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [sections, setSections] = useState<SectionRecord[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [uploadCategory, setUploadCategory] = useState(DOCUMENT_CATEGORIES[0]);

  function reload() {
    if (!id) return;
    setLoading(true);
    admissionApi
      .get(id)
      .then((app) => {
        setApplication(app);
        return academicApi.listSections(app.classAppliedForId);
      })
      .then(setSections)
      .finally(() => setLoading(false));
  }

  useEffect(reload, [id]);

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    try {
      await action();
      toast({ title: successMessage });
      reload();
    } catch (err) {
      toast({ title: "Action failed", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  async function handleEnroll() {
    if (!id) return;
    if (!selectedSection) {
      toast({ title: "Select a section first", variant: "destructive" });
      return;
    }
    try {
      const res = await admissionApi.enroll(id, selectedSection);
      toast({ title: "Student enrolled", description: `Registration #${(res.data as { student: { registrationNumber: string } }).student.registrationNumber}` });
      navigate(`/students/${(res.data as { student: { id: string } }).student.id}`);
    } catch (err) {
      toast({ title: "Enrollment failed", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  async function handleUpload(file: File) {
    if (!id) return;
    try {
      await admissionApi.uploadDocument(id, uploadCategory, file);
      toast({ title: "Document uploaded" });
      reload();
    } catch (err) {
      toast({ title: "Upload failed", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  if (loading || !application) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const photo = [...application.documents]
    .filter((d) => d.category === "PHOTO")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-14 w-14 rounded-md">
            <AvatarImage src={photo ? `/uploads/${photo.filePath}` : undefined} alt="Student photo" className="object-cover" />
            <AvatarFallback className="rounded-md bg-primary/10 text-base text-primary">
              {application.studentFirstName.slice(0, 1)}
              {application.studentLastName.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {application.studentFirstName} {application.studentLastName}
            </h1>
            <p className="text-sm text-muted-foreground">{application.applicationNumber}</p>
          </div>
        </div>
        <Badge variant={STATUS_VARIANT[application.status]} className="text-sm">
          {application.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Applicant details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Date of birth</p>
              <p className="font-medium">{new Date(application.dateOfBirth).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Gender</p>
              <p className="font-medium">{application.gender}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Class applied for</p>
              <p className="font-medium">{application.classAppliedFor?.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Academic session</p>
              <p className="font-medium">{application.academicSession?.name}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Address</p>
              <p className="font-medium">{application.address}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Guardians</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {application.guardians.map((g) => (
              <div key={g.id} className="rounded-md border border-border p-3 text-sm">
                <div className="font-medium">
                  {g.fullName} {g.isPrimary && <Badge variant="outline" className="ml-1 text-[10px]">Primary</Badge>}
                </div>
                <p className="text-muted-foreground">
                  {g.relation} &middot; {g.phone}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {application.documents.map((doc) => (
              <a
                key={doc.id}
                href={`/uploads/${doc.filePath}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
              >
                <FileUp className="h-3.5 w-3.5" />
                {doc.category}
              </a>
            ))}
            {application.documents.length === 0 && <p className="text-sm text-muted-foreground">No documents uploaded.</p>}
          </div>
          <Can anyOf={["admission:update"]}>
            <div className="flex items-center gap-2">
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
                <Button type="button" variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4" /> Upload
                  </span>
                </Button>
              </label>
            </div>
          </Can>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workflow actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {application.status === "DRAFT" && (
            <Can anyOf={["admission:update"]}>
              <Button onClick={() => runAction(() => admissionApi.submit(application.id), "Application submitted")}>
                Submit application
              </Button>
            </Can>
          )}

          {application.status === "SUBMITTED" && (
            <Can anyOf={["admission:review"]}>
              <div className="space-y-2">
                <Textarea placeholder="Review notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
                <Button onClick={() => runAction(() => admissionApi.review(application.id, notes), "Moved to review")}>
                  Move to review
                </Button>
              </div>
            </Can>
          )}

          {application.status === "REVIEW" && (
            <Can anyOf={["admission:approve"]}>
              <div className="space-y-2">
                <Textarea placeholder="Decision notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
                <div className="flex gap-2">
                  <Button
                    onClick={() => runAction(() => admissionApi.decide(application.id, "APPROVED", notes), "Application approved")}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => runAction(() => admissionApi.decide(application.id, "REJECTED", notes), "Application rejected")}
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            </Can>
          )}

          {application.status === "APPROVED" && (
            <Can anyOf={["admission:enroll"]}>
              <div className="flex flex-wrap items-end gap-2">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Assign section</p>
                  <Select value={selectedSection} onValueChange={setSelectedSection}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          Section {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleEnroll}>Enroll student</Button>
              </div>
            </Can>
          )}

          {(application.status === "REJECTED" || application.status === "ENROLLED") && (
            <p className="text-sm text-muted-foreground">
              This application is finalized ({application.status.toLowerCase()}). No further workflow actions are available.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
