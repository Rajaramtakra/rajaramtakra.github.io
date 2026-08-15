import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BadgeCheck, Loader2, ShieldAlert } from "lucide-react";
import { idCardApi, type VerificationResult } from "@/modules/students/idCard.api";
import { getErrorMessage } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  TRANSFERRED: "secondary",
  ALUMNI: "default",
  EXPELLED: "destructive",
};

export function VerifyIdCardPage() {
  const { code } = useParams<{ code: string }>();
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    idCardApi
      .verify(code)
      .then(setResult)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-background p-4 text-center">
      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      ) : result ? (
        <Card className="w-full max-w-sm animate-in fade-in-0 zoom-in-95">
          <CardHeader className="items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
              <BadgeCheck className="h-8 w-8" />
            </div>
            <CardTitle className="mt-2 text-lg text-foreground">Valid Student ID Card</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-left text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{result.fullName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Student ID</span>
              <span className="font-medium">{result.registrationNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Class</span>
              <span className="font-medium">
                {result.className} - {result.sectionName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">School</span>
              <span className="font-medium">{result.schoolName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={STATUS_VARIANT[result.status] ?? "default"}>{result.status}</Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col items-center gap-3 animate-in fade-in-0 zoom-in-95">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-lg font-semibold">Card could not be verified</h1>
          <p className="max-w-xs text-sm text-muted-foreground">
            {error ?? "This QR code doesn't match a valid, active student ID card."}
          </p>
        </div>
      )}
    </div>
  );
}
