import { useEffect, useState } from "react";
import { Download, Search } from "lucide-react";
import { examApi, type CoScholasticGradeRecord, type ExamRecord } from "./exam.api";
import { academicApi, type SectionRecord } from "@/modules/academic/academic.api";
import { studentApi, type StudentRecord } from "@/modules/students/student.api";
import { downloadBlob } from "@/modules/students/idCard.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function AdmitCardsPanel({ exams, sections }: { exams: ExamRecord[]; sections: SectionRecord[] }) {
  const [examId, setExamId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!examId || !sectionId) return;
    setDownloading(true);
    try {
      const blob = await examApi.downloadAdmitCardsPdf(examId, sectionId);
      downloadBlob(blob, `admit-cards-${examId}-${sectionId}.pdf`);
    } catch (err) {
      toast({ title: "Failed to generate admit cards", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admit Cards</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label>Exam</Label>
          <Select value={examId} onValueChange={setExamId}>
            <SelectTrigger className="w-56">
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
        </div>
        <div className="space-y-1.5">
          <Label>Section</Label>
          <Select value={sectionId} onValueChange={setSectionId}>
            <SelectTrigger className="w-56">
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
        </div>
        <Button onClick={handleDownload} disabled={!examId || !sectionId || downloading}>
          <Download className="h-4 w-4" /> Download bulk PDF
        </Button>
      </CardContent>
    </Card>
  );
}

function CoScholasticPanel({ exams }: { exams: ExamRecord[] }) {
  const [examId, setExamId] = useState("");
  const [grades, setGrades] = useState<CoScholasticGradeRecord[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<StudentRecord[]>([]);
  const [selected, setSelected] = useState<StudentRecord | null>(null);
  const [activity, setActivity] = useState("");
  const [grade, setGrade] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reload() {
    if (!examId) return;
    examApi.listCoScholasticGrades({ examId }).then(setGrades);
  }
  useEffect(reload, [examId]);

  async function handleSearch() {
    if (!search.trim()) return;
    const res = await studentApi.search({ search, pageSize: 5 });
    setResults(res.data);
  }

  async function handleSubmit() {
    if (!examId || !selected || !activity || !grade) return;
    setSubmitting(true);
    try {
      await examApi.upsertCoScholasticGrade({ studentId: selected.id, examId, activity, grade, remarks: remarks || undefined });
      toast({ title: "Grade saved" });
      setActivity("");
      setGrade("");
      setRemarks("");
      reload();
    } catch (err) {
      toast({ title: "Failed to save grade", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Co-Scholastic (Non-Academic) Grading</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Exam</Label>
          <Select value={examId} onValueChange={setExamId}>
            <SelectTrigger className="w-56">
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
        </div>

        {examId && (
          <div className="space-y-3 rounded-md border border-border p-3">
            <div className="space-y-1.5">
              <Label>Student</Label>
              {selected ? (
                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <span>
                    {selected.firstName} {selected.lastName} ({selected.registrationNumber})
                  </span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(null)}>
                    Change
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-8"
                      placeholder="Search by name or registration no."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                    />
                  </div>
                  {results.length > 0 && (
                    <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-1">
                      {results.map((s) => (
                        <button
                          type="button"
                          key={s.id}
                          className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                          onClick={() => {
                            setSelected(s);
                            setResults([]);
                          }}
                        >
                          {s.firstName} {s.lastName} ({s.registrationNumber})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Activity</Label>
                <Input placeholder="Discipline, Sports, Art..." value={activity} onChange={(e) => setActivity(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Grade</Label>
                <Input placeholder="A / B / C" value={grade} onChange={(e) => setGrade(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Remarks (optional)</Label>
                <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              </div>
            </div>
            <Button size="sm" onClick={handleSubmit} disabled={submitting || !selected || !activity || !grade}>
              Save grade
            </Button>
          </div>
        )}

        {examId && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>
                    {g.student.firstName} {g.student.lastName}
                  </TableCell>
                  <TableCell>{g.activity}</TableCell>
                  <TableCell>{g.grade}</TableCell>
                  <TableCell>{g.remarks ?? "-"}</TableCell>
                </TableRow>
              ))}
              {grades.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No co-scholastic grades entered for this exam yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export function AdmitCardsCoScholasticTab() {
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [sections, setSections] = useState<SectionRecord[]>([]);

  useEffect(() => {
    examApi.listExams().then(setExams);
    academicApi.listSections().then(setSections);
  }, []);

  return (
    <div className="space-y-4">
      <AdmitCardsPanel exams={exams} sections={sections} />
      <CoScholasticPanel exams={exams} />
    </div>
  );
}
