import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAnnouncementSchema, type CreateAnnouncementInput } from "@erp/shared";
import { Plus } from "lucide-react";
import { communicationApi } from "./communication.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const AUDIENCES: CreateAnnouncementInput["audience"][] = ["ALL", "STUDENTS", "PARENTS", "TEACHERS", "STAFF"];

export function NewAnnouncementDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAnnouncementInput>({
    resolver: zodResolver(createAnnouncementSchema),
    defaultValues: { audience: "ALL" },
  });

  async function onSubmit(values: CreateAnnouncementInput) {
    try {
      await communicationApi.createAnnouncement(values);
      reset();
      setOpen(false);
      onCreated();
      toast({ title: "Announcement published" });
    } catch (err) {
      toast({ title: "Failed to publish announcement", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> New announcement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New announcement</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Body</Label>
            <Textarea rows={4} {...register("body")} />
            {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Audience</Label>
            <Select defaultValue="ALL" onValueChange={(v) => setValue("audience", v as CreateAnnouncementInput["audience"])}>
              <SelectTrigger>
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCES.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 rounded border-border" {...register("pinned")} />
            Pin to top
          </label>
          <div className="space-y-1.5">
            <Label>Show as popup until (optional)</Label>
            <Input type="datetime-local" {...register("popupUntil")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              Publish
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
