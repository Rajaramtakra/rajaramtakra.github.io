import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEnquirySchema, type CreateEnquiryInput } from "@erp/shared";
import { Plus } from "lucide-react";
import { receptionApi } from "./reception.api";
import { academicApi, type ClassRecord } from "@/modules/academic/academic.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function NewEnquiryDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [classes, setClasses] = useState<ClassRecord[]>([]);

  useEffect(() => {
    if (open) academicApi.listClasses().then(setClasses);
  }, [open]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateEnquiryInput>({ resolver: zodResolver(createEnquirySchema) });

  async function onSubmit(values: CreateEnquiryInput) {
    try {
      await receptionApi.createEnquiry(values as never);
      toast({ title: "Enquiry recorded" });
      reset();
      setOpen(false);
      onCreated();
    } catch (err) {
      toast({ title: "Failed to record enquiry", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> New enquiry
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a new enquiry</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input {...register("fullName")} />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input {...register("phone")} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Email (optional)</Label>
              <Input type="email" {...register("email")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Interested class</Label>
              <Select onValueChange={(v) => setValue("interestedClassId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Source (optional)</Label>
              <Input placeholder="Walk-in, referral, website..." {...register("source")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Remarks (optional)</Label>
            <Textarea {...register("remarks")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              Save enquiry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
