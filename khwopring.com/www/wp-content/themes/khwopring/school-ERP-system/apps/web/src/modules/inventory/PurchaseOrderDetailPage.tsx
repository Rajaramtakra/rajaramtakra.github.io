import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, PackageCheck, XCircle } from "lucide-react";
import { inventoryApi, type PurchaseOrder } from "./inventory.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Can } from "@/components/Can";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  DRAFT: "secondary",
  ORDERED: "warning",
  RECEIVED: "success",
  CANCELLED: "destructive",
};

export function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  function reload() {
    if (!id) return;
    setLoading(true);
    inventoryApi.getPurchaseOrder(id).then(setPo).finally(() => setLoading(false));
  }
  useEffect(reload, [id]);

  async function withToast(action: () => Promise<unknown>, successMessage: string) {
    setSubmitting(true);
    try {
      await action();
      toast({ title: successMessage });
      reload();
    } catch (err) {
      toast({ title: "Action failed", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !po) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Purchase order — {po.vendor.name}</h1>
          <p className="text-sm text-muted-foreground">
            Ordered {new Date(po.orderDate).toLocaleDateString()}
            {po.expectedDate ? ` · Expected ${new Date(po.expectedDate).toLocaleDateString()}` : ""}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[po.status]} className="text-sm">
          {po.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Linked stock item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit cost</TableHead>
                <TableHead>Line total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.inventoryItem?.name ?? "-"}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{Number(item.unitCost).toLocaleString(undefined, { style: "currency", currency: "USD" })}</TableCell>
                  <TableCell>
                    {(item.quantity * Number(item.unitCost)).toLocaleString(undefined, { style: "currency", currency: "USD" })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end pt-3">
            <p className="text-sm font-semibold">
              Total: {Number(po.totalAmount).toLocaleString(undefined, { style: "currency", currency: "USD" })}
            </p>
          </div>
        </CardContent>
      </Card>

      <Can anyOf={["inventory:manage"]}>
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {po.status === "DRAFT" && (
              <>
                <Button
                  disabled={submitting}
                  onClick={() => withToast(() => inventoryApi.approvePurchaseOrder(po.id), "Purchase order approved")}
                >
                  <CheckCircle2 className="h-4 w-4" /> Approve
                </Button>
                <Button
                  variant="outline"
                  disabled={submitting}
                  onClick={() => withToast(() => inventoryApi.cancelPurchaseOrder(po.id), "Purchase order cancelled")}
                >
                  <XCircle className="h-4 w-4" /> Cancel
                </Button>
              </>
            )}
            {po.status === "ORDERED" && (
              <>
                <Button
                  disabled={submitting}
                  onClick={() => withToast(() => inventoryApi.receivePurchaseOrder(po.id), "Purchase order received; stock updated")}
                >
                  <PackageCheck className="h-4 w-4" /> Receive
                </Button>
                <Button
                  variant="outline"
                  disabled={submitting}
                  onClick={() => withToast(() => inventoryApi.cancelPurchaseOrder(po.id), "Purchase order cancelled")}
                >
                  <XCircle className="h-4 w-4" /> Cancel
                </Button>
              </>
            )}
            {(po.status === "RECEIVED" || po.status === "CANCELLED") && (
              <p className="text-sm text-muted-foreground">No further actions available for a {po.status.toLowerCase()} order.</p>
            )}
          </CardContent>
        </Card>
      </Can>
    </div>
  );
}
