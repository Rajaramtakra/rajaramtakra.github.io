import { useEffect, useState } from "react";
import { libraryApi, type Book, type BookIssue, type BookReservation } from "./library.api";
import { studentApi, type StudentRecord } from "@/modules/students/student.api";
import { teacherApi, type TeacherRecord } from "@/modules/teachers/teacher.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Can } from "@/components/Can";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ISSUE_STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  ISSUED: "warning",
  RETURNED: "success",
  OVERDUE: "destructive",
  LOST: "destructive",
};

function borrowerName(issue: {
  student?: { firstName: string; lastName: string } | null;
  teacher?: { firstName: string; lastName: string } | null;
}) {
  const person = issue.student ?? issue.teacher;
  return person ? `${person.firstName} ${person.lastName}` : "-";
}

function isOverdue(issue: BookIssue) {
  return issue.status === "ISSUED" && new Date(issue.dueDate).getTime() < Date.now();
}

function IssueBookTab({ onIssued }: { onIssued: () => void }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [bookId, setBookId] = useState("");
  const [borrowerType, setBorrowerType] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [borrowerId, setBorrowerId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    libraryApi.listBooks({ pageSize: 100 }).then((res) => setBooks(res.data));
  }, []);

  async function runSearch() {
    if (!search.trim()) return;
    setSearching(true);
    try {
      if (borrowerType === "STUDENT") {
        const res = await studentApi.search({ search, pageSize: 10 });
        setStudents(res.data);
      } else {
        const res = await teacherApi.search({ search, pageSize: 10 });
        setTeachers(res.data);
      }
      setBorrowerId("");
      setSearched(true);
    } catch (err) {
      toast({ title: "Search failed", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setSearching(false);
    }
  }

  async function handleIssue() {
    if (!bookId || !borrowerId) {
      toast({ title: "Select a book and a borrower first", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await libraryApi.issueBook({
        bookId,
        studentId: borrowerType === "STUDENT" ? borrowerId : undefined,
        teacherId: borrowerType === "TEACHER" ? borrowerId : undefined,
        dueDate: dueDate || undefined,
      });
      toast({ title: "Book issued" });
      setBorrowerId("");
      setDueDate("");
      onIssued();
    } catch (err) {
      toast({ title: "Failed to issue book", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  const candidates = borrowerType === "STUDENT" ? students : teachers;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issue a book</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Book</Label>
          <Select value={bookId} onValueChange={setBookId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a book" />
            </SelectTrigger>
            <SelectContent>
              {books.map((book) => {
                const available = book.copies.filter((c) => c.status === "AVAILABLE").length;
                return (
                  <SelectItem key={book.id} value={book.id}>
                    {book.title} ({available} available)
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr_auto]">
          <div className="space-y-1.5">
            <Label>Borrower type</Label>
            <Select
              value={borrowerType}
              onValueChange={(v) => {
                setBorrowerType(v as "STUDENT" | "TEACHER");
                setBorrowerId("");
                setStudents([]);
                setTeachers([]);
                setSearch("");
                setSearched(false);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT">Student</SelectItem>
                <SelectItem value="TEACHER">Teacher</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Search {borrowerType === "STUDENT" ? "students" : "teachers"}</Label>
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
            />
          </div>
          <div className="flex items-end">
            <Button type="button" variant="outline" onClick={runSearch} disabled={searching || !search.trim()}>
              {searching ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>

        {searched && candidates.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No {borrowerType === "STUDENT" ? "students" : "teachers"} found matching "{search}".
          </p>
        )}

        {candidates.length > 0 && (
          <div className="space-y-1.5">
            <Label>Select borrower</Label>
            <Select value={borrowerId} onValueChange={setBorrowerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a match" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}{" "}
                    {"registrationNumber" in c ? `(${c.registrationNumber})` : `(${c.employeeCode})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Due date (optional, defaults to 14 days from today)</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>

        <Button onClick={handleIssue} disabled={submitting}>
          Issue book
        </Button>
      </CardContent>
    </Card>
  );
}

function ActiveIssuesTab({ refreshKey }: { refreshKey: number }) {
  const [issues, setIssues] = useState<BookIssue[]>([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    libraryApi
      .listActiveIssues()
      .then(setIssues)
      .finally(() => setLoading(false));
  }

  useEffect(reload, [refreshKey]);

  async function handleReturn(issue: BookIssue) {
    try {
      const returned = await libraryApi.returnBook(issue.id);
      const fine = Number(returned.fineAmount);
      toast({ title: "Book returned", description: fine > 0 ? `Overdue fine: ${fine}` : undefined });
      reload();
    } catch (err) {
      toast({ title: "Failed to return book", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  async function handleMarkLost(issue: BookIssue) {
    try {
      await libraryApi.markIssueLost(issue.id);
      toast({ title: "Book marked as lost" });
      reload();
    } catch (err) {
      toast({ title: "Failed to mark as lost", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active issues</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Book</TableHead>
              <TableHead>Copy</TableHead>
              <TableHead>Borrower</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading &&
              issues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell className="font-medium">{issue.bookCopy.book.title}</TableCell>
                  <TableCell>{issue.bookCopy.copyCode}</TableCell>
                  <TableCell>{borrowerName(issue)}</TableCell>
                  <TableCell>{new Date(issue.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={isOverdue(issue) ? "destructive" : ISSUE_STATUS_VARIANT[issue.status]}>
                      {isOverdue(issue) ? "OVERDUE" : issue.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleReturn(issue)}>
                      Return
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleMarkLost(issue)}>
                      Mark lost
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            {!loading && issues.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No active issues.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ReservationsTab({ refreshKey }: { refreshKey: number }) {
  const [reservations, setReservations] = useState<BookReservation[]>([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    libraryApi
      .listReservations()
      .then(setReservations)
      .finally(() => setLoading(false));
  }

  useEffect(reload, [refreshKey]);

  async function handleIssue(reservation: BookReservation) {
    try {
      await libraryApi.issueToReservation(reservation.id);
      toast({ title: "Book issued to reservation" });
      reload();
    } catch (err) {
      toast({ title: "Failed to issue book", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reservations</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Book</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Reserved</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading &&
              reservations.map((res) => (
                <TableRow key={res.id}>
                  <TableCell className="font-medium">{res.book.title}</TableCell>
                  <TableCell>
                    {res.student.firstName} {res.student.lastName}
                  </TableCell>
                  <TableCell>{new Date(res.reservedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleIssue(res)}>
                      Issue to this reservation
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            {!loading && reservations.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No pending reservations.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function CirculationPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Circulation</h1>
        <p className="text-sm text-muted-foreground">Issue books, track active loans, and manage the reservation queue.</p>
      </div>
      <Tabs defaultValue="issue">
        <TabsList>
          <TabsTrigger value="issue">Issue a book</TabsTrigger>
          <TabsTrigger value="active">Active issues</TabsTrigger>
          <TabsTrigger value="reservations">Reservations</TabsTrigger>
        </TabsList>
        <TabsContent value="issue">
          <Can anyOf={["library:manage"]} fallback={<p className="text-sm text-muted-foreground">You don&apos;t have permission to issue books.</p>}>
            <IssueBookTab onIssued={() => setRefreshKey((k) => k + 1)} />
          </Can>
        </TabsContent>
        <TabsContent value="active">
          <ActiveIssuesTab refreshKey={refreshKey} />
        </TabsContent>
        <TabsContent value="reservations">
          <ReservationsTab refreshKey={refreshKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
