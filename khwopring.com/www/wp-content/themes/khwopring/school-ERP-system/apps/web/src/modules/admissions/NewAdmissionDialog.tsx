import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAdmissionApplicationSchema, type CreateAdmissionApplicationInput } from "@erp/shared";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { admissionApi } from "./admission.api";
import { academicApi, type AcademicSession, type ClassRecord } from "@/modules/academic/academic.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function NewAdmissionDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    academicApi.listSessions().then(setSessions);
    academicApi.listClasses().then(setClasses);
  }, [open]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAdmissionApplicationInput>({
    resolver: zodResolver(createAdmissionApplicationSchema),
    defaultValues: { guardians: [{ fullName: "", relation: "FATHER", phone: "", isPrimary: true }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "guardians" });

  async function onSubmit(values: CreateAdmissionApplicationInput) {
    try {
      const application = await admissionApi.create(values as never);
      if (photoFile) {
        await admissionApi.uploadDocument(application.id, "PHOTO", photoFile);
      }
      toast({ title: "Draft application created" });
      reset();
      setPhotoFile(null);
      setPhotoPreview(null);
      setOpen(false);
      onCreated();
    } catch (err) {
      toast({ title: "Failed to create application", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> New application
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New admission application (Draft)</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 rounded-md">
              <AvatarImage src={photoPreview ?? undefined} alt="Student photo" className="object-cover" />
              <AvatarFallback className="rounded-md bg-primary/10 text-base text-primary">?</AvatarFallback>
            </Avatar>
            <label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setPhotoFile(file);
                  setPhotoPreview(URL.createObjectURL(file));
                }}
              />
              <Button type="button" variant="outline" size="sm" asChild>
                <span>
                  <ImagePlus className="h-4 w-4" /> {photoFile ? "Change photo" : "Upload photo"}
                </span>
              </Button>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>First name</Label>
              <Input {...register("studentFirstName")} />
              {errors.studentFirstName && <p className="text-xs text-destructive">{errors.studentFirstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Last name</Label>
              <Input {...register("studentLastName")} />
              {errors.studentLastName && <p className="text-xs text-destructive">{errors.studentLastName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Date of birth</Label>
              <Input type="date" {...register("dateOfBirth")} />
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
              <Select onValueChange={(v) => setValue("classAppliedForId", v)}>
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
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Address</Label>
            <Textarea {...register("address")} />
            {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Guardians</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ fullName: "", relation: "FATHER", phone: "", isPrimary: false })}
              >
                <Plus className="h-3.5 w-3.5" /> Add guardian
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2 rounded-md border border-border p-3">
                <div className="space-y-1">
                  <Label className="text-xs">Full name</Label>
                  <Input {...register(`guardians.${index}.fullName`)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Relation</Label>
                  <Select
                    defaultValue={field.relation}
                    onValueChange={(v) => setValue(`guardians.${index}.relation`, v as never)}
                  >
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
                <div className="space-y-1">
                  <Label className="text-xs">Phone</Label>
                  <Input {...register(`guardians.${index}.phone`)} />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {errors.guardians?.message && <p className="text-xs text-destructive">{errors.guardians.message}</p>}
          </div>

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
