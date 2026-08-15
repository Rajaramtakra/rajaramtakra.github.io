import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBookSchema, type CreateBookInput } from "@erp/shared";
import { Plus, Upload } from "lucide-react";
import { libraryApi } from "./library.api";
import { inventoryApi, type Vendor } from "@/modules/inventory/inventory.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const BOOK_CATEGORIES = [
  "FICTION",
  "NON_FICTION",
  "SCIENCE",
  "MATHEMATICS",
  "HISTORY",
  "BIOGRAPHY",
  "REFERENCE",
  "MAGAZINE",
  "OTHER",
];

export function NewBookDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    if (open) inventoryApi.listVendors({ pageSize: 100 }).then((r) => setVendors(r.data));
  }, [open]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateBookInput>({
    resolver: zodResolver(createBookSchema),
    defaultValues: { totalCopies: 1 },
  });

  async function onSubmit(values: CreateBookInput) {
    try {
      const book = await libraryApi.createBook(values);
      if (coverFile) {
        await libraryApi.uploadCover(book.id, coverFile);
      }
      toast({ title: "Book added to catalog" });
      reset({ totalCopies: 1 });
      setCoverFile(null);
      setOpen(false);
      onCreated();
    } catch (err) {
      toast({ title: "Failed to add book", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> New book
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a book to the catalog</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input placeholder="To Kill a Mockingbird" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Author</Label>
            <Input placeholder="Harper Lee" {...register("author")} />
            {errors.author && <p className="text-xs text-destructive">{errors.author.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>ISBN</Label>
              <Input placeholder="978-0-06-112008-4" {...register("isbn")} />
            </div>
            <div className="space-y-1.5">
              <Label>Publisher</Label>
              <Input placeholder="HarperCollins" {...register("publisher")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={watch("category")} onValueChange={(v) => setValue("category", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {BOOK_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Total copies</Label>
              <Input type="number" min={1} {...register("totalCopies", { valueAsNumber: true })} />
              {errors.totalCopies && <p className="text-xs text-destructive">{errors.totalCopies.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Vendor (optional)</Label>
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
            </div>
            <div className="space-y-1.5">
              <Label>Shelf location (optional)</Label>
              <Input placeholder="Rack A, Shelf 3" {...register("shelfLocation")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Cover image (optional)</Label>
            <label className="flex w-fit items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm hover:bg-accent">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              />
              <Upload className="h-4 w-4" />
              {coverFile ? coverFile.name : "Choose file"}
            </label>
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
