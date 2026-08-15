import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { studentApi, type StudentRecord } from "@/modules/students/student.api";
import { idCardApi, downloadBlob, printBlob } from "@/modules/students/idCard.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function BulkIdCardPrintPage() {
  const [data, setData] = useState<StudentRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [working, setWorking] = useState(false);

  function reload() {
    setLoading(true);
    studentApi
      .search({ page, pageSize: 20, search: search || undefined, status: "ACTIVE" })
      .then((res) => {
        setData(res.data);
        setTotal(res.meta.total);
      })
      .finally(() => setLoading(false));
  }

  useEffect(reload, [page]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllOnPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = data.every((s) => next.has(s.id));
      data.forEach((s) => (allSelected ? next.delete(s.id) : next.add(s.id)));
      return next;
    });
  }

  async function handleBulk(action: "download" | "print") {
    if (selected.size === 0) return;
    setWorking(true);
    try {
      const blob = await idCardApi.bulkPrintPdf(Array.from(selected));
      if (action === "download") downloadBlob(blob, "id-cards-bulk.pdf");
      else printBlob(blob);
    } catch (err) {
      toast({ title: "Bulk print failed", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Print ID Cards</h1>
          <p className="text-sm text-muted-foreground">Select active students to download or print their ID cards.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{selected.size} selected</Badge>
          <Button variant="outline" size="sm" disabled={selected.size === 0 || working} onClick={() => handleBulk("download")}>
            Download PDF
          </Button>
          <Button size="sm" disabled={selected.size === 0 || working} onClick={() => handleBulk("print")}>
            Print
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search by name or registration number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && reload()}
            />
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={data.length > 0 && data.every((s) => selected.has(s.id))}
                        onChange={toggleAllOnPage}
                      />
                    </TableHead>
                    <TableHead>Registration #</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          className="accent-primary"
                          checked={selected.has(student.id)}
                          onChange={() => toggle(student.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{student.registrationNumber}</TableCell>
                      <TableCell>
                        {student.firstName} {student.lastName}
                      </TableCell>
                      <TableCell>
                        {student.section.class.name} - {student.section.name}
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No active students found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">{total} total active students</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
