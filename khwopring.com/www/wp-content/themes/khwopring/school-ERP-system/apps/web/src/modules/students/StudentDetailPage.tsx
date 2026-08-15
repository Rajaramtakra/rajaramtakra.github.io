import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ImagePlus,
  KeyRound,
  ShieldOff,
  Undo2,
  FileText,
  GraduationCap,
  Download,
  Printer,
  RefreshCw,
} from "lucide-react";
import { studentApi, type StudentRecord } from "./student.api";
import { idCardApi, downloadBlob, printBlob, type IdCardData } from "./idCard.api";
import { StudentIdCard, StudentIdCardSkeleton } from "./components/StudentIdCard";
import { parentApi } from "@/modules/parent-portal/parent.api";
import { receptionApi, type Sibling } from "@/modules/reception/reception.api";
import { invoiceApi } from "@/modules/invoices/invoice.api";
import { libraryApi } from "@/modules/library/library.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Can } from "@/components/Can";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  RUSTICATED: "destructive",
  TRANSFERRED: "secondary",
  ALUMNI: "default",
  EXPELLED: "destructive",
};

function ActionDialog({
  trigger,
  title,
  fieldLabel,
  fieldType = "text",
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  fieldLabel: string;
  fieldType?: string;
  onConfirm: (value: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await onConfirm(value);
      setOpen(false);
      setValue("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>{fieldLabel}</Label>
          <Input type={fieldType} value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <DialogFooter>
          <Button onClick={handleConfirm} disabled={submitting || !value}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState<IdCardData | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [siblings, setSiblings] = useState<Sibling[]>([]);
  const [ledger, setLedger] = useState<{ totalBilled: number; totalPaid: number; totalOutstanding: number } | null>(null);
  const [issuingNoDues, setIssuingNoDues] = useState(false);

  function reload() {
    if (!id) return;
    setLoading(true);
    studentApi.get(id).then(setStudent).finally(() => setLoading(false));
  }
  useEffect(reload, [id]);

  useEffect(() => {
    if (!id) return;
    receptionApi
      .getSiblings(id)
      .then(setSiblings)
      .catch(() => setSiblings([]));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    invoiceApi
      .getStudentLedger(id)
      .then(setLedger)
      .catch(() => setLedger(null));
  }, [id]);

  async function handleDownloadLibraryCard() {
    if (!id) return;
    try {
      const blob = await libraryApi.downloadLibraryCardPdf(id);
      downloadBlob(blob, `library-card-${id}.pdf`);
    } catch (err) {
      toast({ title: "Failed to generate library card", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  async function handleDownloadNoDuesCertificate() {
    if (!id) return;
    setIssuingNoDues(true);
    try {
      const blob = await invoiceApi.downloadNoDuesCertificate(id);
      downloadBlob(blob, `no-dues-certificate-${id}.pdf`);
    } catch (err) {
      toast({ title: "Failed to issue no-dues certificate", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setIssuingNoDues(false);
    }
  }

  function reloadCard() {
    if (!id || student?.status !== "ACTIVE") {
      setCard(null);
      return;
    }
    setCardLoading(true);
    idCardApi
      .getCard(id)
      .then(setCard)
      .catch(() => setCard(null))
      .finally(() => setCardLoading(false));
  }
  useEffect(reloadCard, [id, student?.status]);

  async function handleDownload(side: "front" | "both") {
    if (!id) return;
    try {
      const blob = await idCardApi.downloadCardPdf(id, side);
      downloadBlob(blob, `id-card-${id}-${side}.pdf`);
    } catch (err) {
      toast({ title: "Download failed", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  async function handlePrint() {
    if (!id) return;
    try {
      const blob = await idCardApi.downloadCardPdf(id, "both");
      printBlob(blob);
    } catch (err) {
      toast({ title: "Print failed", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  async function handleRegenerate() {
    if (!id) return;
    setRegenerating(true);
    try {
      await idCardApi.regenerateCard(id);
      toast({ title: "ID card regenerated", description: "The QR code has been rotated; old printed cards will no longer verify." });
      reloadCard();
    } catch (err) {
      toast({ title: "Failed to regenerate ID card", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setRegenerating(false);
    }
  }

  async function handleEnableStudentPortalAccess() {
    if (!id) return;
    try {
      const { temporaryPassword } = await studentApi.enablePortalAccess(id);
      toast({
        title: "Student portal access enabled",
        description: `Temporary password: ${temporaryPassword} (share this securely; it will not be shown again)`,
      });
      reload();
    } catch (err) {
      toast({ title: "Failed to enable portal access", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  async function withToast(action: () => Promise<unknown>, successMessage: string) {
    try {
      await action();
      toast({ title: successMessage });
      reload();
    } catch (err) {
      toast({ title: "Action failed", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  async function handlePhotoChange(file: File) {
    if (!id) return;
    try {
      await studentApi.uploadPhoto(id, file);
      toast({ title: "Photo updated" });
      reload();
    } catch (err) {
      toast({ title: "Failed to update photo", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  async function handleEnablePortalAccess(guardianId: string) {
    try {
      const { temporaryPassword } = await parentApi.enableGuardianPortalAccess(guardianId);
      toast({
        title: "Parent portal access enabled",
        description: `Temporary password: ${temporaryPassword} (share this securely; it will not be shown again)`,
      });
      reload();
    } catch (err) {
      toast({ title: "Failed to enable portal access", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  if (loading || !student) {
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
        <div className="flex items-center gap-3">
          <Avatar className="h-14 w-14 rounded-md">
            <AvatarImage src={student.photoUrl ? `/uploads/${student.photoUrl}` : undefined} alt="Student photo" className="object-cover" />
            <AvatarFallback className="rounded-md bg-primary/10 text-base text-primary">
              {student.firstName.slice(0, 1)}
              {student.lastName.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {student.registrationNumber} &middot; {student.section.class.name} - {student.section.name}
            </p>
          </div>
          <Can anyOf={["student:update"]}>
            <label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handlePhotoChange(e.target.files[0])}
              />
              <Button type="button" variant="outline" size="sm" asChild>
                <span>
                  <ImagePlus className="h-4 w-4" /> Change photo
                </span>
              </Button>
            </label>
          </Can>
        </div>
        <div className="flex items-center gap-2">
          {student.userId ? (
            <Badge variant="success" className="text-[10px]">
              Portal enabled
            </Badge>
          ) : (
            <Can anyOf={["student:update"]}>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                disabled={!student.email}
                title={student.email ? undefined : "Student needs an email on file first"}
                onClick={handleEnableStudentPortalAccess}
              >
                <KeyRound className="h-3.5 w-3.5" /> Enable portal access
              </Button>
            </Can>
          )}
          <Badge variant={STATUS_VARIANT[student.status]} className="text-sm">
            {student.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Date of birth</p>
              <p className="font-medium">{new Date(student.dateOfBirth).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Gender</p>
              <p className="font-medium">{student.gender}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Blood group</p>
              <p className="font-medium">{student.bloodGroup ?? "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Admission date</p>
              <p className="font-medium">{new Date(student.admissionDate).toLocaleDateString()}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Address</p>
              <p className="font-medium">{student.address}</p>
            </div>
            {student.status === "SUSPENDED" && student.suspensionReason && (
              <div className="col-span-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2">
                <p className="text-warning-foreground">Suspension reason: {student.suspensionReason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Guardians</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {student.guardians.map((g) => (
              <div key={g.id} className="rounded-md border border-border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {g.guardian.fullName}
                    {g.isPrimary && (
                      <Badge variant="outline" className="ml-1 text-[10px]">
                        Primary
                      </Badge>
                    )}
                  </div>
                  {g.guardian.userId ? (
                    <Badge variant="success" className="text-[10px]">
                      Portal enabled
                    </Badge>
                  ) : (
                    <Can anyOf={["guardian:manage"]}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        disabled={!g.guardian.email}
                        title={g.guardian.email ? undefined : "Guardian needs an email on file first"}
                        onClick={() => handleEnablePortalAccess(g.guardian.id)}
                      >
                        <KeyRound className="h-3.5 w-3.5" /> Enable portal access
                      </Button>
                    </Can>
                  )}
                </div>
                <p className="text-muted-foreground">
                  {g.relation} &middot; {g.guardian.phone}
                </p>
              </div>
            ))}
            {student.guardians.length === 0 && <p className="text-sm text-muted-foreground">No guardians linked.</p>}
          </CardContent>
        </Card>
      </div>

      {siblings.length > 0 && (
        <Can anyOf={["reception:read", "reception:manage", "student:read"]}>
          <Card>
            <CardHeader>
              <CardTitle>Siblings</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {siblings.map((s) => (
                <Link
                  key={s.id}
                  to={`/students/${s.id}`}
                  className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
                >
                  <span className="font-medium">
                    {s.firstName} {s.lastName}
                  </span>
                  <span className="text-muted-foreground"> &middot; {s.section?.class?.name} - {s.section?.name}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </Can>
      )}

      {ledger && (
        <Can anyOf={["invoice:manage", "fee:read_own"]}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Fee Ledger</CardTitle>
              <div className="flex gap-2">
                <Link to="/invoices" className="text-sm text-primary hover:underline">
                  View invoices
                </Link>
                <Can anyOf={["invoice:manage"]}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={issuingNoDues || ledger.totalOutstanding > 0}
                    title={ledger.totalOutstanding > 0 ? "Outstanding balance must be cleared first" : undefined}
                    onClick={handleDownloadNoDuesCertificate}
                  >
                    <Download className="h-4 w-4" /> No-dues certificate
                  </Button>
                </Can>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total billed</p>
                <p className="font-medium">{ledger.totalBilled.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total paid</p>
                <p className="font-medium">{ledger.totalPaid.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Outstanding</p>
                <p className={`font-medium ${ledger.totalOutstanding > 0 ? "text-destructive" : ""}`}>
                  {ledger.totalOutstanding.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        </Can>
      )}

      {student.status === "ACTIVE" && (
        <Card>
          <CardHeader>
            <CardTitle>ID Card</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-start gap-6">
            {cardLoading || !card ? (
              <StudentIdCardSkeleton />
            ) : (
              <StudentIdCard card={card} />
            )}
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={() => handleDownload("front")}>
                <Download className="h-4 w-4" /> Download front
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDownload("both")}>
                <Download className="h-4 w-4" /> Download front &amp; back
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4" /> Print
              </Button>
              <Can anyOf={["student:id_card_manage"]}>
                <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={regenerating}>
                  <RefreshCw className="h-4 w-4" /> Regenerate card
                </Button>
              </Can>
              <Can anyOf={["library:manage", "library:read", "library:read_own"]}>
                <Button variant="outline" size="sm" onClick={handleDownloadLibraryCard}>
                  <Download className="h-4 w-4" /> Library card
                </Button>
              </Can>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {student.status === "ACTIVE" && (
            <>
              <Can anyOf={["student:suspend"]}>
                <ActionDialog
                  trigger={
                    <Button variant="outline">
                      <ShieldOff className="h-4 w-4" /> Suspend
                    </Button>
                  }
                  title="Suspend student"
                  fieldLabel="Reason"
                  onConfirm={(reason) => withToast(() => studentApi.suspend(student.id, reason), "Student suspended")}
                />
              </Can>
              <Can anyOf={["student:suspend"]}>
                <ActionDialog
                  trigger={
                    <Button variant="destructive">
                      <ShieldOff className="h-4 w-4" /> Rusticate
                    </Button>
                  }
                  title="Rusticate student"
                  fieldLabel="Reason"
                  onConfirm={(reason) => withToast(() => studentApi.rusticate(student.id, reason), "Student rusticated")}
                />
              </Can>
              <Can anyOf={["student:transfer"]}>
                <ActionDialog
                  trigger={
                    <Button variant="outline">
                      <FileText className="h-4 w-4" /> Issue transfer certificate
                    </Button>
                  }
                  title="Issue transfer certificate"
                  fieldLabel="Reason"
                  onConfirm={(reason) =>
                    withToast(() => studentApi.issueTransferCertificate(student.id, reason), "Transfer certificate issued")
                  }
                />
              </Can>
              <Can anyOf={["student:alumni_convert"]}>
                <ActionDialog
                  trigger={
                    <Button variant="outline">
                      <GraduationCap className="h-4 w-4" /> Convert to alumni
                    </Button>
                  }
                  title="Convert to alumni"
                  fieldLabel="Graduation year"
                  fieldType="number"
                  onConfirm={(year) =>
                    withToast(() => studentApi.convertToAlumni(student.id, Number(year)), "Student converted to alumni")
                  }
                />
              </Can>
            </>
          )}
          {(student.status === "SUSPENDED" || student.status === "RUSTICATED") && (
            <Can anyOf={["student:suspend"]}>
              <Button variant="outline" onClick={() => withToast(() => studentApi.reinstate(student.id), "Student reinstated")}>
                <Undo2 className="h-4 w-4" /> Reinstate
              </Button>
            </Can>
          )}
          {["TRANSFERRED", "ALUMNI", "EXPELLED"].includes(student.status) && (
            <p className="text-sm text-muted-foreground">No further status actions available for this student.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
