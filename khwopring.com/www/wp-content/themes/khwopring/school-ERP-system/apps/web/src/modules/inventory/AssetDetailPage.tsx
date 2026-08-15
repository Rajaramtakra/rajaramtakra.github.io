import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateAssetSchema, type UpdateAssetInput } from "@erp/shared";
import { Pencil, Trash2 } from "lucide-react";
import { inventoryApi, type Asset } from "./inventory.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Can } from "@/components/Can";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  function reload() {
    if (!id) return;
    setLoading(true);
    inventoryApi.getAsset(id).then(setAsset).finally(() => setLoading(false));
  }
  useEffect(reload, [id]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<UpdateAssetInput>({ resolver: zodResolver(updateAssetSchema) });

  useEffect(() => {
    if (asset) {
      reset({
        name: asset.name,
        category: asset.category,
        purchaseDate: asset.purchaseDate.slice(0, 10) as never,
        purchaseCost: Number(asset.purchaseCost) as never,
        location: asset.location ?? undefined,
        condition: asset.condition ?? undefined,
      });
    }
  }, [asset, reset]);

  async function onSubmit(values: UpdateAssetInput) {
    if (!id) return;
    try {
      await inventoryApi.updateAsset(id, values as never);
      toast({ title: "Asset updated" });
      setEditOpen(false);
      reload();
    } catch (err) {
      toast({ title: "Failed to update asset", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (!window.confirm("Remove this asset from the register?")) return;
    try {
      await inventoryApi.deleteAsset(id);
      toast({ title: "Asset removed" });
      navigate("/inventory/assets");
    } catch (err) {
      toast({ title: "Failed to remove asset", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  if (loading || !asset) {
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
          <h1 className="text-2xl font-semibold tracking-tight">{asset.name}</h1>
          <p className="text-sm text-muted-foreground">{asset.category}</p>
        </div>
        <Can anyOf={["inventory:manage"]}>
          <div className="flex gap-2">
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit asset</DialogTitle>
                </DialogHeader>
                <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-1.5">
                    <Label>Name</Label>
                    <Input {...register("name")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Input {...register("category")} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Purchase date</Label>
                      <Input type="date" {...register("purchaseDate")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Purchase cost</Label>
                      <Input type="number" step="0.01" {...register("purchaseCost")} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Location</Label>
                      <Input {...register("location")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Condition</Label>
                      <Input {...register("condition")} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      Save changes
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 text-destructive" /> Remove
            </Button>
          </div>
        </Can>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Purchase date</p>
            <p className="font-medium">{new Date(asset.purchaseDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Purchase cost</p>
            <p className="font-medium">
              {Number(asset.purchaseCost).toLocaleString(undefined, { style: "currency", currency: "USD" })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Location</p>
            <p className="font-medium">{asset.location ?? "-"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Condition</p>
            <p className="font-medium">{asset.condition ?? "-"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
