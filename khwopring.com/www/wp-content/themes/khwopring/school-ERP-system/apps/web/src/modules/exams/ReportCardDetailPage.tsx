import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { examApi, type ReportCardRecord, type ReportCardSubjectMark } from "./exam.api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ReportCardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [reportCard, setReportCard] = useState<ReportCardRecord | null>(null);
  const [subjectMarks, setSubjectMarks] = useState<ReportCardSubjectMark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    examApi
      .getReportCard(id)
      .then((res) => {
        setReportCard(res.reportCard);
        setSubjectMarks(res.subjectMarks);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !reportCard) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {reportCard.student.firstName} {reportCard.student.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {reportCard.student.registrationNumber} &middot; {reportCard.exam.name}
          </p>
        </div>
        {reportCard.publishedAt ? (
          <Badge variant="success" className="text-sm">
            Published
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-sm">
            Draft
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total marks</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{reportCard.totalMarks ?? "-"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Percentage</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {reportCard.percentage !== null ? `${Number(reportCard.percentage).toFixed(2)}%` : "-"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">GPA</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{reportCard.gpa ?? "-"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rank</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{reportCard.rank ?? "-"}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subject-wise marks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Marks obtained</TableHead>
                <TableHead>Max marks</TableHead>
                <TableHead>Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjectMarks.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.examSchedule.subject.name}</TableCell>
                  <TableCell>{m.marksObtained}</TableCell>
                  <TableCell>{m.examSchedule.maxMarks}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{m.grade ?? "-"}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {subjectMarks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No subject marks recorded.
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
