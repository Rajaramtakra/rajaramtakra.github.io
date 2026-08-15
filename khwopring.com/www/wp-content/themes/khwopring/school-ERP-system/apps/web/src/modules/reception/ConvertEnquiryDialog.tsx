import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { convertEnquirySchema, type ConvertEnquiryInput } from "@erp/shared";
import { UserPlus } from "lucide-react";
import { receptionApi, type Enquiry } from "./reception.api";
import { academicApi, type AcademicSession, type ClassRecord } from "@/modules/academic/academic.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") || parts[0] };
}

export function ConvertEnquiryDialog({ enquiry, onConverted }: { enquiry: Enquiry; onConverted: () => void }) {
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const { firstName, lastName } = splitName(enquiry.fullName);

  useEffect(() => {
    if (!open) return;
    academicApi.listSessions().then(setSessions);
    academicApi.listClasses().then(setClasses);
  }, [open]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ConvertEnquiryInput>({
    resolver: zodResolver(convertEnquirySchema),
    defaultValues: {
      studentFirstName: firstName,
      studentLastName: lastName,
      classAppliedForId: enquiry.interestedClassId ?? undefined,
      isRte: false,
      guardians: [{ fullName: enquiry.fullName, relation: "GUARDIAN", phone: enquiry.phone, isPrimary: true }],
    },
  });

  async function onSubmit(values: ConvertEnquiryInput) {
    try {
      await receptionApi.convertEnquiry(enquiry.id, values as never);
      toast({ title: "Enquiry converted to a draft admission application" });
      setOpen(false);
      onConverted();
    } catch (err) {
      toast({ title: "Failed to convert enquiry", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <UserPlus className="h-4 w-4" /> Convert
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Convert enquiry to admission application</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>First name</Label>
              <Input {...register("studentFirstName")} />
              {errors.studentFirstName && <p className="text-xs text-destructive">{errors.studentFirstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Last name</Label>
              <Input {...register("studentLastName")} />
            </div>
            <div className="space-y-1.5">
              <Label>Date of birth</Label>
              <Input type="date" {...register("dateOfBirth")} />
              {errors.dateOfBirth && <p className="text-xs text-destructive">{errors.dateOfBirth.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select onValueChange={(v) => setValue("gender", v as never)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Class applying for</Label>
              <Select defaultValue={enquiry.interestedClassId ?? undefined} onValueChange={(v) => setValue("classAppliedForId", v)}>
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
              {errors.classAppliedForId && <p className="text-xs text-destructive">{errors.classAppliedForId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Academic session</Label>
              <Select onValueChange={(v) => setValue("academicSessionId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.academicSessionId && <p className="text-xs text-destructive">{errors.academicSessionId.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Address</Label>
            <Textarea {...register("address")} />
            {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
          </div>

          <div className="flex items-center gap-3 rounded-md border border-border p-3">
            <Switch checked={watch("isRte")} onCheckedChange={(v) => setValue("isRte", v)} />
            <div className="flex-1">
              <Label>Right to Education (RTE) admission</Label>
            </div>
            {watch("isRte") && <Input className="w-40" placeholder="RTE category" {...register("rteCategory")} />}
          </div>

          <div className="space-y-2 rounded-md border border-border p-3">
            <Label>Primary guardian</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Full name" {...register("guardians.0.fullName")} />
              <Input placeholder="Phone" {...register("guardians.0.phone")} />
              <Select defaultValue="GUARDIAN" onValueChange={(v) => setValue("guardians.0.relation", v as never)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["FATHER", "MOTHER", "GUARDIAN", "GRANDFATHER", "GRANDMOTHER", "OTHER"].map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              Create draft application
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
