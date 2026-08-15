import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  addTeacherExperienceSchema,
  addTeacherQualificationSchema,
  type AddTeacherExperienceInput,
  type AddTeacherQualificationInput,
} from "@erp/shared";
import { Award, Briefcase, ImagePlus, Plus, UserCog } from "lucide-react";
import { teacherApi, type TeacherRecord } from "./teacher.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Can } from "@/components/Can";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  ACTIVE: "success",
  ON_LEAVE: "warning",
  TERMINATED: "destructive",
  RESIGNED: "secondary",
  RETIRED: "default",
};

function AddQualificationDialog({ teacherId, onAdded }: { teacherId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddTeacherQualificationInput>({ resolver: zodResolver(addTeacherQualificationSchema) });

  async function onSubmit(values: AddTeacherQualificationInput) {
    try {
      await teacherApi.addQualification(teacherId, values);
      reset();
      setOpen(false);
      onAdded();
    } catch (err) {
      toast({ title: "Failed to add qualification", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add qualification</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label>Degree</Label>
            <Input {...register("degree")} />
            {errors.degree && <p className="text-xs text-destructive">{errors.degree.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Institution</Label>
            <Input {...register("institution")} />
            {errors.institution && <p className="text-xs text-destructive">{errors.institution.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Year completed</Label>
            <Input type="number" {...register("yearCompleted")} />
            {errors.yearCompleted && <p className="text-xs text-destructive">{errors.yearCompleted.message}</p>}
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

function AddExperienceDialog({ teacherId, onAdded }: { teacherId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddTeacherExperienceInput>({ resolver: zodResolver(addTeacherExperienceSchema) });

  async function onSubmit(values: AddTeacherExperienceInput) {
    try {
      await teacherApi.addExperience(teacherId, values as never);
      reset();
      setOpen(false);
      onAdded();
    } catch (err) {
      toast({ title: "Failed to add experience", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add work experience</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label>Organization</Label>
            <Input {...register("organization")} />
            {errors.organization && <p className="text-xs text-destructive">{errors.organization.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Input {...register("role")} />
            {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>From date</Label>
              <Input type="date" {...register("fromDate")} />
            </div>
            <div className="space-y-1.5">
              <Label>To date</Label>
              <Input type="date" {...register("toDate")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea {...register("description")} />
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

export function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [teacher, setTeacher] = useState<TeacherRecord | null>(null);
  const [loading, setLoading] = useState(true);

  function reload() {
    if (!id) return;
    setLoading(true);
    teacherApi.get(id).then(setTeacher).finally(() => setLoading(false));
  }
  useEffect(reload, [id]);

  async function handlePhotoChange(file: File) {
    if (!id) return;
    try {
      await teacherApi.uploadPhoto(id, file);
      toast({ title: "Photo updated" });
      reload();
    } catch (err) {
      toast({ title: "Failed to update photo", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  async function handleStatusChange(status: string) {
    if (!teacher) return;
    try {
      await teacherApi.updateStatus(teacher.id, status);
      toast({ title: "Employment status updated" });
      reload();
    } catch (err) {
      toast({ title: "Failed to update status", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  if (loading || !teacher) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-14 w-14 rounded-md">
            <AvatarImage src={teacher.photoUrl ? `/uploads/${teacher.photoUrl}` : undefined} alt="Teacher photo" className="object-cover" />
            <AvatarFallback className="rounded-md bg-primary/10 text-base text-primary">
              {teacher.firstName.slice(0, 1)}
              {teacher.lastName.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {teacher.firstName} {teacher.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {teacher.employeeCode} &middot; {teacher.specialization ?? "General"}
            </p>
          </div>
          <Can anyOf={["teacher:manage"]}>
            <label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handlePhotoChange(e.target.files[0])}
              />
              <Button type="button" variant="outline" size="sm" asChild>
                <span>
                  <ImagePlus className="h-4 w-4" /> Change photo
                </span>
              </Button>
            </label>
          </Can>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[teacher.employmentStatus]} className="text-sm">
            {teacher.employmentStatus}
          </Badge>
          <Can anyOf={["teacher:manage"]}>
            <Select value={teacher.employmentStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-40">
                <UserCog className="mr-1 h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["ACTIVE", "ON_LEAVE", "TERMINATED", "RESIGNED", "RETIRED"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Can>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{teacher.email ?? teacher.user.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium">{teacher.phone ?? "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Date of joining</p>
              <p className="font-medium">{new Date(teacher.dateOfJoining).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Login status</p>
              <p className="font-medium">{teacher.user.isActive ? "Active" : "Disabled"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Address</p>
              <p className="font-medium">{teacher.address ?? "-"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4" /> Qualifications
            </CardTitle>
            <Can anyOf={["teacher:manage"]}>
              <AddQualificationDialog teacherId={teacher.id} onAdded={reload} />
            </Can>
          </CardHeader>
          <CardContent className="space-y-2">
            {teacher.qualifications.map((q) => (
              <div key={q.id} className="rounded-md border border-border p-3 text-sm">
                <p className="font-medium">{q.degree}</p>
                <p className="text-muted-foreground">
                  {q.institution} &middot; {q.yearCompleted}
                </p>
              </div>
            ))}
            {teacher.qualifications.length === 0 && (
              <p className="text-sm text-muted-foreground">No qualifications on file.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-4 w-4" /> Work experience
          </CardTitle>
          <Can anyOf={["teacher:manage"]}>
            <AddExperienceDialog teacherId={teacher.id} onAdded={reload} />
          </Can>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {teacher.experiences.map((exp) => (
            <div key={exp.id} className="rounded-md border border-border p-3 text-sm">
              <p className="font-medium">
                {exp.role} &middot; {exp.organization}
              </p>
              <p className="text-muted-foreground">
                {new Date(exp.fromDate).toLocaleDateString()} &ndash;{" "}
                {exp.toDate ? new Date(exp.toDate).toLocaleDateString() : "Present"}
              </p>
              {exp.description && <p className="mt-1 text-muted-foreground">{exp.description}</p>}
            </div>
          ))}
          {teacher.experiences.length === 0 && (
            <p className="text-sm text-muted-foreground">No work experience on file.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
