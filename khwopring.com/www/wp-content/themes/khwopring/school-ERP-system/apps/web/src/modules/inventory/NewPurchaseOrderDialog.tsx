import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPurchaseOrderSchema, type CreatePurchaseOrderInput } from "@erp/shared";
import { Plus, Trash2 } from "lucide-react";
import { inventoryApi, type InventoryItem, type Vendor } from "./inventory.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function NewPurchaseOrderDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    if (!open) return;
    inventoryApi.listVendors({ pageSize: 100 }).then((res) => setVendors(res.data));
    inventoryApi.listItems({ pageSize: 100 }).then((res) => setItems(res.data));
  }, [open]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreatePurchaseOrderInput>({
    resolver: zodResolver(createPurchaseOrderSchema),
    defaultValues: { items: [{ description: "", quantity: 1, unitCost: 0 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");
  const total = (watchedItems ?? []).reduce((sum, i) => sum + (Number(i?.quantity) || 0) * (Number(i?.unitCost) || 0), 0);

  async function onSubmit(values: CreatePurchaseOrderInput) {
    try {
      await inventoryApi.createPurchaseOrder(values as never);
      toast({ title: "Purchase order created (draft)" });
      reset({ items: [{ description: "", quantity: 1, unitCost: 0 }] });
      setOpen(false);
      onCreated();
    } catch (err) {
      toast({ title: "Failed to create purchase order", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> New purchase order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New purchase order (Draft)</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Vendor</Label>
              <Select onValueChange={(v) => setValue("vendorId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vendorId && <p className="text-xs text-destructive">{errors.vendorId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Expected date</Label>
              <Input type="date" {...register("expectedDate")} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Line items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ description: "", quantity: 1, unitCost: 0 })}
              >
                <Plus className="h-3.5 w-3.5" /> Add line
              </Button>
            </div>
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] items-end gap-2 rounded-md border border-border p-3"
              >
                <div className="space-y-1">
                  <Label className="text-xs">Description</Label>
                  <Input {...register(`items.${index}.description`)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Linked stock item (optional)</Label>
                  <Select
                    onValueChange={(v) => setValue(`items.${index}.inventoryItemId`, v === "NONE" ? undefined : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None</SelectItem>
                      {items.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Quantity</Label>
                  <Input type="number" min={1} {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Unit cost</Label>
                  <Input type="number" step="0.01" min={0} {...register(`items.${index}.unitCost`, { valueAsNumber: true })} />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {errors.items?.message && <p className="text-xs text-destructive">{errors.items.message}</p>}
          </div>

          <p className="text-right text-sm font-medium">
            Total: {total.toLocaleString(undefined, { style: "currency", currency: "USD" })}
          </p>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              Create draft
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
