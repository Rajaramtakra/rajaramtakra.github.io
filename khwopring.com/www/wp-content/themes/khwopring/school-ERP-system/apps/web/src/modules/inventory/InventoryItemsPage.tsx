import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createInventoryItemSchema, type CreateInventoryItemInput } from "@erp/shared";
import { ArrowDownCircle, ArrowUpCircle, History, Plus, Search } from "lucide-react";
import { inventoryApi, type InventoryItem, type StockMovement, type StockMovementType } from "./inventory.api";
import { hrApi, type StaffMemberRecord } from "@/modules/hr/hr.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Can } from "@/components/Can";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function NewItemDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateInventoryItemInput>({ resolver: zodResolver(createInventoryItemSchema) });

  async function onSubmit(values: CreateInventoryItemInput) {
    try {
      await inventoryApi.createItem(values as never);
      toast({ title: "Item added" });
      reset();
      setOpen(false);
      onCreated();
    } catch (err) {
      toast({ title: "Failed to add item", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> New item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New inventory item</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input placeholder="A4 Paper Ream" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Input placeholder="Stationery" {...register("category")} />
            {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Input placeholder="box" {...register("unit")} />
              {errors.unit && <p className="text-xs text-destructive">{errors.unit.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Reorder level</Label>
              <Input type="number" {...register("reorderLevel", { valueAsNumber: true })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const NO_STAFF = "NONE";

function AdjustStockDialog({ item, onAdjusted }: { item: InventoryItem; onAdjusted: () => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<StockMovementType>("IN");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [issuedToStaffId, setIssuedToStaffId] = useState(NO_STAFF);
  const [staff, setStaff] = useState<StaffMemberRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) hrApi.staff.list({ pageSize: 200 }).then((r) => setStaff(r.data));
  }, [open]);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await inventoryApi.adjustStock({
        inventoryItemId: item.id,
        type,
        quantity: Number(quantity),
        reason: reason || undefined,
        issuedToStaffId: issuedToStaffId === NO_STAFF ? undefined : issuedToStaffId,
      });
      toast({ title: "Stock adjusted" });
      setOpen(false);
      setQuantity("");
      setReason("");
      setIssuedToStaffId(NO_STAFF);
      onAdjusted();
    } catch (err) {
      toast({ title: "Failed to adjust stock", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowUpCircle className="h-4 w-4" /> Adjust
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock — {item.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Current quantity: <span className="font-medium text-foreground">{item.quantity}</span> {item.unit}
          </p>
          <div className="space-y-1.5">
            <Label>Movement type</Label>
            <Select value={type} onValueChange={(v) => setType(v as StockMovementType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN">Stock in (restock / correction)</SelectItem>
                <SelectItem value="OUT">Stock out (usage / issue to staff)</SelectItem>
                <SelectItem value="DAMAGE">Damaged / written off</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Quantity</Label>
            <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          {type === "OUT" && (
            <div className="space-y-1.5">
              <Label>Issued to staff (optional)</Label>
              <Select value={issuedToStaffId} onValueChange={setIssuedToStaffId}>
                <SelectTrigger>
                  <SelectValue placeholder="Not issued to a specific staff member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_STAFF}>Not issued to a specific staff member</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.employeeCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Reason (optional)</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Damaged in storage" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting || !quantity}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MovementsDialog({ item }: { item: InventoryItem }) {
  const [open, setOpen] = useState(false);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    inventoryApi.listItemMovements(item.id).then(setMovements).finally(() => setLoading(false));
  }, [open, item.id]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <History className="h-4 w-4" /> History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Stock movements — {item.name}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {movements.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                <div className="flex items-center gap-2">
                  {m.type === "IN" ? (
                    <ArrowDownCircle className="h-4 w-4 text-success" />
                  ) : (
                    <ArrowUpCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span>
                    {m.type === "IN" ? "+" : "-"}
                    {m.quantity} {item.unit}
                  </span>
                </div>
                <div className="text-right text-muted-foreground">
                  <p>{new Date(m.createdAt).toLocaleString()}</p>
                  {m.reason && <p className="text-xs">{m.reason}</p>}
                </div>
              </div>
            ))}
            {movements.length === 0 && <p className="text-sm text-muted-foreground">No stock movements recorded yet.</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function InventoryItemsPage() {
  const [data, setData] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    inventoryApi
      .listItems({ page, pageSize: 10, search: search || undefined })
      .then((res) => {
        setData(res.data);
        setTotal(res.meta.total);
      })
      .finally(() => setLoading(false));
  }

  useEffect(reload, [page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stock Items</h1>
          <p className="text-sm text-muted-foreground">Consumables and supplies with reorder-level tracking.</p>
        </div>
        <Can anyOf={["inventory:manage"]}>
          <NewItemDialog onCreated={reload} />
        </Can>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8 sm:max-w-sm"
              placeholder="Search by name..."
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
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reorder level</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>
                            {item.quantity} {item.unit}
                          </span>
                          {item.quantity <= item.reorderLevel && <Badge variant="warning">Low stock</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.reorderLevel} {item.unit}
                      </TableCell>
                      <TableCell className="flex justify-end gap-1">
                        <MovementsDialog item={item} />
                        <Can anyOf={["inventory:manage"]}>
                          <AdjustStockDialog item={item} onAdjusted={reload} />
                        </Can>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No inventory items found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">{total} total items</p>
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
