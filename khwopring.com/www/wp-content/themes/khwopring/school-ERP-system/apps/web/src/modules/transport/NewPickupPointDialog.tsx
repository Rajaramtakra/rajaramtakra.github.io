import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPickupPointSchema, type CreatePickupPointInput } from "@erp/shared";
import { Plus } from "lucide-react";
import { transportApi } from "./transport.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewPickupPointDialog({ routeId, onCreated }: { routeId: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePickupPointInput>({
    resolver: zodResolver(createPickupPointSchema),
    defaultValues: { routeId, order: 0 },
  });

  async function onSubmit(values: CreatePickupPointInput) {
    try {
      await transportApi.createPickupPoint({ ...values, routeId });
      toast({ title: "Pickup point added" });
      reset({ routeId, order: 0 });
      setOpen(false);
      onCreated();
    } catch (err) {
      toast({ title: "Failed to add pickup point", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4" /> Add stop
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New pickup point</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input placeholder="Maple Street corner" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Order</Label>
              <Input type="number" placeholder="1" {...register("order", { valueAsNumber: true })} />
              {errors.order && <p className="text-xs text-destructive">{errors.order.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Pickup time</Label>
              <Input type="time" {...register("pickupTime")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
