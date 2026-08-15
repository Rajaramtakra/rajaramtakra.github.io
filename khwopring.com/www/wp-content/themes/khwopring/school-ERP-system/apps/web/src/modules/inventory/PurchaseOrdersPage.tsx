import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { inventoryApi, type PurchaseOrder } from "./inventory.api";
import { NewPurchaseOrderDialog } from "./NewPurchaseOrderDialog";
import { Can } from "@/components/Can";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  DRAFT: "secondary",
  ORDERED: "warning",
  RECEIVED: "success",
  CANCELLED: "destructive",
};

export function PurchaseOrdersPage() {
  const [data, setData] = useState<PurchaseOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    inventoryApi
      .listPurchaseOrders({ page, pageSize: 10, status })
      .then((res) => {
        setData(res.data);
        setTotal(res.meta.total);
      })
      .finally(() => setLoading(false));
  }

  useEffect(reload, [page, status]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">Draft, approve, and receive vendor purchase orders.</p>
        </div>
        <Can anyOf={["inventory:manage"]}>
          <NewPurchaseOrderDialog onCreated={reload} />
        </Can>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
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
              {["DRAFT", "ORDERED", "RECEIVED", "CANCELLED"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
                    <TableHead>Vendor</TableHead>
                    <TableHead>Order date</TableHead>
                    <TableHead>Expected date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell>
                        <Link to={`/inventory/purchase-orders/${po.id}`} className="font-medium text-primary hover:underline">
                          {po.vendor.name}
                        </Link>
                      </TableCell>
                      <TableCell>{new Date(po.orderDate).toLocaleDateString()}</TableCell>
                      <TableCell>{po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>{Number(po.totalAmount).toLocaleString(undefined, { style: "currency", currency: "USD" })}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[po.status]}>{po.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No purchase orders found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">{total} total purchase orders</p>
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
