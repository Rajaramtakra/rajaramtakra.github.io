import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Printer, Search, X } from "lucide-react";
import { invoiceApi, type InvoiceRecord } from "./invoice.api";
import { GenerateInvoiceDialog } from "./GenerateInvoiceDialog";
import { studentApi, type StudentRecord } from "@/modules/students/student.api";
import { Can } from "@/components/Can";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  DRAFT: "secondary",
  ISSUED: "default",
  PARTIALLY_PAID: "warning",
  PAID: "success",
  OVERDUE: "destructive",
  CANCELLED: "secondary",
};

function money(value: number | string) {
  return Number(value).toFixed(2);
}

export function InvoicesListPage() {
  const [data, setData] = useState<InvoiceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const [studentId, setStudentId] = useState("");
  const [studentLabel, setStudentLabel] = useState("");
  const [studentTerm, setStudentTerm] = useState("");
  const [studentResults, setStudentResults] = useState<StudentRecord[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);

  async function handleDownload(invoice: InvoiceRecord) {
    setDownloadingId(invoice.id);
    try {
      const blob = await invoiceApi.downloadPdf(invoice.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoice.invoiceNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingId(null);
    }
  }

  async function handlePrint(invoice: InvoiceRecord) {
    setPrintingId(invoice.id);
    try {
      const blob = await invoiceApi.downloadPdf(invoice.id);
      const url = URL.createObjectURL(blob);
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.src = url;
      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      };
      document.body.appendChild(iframe);
      window.addEventListener(
        "focus",
        () => {
          setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
          }, 1000);
        },
        { once: true }
      );
    } finally {
      setPrintingId(null);
    }
  }

  function reload() {
    setLoading(true);
    invoiceApi
      .search({ page, pageSize: 10, status, studentId: studentId || undefined })
      .then((res) => {
        setData(res.data);
        setTotal(res.meta.total);
      })
      .finally(() => setLoading(false));
  }

  useEffect(reload, [page, status, studentId]);

  useEffect(() => {
    if (!studentTerm.trim()) {
      setStudentResults([]);
      return;
    }
    const handle = setTimeout(() => {
      studentApi.search({ search: studentTerm, pageSize: 5 }).then((res) => setStudentResults(res.data));
    }, 300);
    return () => clearTimeout(handle);
  }, [studentTerm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">Generate and track student fee invoices and payments.</p>
        </div>
        <Can anyOf={["invoice:manage"]}>
          <GenerateInvoiceDialog onCreated={reload} />
        </Can>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1 space-y-1">
              {studentId ? (
                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <span className="font-medium">{studentLabel}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      setStudentId("");
                      setStudentLabel("");
                      setPage(1);
                    }}
                  >
                    <X className="h-3.5 w-3.5" /> Clear
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Filter by student name or registration number..."
                    value={studentTerm}
                    onChange={(e) => setStudentTerm(e.target.value)}
                  />
                  {studentResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
                      {studentResults.map((s) => (
                        <button
                          type="button"
                          key={s.id}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                          onClick={() => {
                            setStudentId(s.id);
                            setStudentLabel(`${s.firstName} ${s.lastName} (${s.registrationNumber})`);
                            setStudentTerm("");
                            setStudentResults([]);
                            setPage(1);
                          }}
                        >
                          <span>
                            {s.firstName} {s.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground">{s.registrationNumber}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <Select
              value={status ?? "ALL"}
              onValueChange={(v) => {
                setStatus(v === "ALL" ? undefined : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Due date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Link to={`/invoices/${invoice.id}`} className="font-medium text-primary hover:underline">
                          {invoice.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {invoice.student.firstName} {invoice.student.lastName}
                        <span className="ml-1 text-xs text-muted-foreground">({invoice.student.registrationNumber})</span>
                      </TableCell>
                      <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{money(invoice.totalAmount)}</TableCell>
                      <TableCell>{money(invoice.paidAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[invoice.status]}>{invoice.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={downloadingId === invoice.id}
                          onClick={() => handleDownload(invoice)}
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={printingId === invoice.id}
                          onClick={() => handlePrint(invoice)}
                        >
                          <Printer className="h-3.5 w-3.5" /> Print
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No invoices found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">{total} total invoices</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={page * 10 >= total} onClick={() => setPage((p) => p + 1)}>
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
