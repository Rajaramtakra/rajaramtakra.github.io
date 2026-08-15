import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { posApi, type SaleRecord, type SaleStatus } from "./pos.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Can } from "@/components/Can";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_VARIANT: Record<SaleStatus, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  DRAFT: "secondary",
  COMPLETED: "success",
  CANCELLED: "destructive",
  REFUNDED: "warning",
};

export function SalesListPage() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [status, setStatus] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    posApi
      .listSales(status === "ALL" ? undefined : { status: status as SaleStatus })
      .then(setSales)
      .finally(() => setLoading(false));
  }
  useEffect(reload, [status]);

  async function handleCancel(id: string) {
    try {
      await posApi.cancelSale(id);
      toast({ title: "Sale cancelled and stock restored" });
      reload();
    } catch (err) {
      toast({ title: "Failed to cancel sale", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sales</h1>
        <p className="text-sm text-muted-foreground">All point-of-sale transactions.</p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="REFUNDED">Refunded</SelectItem>
            </SelectContent>
          </Select>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Sold By</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.saleNumber}</TableCell>
                    <TableCell>{s.counterparty?.name ?? "Walk-in"}</TableCell>
                    <TableCell>{s.soldBy.fullName}</TableCell>
                    <TableCell>{Number(s.totalAmount).toFixed(2)}</TableCell>
                    <TableCell>{Number(s.paidAmount).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[s.status]}>{s.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Can anyOf={["pos:manage"]}>
                        {s.status === "COMPLETED" && Number(s.paidAmount) === 0 && (
                          <Button variant="ghost" size="sm" onClick={() => handleCancel(s.id)}>
                            Cancel
                          </Button>
                        )}
                      </Can>
                    </TableCell>
                  </TableRow>
                ))}
                {sales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No sales found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Link to="/pos/checkout" className="text-sm text-primary hover:underline">
        Go to checkout &rarr;
      </Link>
    </div>
  );
}
