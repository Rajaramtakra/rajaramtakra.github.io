import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAssetSchema, type CreateAssetInput } from "@erp/shared";
import { Plus } from "lucide-react";
import { inventoryApi } from "./inventory.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function NewAssetDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAssetInput>({ resolver: zodResolver(createAssetSchema) });

  async function onSubmit(values: CreateAssetInput) {
    try {
      await inventoryApi.createAsset(values as never);
      toast({ title: "Asset added" });
      reset();
      setOpen(false);
      onCreated();
    } catch (err) {
      toast({ title: "Failed to add asset", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> New asset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New asset</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input placeholder="Projector" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Input placeholder="Electronics" {...register("category")} />
            {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Purchase date</Label>
              <Input type="date" {...register("purchaseDate")} />
              {errors.purchaseDate && <p className="text-xs text-destructive">{errors.purchaseDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Purchase cost</Label>
              <Input type="number" step="0.01" {...register("purchaseCost")} />
              {errors.purchaseCost && <p className="text-xs text-destructive">{errors.purchaseCost.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input placeholder="Room 204" {...register("location")} />
            </div>
            <div className="space-y-1.5">
              <Label>Condition</Label>
              <Input placeholder="Good" {...register("condition")} />
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
