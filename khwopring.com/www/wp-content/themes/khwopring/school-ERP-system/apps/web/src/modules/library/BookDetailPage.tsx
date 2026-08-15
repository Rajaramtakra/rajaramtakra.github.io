import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Upload } from "lucide-react";
import { libraryApi, type BookDetail, type BookReservation } from "./library.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Can } from "@/components/Can";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const COPY_STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  AVAILABLE: "success",
  ISSUED: "warning",
  LOST: "destructive",
  DAMAGED: "destructive",
};

const ISSUE_STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  ISSUED: "warning",
  RETURNED: "success",
  OVERDUE: "destructive",
  LOST: "destructive",
};

function borrowerName(issue: { student?: { firstName: string; lastName: string } | null; teacher?: { firstName: string; lastName: string } | null }) {
  const person = issue.student ?? issue.teacher;
  return person ? `${person.firstName} ${person.lastName}` : "-";
}

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [reservations, setReservations] = useState<BookReservation[]>([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    if (!id) return;
    setLoading(true);
    Promise.all([libraryApi.getBook(id), libraryApi.listReservationsForBook(id)])
      .then(([b, res]) => {
        setBook(b);
        setReservations(res);
      })
      .finally(() => setLoading(false));
  }

  useEffect(reload, [id]);

  async function handleCoverUpload(file: File) {
    if (!id) return;
    try {
      await libraryApi.uploadCover(id, file);
      toast({ title: "Cover image updated" });
      reload();
    } catch (err) {
      toast({ title: "Upload failed", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  async function handleIssueToReservation(reservationId: string) {
    try {
      await libraryApi.issueToReservation(reservationId);
      toast({ title: "Book issued to reservation" });
      reload();
    } catch (err) {
      toast({ title: "Failed to issue book", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  if (loading || !book) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const availableCopies = book.copies.filter((c) => c.status === "AVAILABLE").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{book.title}</h1>
          <p className="text-sm text-muted-foreground">
            {book.author} {book.category && <>&middot; {book.category}</>}
          </p>
        </div>
        <Badge variant={availableCopies > 0 ? "success" : "warning"} className="text-sm">
          {availableCopies} / {book.totalCopies} available
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">ISBN</p>
              <p className="font-medium">{book.isbn ?? "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Publisher</p>
              <p className="font-medium">{book.publisher ?? "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Shelf location</p>
              <p className="font-medium">{book.shelfLocation ?? "-"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cover image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {book.coverImagePath ? (
              <img
                src={`/uploads/${book.coverImagePath}`}
                alt={book.title}
                className="h-40 w-full rounded-md border border-border object-cover"
              />
            ) : (
              <p className="text-sm text-muted-foreground">No cover image uploaded.</p>
            )}
            <Can anyOf={["library:manage"]}>
              <label className="flex w-fit items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-xs hover:bg-accent">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])}
                />
                <Upload className="h-3.5 w-3.5" /> Upload cover
              </label>
            </Can>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Copies</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Copy code</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {book.copies.map((copy) => (
                <TableRow key={copy.id}>
                  <TableCell className="font-medium">{copy.copyCode}</TableCell>
                  <TableCell>
                    <Badge variant={COPY_STATUS_VARIANT[copy.status]}>{copy.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {book.copies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No copies on record.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Issue history</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Copy</TableHead>
                <TableHead>Borrower</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fine</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {book.issues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell>{issue.bookCopy.copyCode}</TableCell>
                  <TableCell>{borrowerName(issue)}</TableCell>
                  <TableCell>{new Date(issue.issuedAt).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(issue.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={ISSUE_STATUS_VARIANT[issue.status]}>{issue.status}</Badge>
                  </TableCell>
                  <TableCell>{Number(issue.fineAmount) > 0 ? issue.fineAmount : "-"}</TableCell>
                </TableRow>
              ))}
              {book.issues.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No issue history yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reservation queue</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Reserved</TableHead>
                <Can anyOf={["library:manage"]}>
                  <TableHead className="text-right">Action</TableHead>
                </Can>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((res) => (
                <TableRow key={res.id}>
                  <TableCell>
                    {res.student.firstName} {res.student.lastName}
                  </TableCell>
                  <TableCell>{new Date(res.reservedAt).toLocaleDateString()}</TableCell>
                  <Can anyOf={["library:manage"]}>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={availableCopies === 0}
                        onClick={() => handleIssueToReservation(res.id)}
                      >
                        Issue to this reservation
                      </Button>
                    </TableCell>
                  </Can>
                </TableRow>
              ))}
              {reservations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No pending reservations for this book.
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
