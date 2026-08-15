import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Send } from "lucide-react";
import { examApi, type ExamRecord, type ReportCardRecord } from "./exam.api";
import { academicApi, type SectionRecord } from "@/modules/academic/academic.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Can } from "@/components/Can";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ReportCardsPage() {
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [sections, setSections] = useState<SectionRecord[]>([]);
  const [examId, setExamId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [reportCards, setReportCards] = useState<ReportCardRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    examApi.listExams().then((list) => {
      setExams(list);
      if (list.length > 0) setExamId(list[0].id);
    });
    academicApi.listSections().then((list) => {
      setSections(list);
      if (list.length > 0) setSectionId(list[0].id);
    });
  }, []);

  function reload() {
    setLoading(true);
    examApi
      .listReportCards({ examId: examId || undefined, sectionId: sectionId || undefined })
      .then(setReportCards)
      .finally(() => setLoading(false));
  }
  useEffect(reload, [examId, sectionId]);

  async function handlePublish() {
    if (!examId || !sectionId) return;
    setPublishing(true);
    try {
      await examApi.publishReportCards({ examId, sectionId });
      toast({ title: "Report cards published" });
      reload();
    } catch (err) {
      toast({ title: "Failed to publish report cards", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Report Cards</h1>
        <p className="text-sm text-muted-foreground">Generate, review, and publish student report cards.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Select value={examId} onValueChange={setExamId}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="Select exam" />
          </SelectTrigger>
          <SelectContent>
            {exams.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sectionId} onValueChange={setSectionId}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="Select section" />
          </SelectTrigger>
          <SelectContent>
            {sections.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.class?.name} - {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Can anyOf={["report_card:publish"]}>
          <Button onClick={handlePublish} disabled={publishing || !examId || !sectionId}>
            <Send className="h-4 w-4" /> Publish for this exam &amp; section
          </Button>
        </Can>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registration #</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>GPA</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportCards.map((rc) => (
                  <TableRow key={rc.id}>
                    <TableCell>{rc.student.registrationNumber}</TableCell>
                    <TableCell>
                      <Link to={`/report-cards/${rc.id}`} className="font-medium text-primary hover:underline">
                        {rc.student.firstName} {rc.student.lastName}
                      </Link>
                    </TableCell>
                    <TableCell>{rc.totalMarks ?? "-"}</TableCell>
                    <TableCell>{rc.percentage !== null ? `${Number(rc.percentage).toFixed(2)}%` : "-"}</TableCell>
                    <TableCell>{rc.gpa ?? "-"}</TableCell>
                    <TableCell>{rc.rank ?? "-"}</TableCell>
                    <TableCell>
                      {rc.publishedAt ? (
                        <Badge variant="success">Published</Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {reportCards.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No report cards found for this exam and section yet.
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
