import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createStaffMemberSchema, STAFF_ASSIGNABLE_ROLES, type CreateStaffMemberInput } from "@erp/shared";
import { Plus, Copy, ImagePlus } from "lucide-react";
import { hrApi } from "./hr.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ROLE_LABELS: Record<(typeof STAFF_ASSIGNABLE_ROLES)[number], string> = {
  SCHOOL_ADMIN: "School Admin",
  PRINCIPAL: "Principal",
  ACCOUNTANT: "Accountant",
  RECEPTIONIST: "Receptionist",
  LIBRARIAN: "Librarian",
  TRANSPORT_MANAGER: "Transport Manager",
  HR_MANAGER: "HR Manager",
};

export function NewStaffMemberDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [credentials, setCredentials] = useState<{ id: string; email: string; temporaryPassword: string } | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateStaffMemberInput>({ resolver: zodResolver(createStaffMemberSchema) });

  async function onSubmit(values: CreateStaffMemberInput) {
    try {
      const { staffMember, temporaryPassword } = await hrApi.staff.create(values as never);
      setCredentials({ id: staffMember.id, email: values.email, temporaryPassword });
      reset();
      onCreated();
    } catch (err) {
      toast({ title: "Failed to create staff member", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  async function handlePhotoChange(file: File) {
    if (!credentials) return;
    try {
      await hrApi.staff.uploadPhoto(credentials.id, file);
      setPhotoPreview(URL.createObjectURL(file));
      toast({ title: "Photo uploaded" });
      onCreated();
    } catch (err) {
      toast({ title: "Failed to upload photo", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  function handleClose(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setCredentials(null);
      setPhotoPreview(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> New staff member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        {credentials ? (
          <>
            <DialogHeader>
              <DialogTitle>Staff account created</DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 rounded-md">
                <AvatarImage src={photoPreview ?? undefined} alt="Staff photo" className="object-cover" />
                <AvatarFallback className="rounded-md bg-primary/10 text-base text-primary">?</AvatarFallback>
              </Avatar>
              <label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handlePhotoChange(e.target.files[0])}
                />
                <Button type="button" variant="outline" size="sm" asChild>
                  <span>
                    <ImagePlus className="h-4 w-4" /> Upload photo
                  </span>
                </Button>
              </label>
            </div>
            <div className="space-y-3 rounded-md border border-warning/30 bg-warning/10 p-4 text-sm">
              <p>Share these login credentials securely. The password will not be shown again.</p>
              <div className="flex items-center justify-between rounded-md bg-background px-3 py-2 font-mono text-xs">
                <span>{credentials.email}</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-background px-3 py-2 font-mono text-xs">
                <span>{credentials.temporaryPassword}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    navigator.clipboard.writeText(credentials.temporaryPassword);
                    toast({ title: "Copied to clipboard" });
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>New staff member</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>First name</Label>
                  <Input {...register("firstName")} />
                  {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Last name</Label>
                  <Input {...register("lastName")} />
                  {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Email (used for login)</Label>
                  <Input type="email" {...register("email")} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input {...register("phone")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Date of joining</Label>
                  <Input type="date" {...register("dateOfJoining")} />
                  {errors.dateOfJoining && <p className="text-xs text-destructive">{errors.dateOfJoining.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Input {...register("department")} />
                  {errors.department && <p className="text-xs text-destructive">{errors.department.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Designation</Label>
                  <Input {...register("designation")} />
                  {errors.designation && <p className="text-xs text-destructive">{errors.designation.message}</p>}
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Account role</Label>
                  <Select onValueChange={(v) => setValue("role", v as CreateStaffMemberInput["role"])}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select the role this account should have" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAFF_ASSIGNABLE_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  Create staff member
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
