import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Ban, Download, Plus, Printer, Receipt } from "lucide-react";
import { invoiceApi, type CollectPaymentPayload, type InvoiceRecord } from "./invoice.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Can } from "@/components/Can";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  DRAFT: "secondary",
  ISSUED: "default",
  PARTIALLY_PAID: "warning",
  PAID: "success",
  OVERDUE: "destructive",
  CANCELLED: "secondary",
};

const PAYMENT_METHODS = ["CASH", "CARD", "BANK_TRANSFER", "CHEQUE", "ONLINE"];

function money(value: number | string) {
  return Number(value).toFixed(2);
}

function RecordPaymentDialog({ invoice, onRecorded }: { invoice: InvoiceRecord; onRecorded: () => void }) {
  const [open, setOpen] = useState(false);
  const outstanding = Number(invoice.totalAmount) - Number(invoice.paidAmount);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<CollectPaymentPayload>({ defaultValues: { method: "CASH" } });

  async function onSubmit(values: CollectPaymentPayload) {
    try {
      await invoiceApi.collectPayment(invoice.id, { ...values, amount: Number(values.amount) });
      toast({ title: "Payment recorded" });
      reset();
      setOpen(false);
      onRecorded();
    } catch (err) {
      toast({ title: "Failed to record payment", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> Record payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <p className="text-sm text-muted-foreground">Outstanding balance: {money(outstanding)}</p>
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input type="number" step="0.01" max={outstanding} {...register("amount", { required: true, valueAsNumber: true })} />
          </div>
          <div className="space-y-1.5">
            <Label>Method</Label>
            <Select defaultValue="CASH" onValueChange={(v) => setValue("method", v as CollectPaymentPayload["method"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Transaction reference (optional)</Label>
            <Input placeholder="e.g. cheque or transaction number" {...register("transactionRef")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              Record payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);

  function reload() {
    if (!id) return;
    setLoading(true);
    invoiceApi.get(id).then(setInvoice).finally(() => setLoading(false));
  }
  useEffect(reload, [id]);

  async function handleDownload() {
    if (!invoice) return;
    setDownloading(true);
    try {
      const blob = await invoiceApi.downloadPdf(invoice.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoice.invoiceNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast({ title: "Failed to download invoice", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  }

  async function handlePrint() {
    if (!invoice) return;
    setPrinting(true);
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
    } catch (err) {
      toast({ title: "Failed to print invoice", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setPrinting(false);
    }
  }

  async function handleCancel() {
    if (!invoice) return;
    try {
      await invoiceApi.cancel(invoice.id);
      toast({ title: "Invoice cancelled" });
      reload();
    } catch (err) {
      toast({ title: "Failed to cancel invoice", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  if (loading || !invoice) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const outstanding = Number(invoice.totalAmount) - Number(invoice.paidAmount);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoice {invoice.invoiceNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {invoice.student.firstName} {invoice.student.lastName} ({invoice.student.registrationNumber}) &middot;{" "}
            {invoice.academicSession.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[invoice.status]} className="text-sm">
            {invoice.status}
          </Badge>
          <Button variant="outline" size="sm" disabled={downloading} onClick={handleDownload}>
            <Download className="h-4 w-4" /> Download
          </Button>
          <Button variant="outline" size="sm" disabled={printing} onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Line items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className={`text-right ${Number(item.amount) < 0 ? "text-success" : ""}`}>
                      {money(item.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due date</span>
              <span className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium">{money(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid</span>
              <span className="font-medium">{money(invoice.paidAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-muted-foreground">Outstanding</span>
              <span className="font-semibold">{money(outstanding)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {invoice.installments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Installments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Due date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.installments.map((installment) => (
                  <TableRow key={installment.id}>
                    <TableCell>{new Date(installment.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>{money(installment.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={installment.paidAt ? "success" : "secondary"}>
                        {installment.paidAt ? "Paid" : "Pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Payment history</CardTitle>
          {invoice.status !== "CANCELLED" && outstanding > 0 && (
            <Can anyOf={["payment:collect"]}>
              <RecordPaymentDialog invoice={invoice} onRecorded={reload} />
            </Can>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.receiptNumber ?? "-"}</TableCell>
                  <TableCell>{new Date(payment.paidAt).toLocaleDateString()}</TableCell>
                  <TableCell>{money(payment.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{payment.method}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{payment.transactionRef ?? "-"}</TableCell>
                  <TableCell>
                    {payment.filePath && (
                      <a
                        href={`/uploads/${payment.filePath}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Receipt className="h-3.5 w-3.5" /> Receipt
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {invoice.payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No payments recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {invoice.status !== "CANCELLED" && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Can anyOf={["invoice:manage"]}>
              <Button
                variant="destructive"
                disabled={Number(invoice.paidAmount) > 0}
                title={Number(invoice.paidAmount) > 0 ? "Cannot cancel an invoice that already has payments" : undefined}
                onClick={handleCancel}
              >
                <Ban className="h-4 w-4" /> Cancel invoice
              </Button>
            </Can>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
