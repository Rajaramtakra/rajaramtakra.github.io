import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, TrendingUp, UserCog } from "lucide-react";
import { promoteStaffSchema, type PromoteStaffInput } from "@erp/shared";
import { hrApi, type StaffMemberRecord, type StaffPromotionHistoryRecord } from "./hr.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Can } from "@/components/Can";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  ACTIVE: "success",
  ON_LEAVE: "warning",
  TERMINATED: "destructive",
  RESIGNED: "secondary",
  RETIRED: "default",
};

function PromoteStaffDialog({ staff, onPromoted }: { staff: StaffMemberRecord; onPromoted: () => void }) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PromoteStaffInput>({
    resolver: zodResolver(promoteStaffSchema),
    defaultValues: { toDesignation: staff.designation, toDepartment: staff.department },
  });

  async function onSubmit(values: PromoteStaffInput) {
    try {
      await hrApi.staff.promote(staff.id, values);
      toast({ title: "Staff member promoted" });
      reset();
      setOpen(false);
      onPromoted();
    } catch (err) {
      toast({ title: "Failed to promote staff member", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <TrendingUp className="h-4 w-4" /> Promote
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Promote {staff.firstName} {staff.lastName}</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label>New designation</Label>
            <Input {...register("toDesignation")} />
            {errors.toDesignation && <p className="text-xs text-destructive">{errors.toDesignation.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>New department</Label>
            <Input {...register("toDepartment")} />
            {errors.toDepartment && <p className="text-xs text-destructive">{errors.toDepartment.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Remarks</Label>
            <Input placeholder="Optional" {...register("remarks")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              Confirm promotion
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PromotionHistoryCard({ staffId }: { staffId: string }) {
  const [history, setHistory] = useState<StaffPromotionHistoryRecord[]>([]);

  useEffect(() => {
    hrApi.staff.promotionHistory(staffId).then(setHistory);
  }, [staffId]);

  if (history.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Promotion History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((h) => (
              <TableRow key={h.id}>
                <TableCell>{new Date(h.promotedAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  {h.fromDesignation} &rarr; <span className="font-medium">{h.toDesignation}</span>
                </TableCell>
                <TableCell>
                  {h.fromDepartment} &rarr; <span className="font-medium">{h.toDepartment}</span>
                </TableCell>
                <TableCell className="text-muted-foreground">{h.remarks ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function StaffMemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [staff, setStaff] = useState<StaffMemberRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyKey, setHistoryKey] = useState(0);

  function reload() {
    if (!id) return;
    setLoading(true);
    hrApi.staff.get(id).then(setStaff).finally(() => setLoading(false));
  }
  useEffect(reload, [id]);

  async function handlePhotoChange(file: File) {
    if (!id) return;
    try {
      await hrApi.staff.uploadPhoto(id, file);
      toast({ title: "Photo updated" });
      reload();
    } catch (err) {
      toast({ title: "Failed to update photo", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  async function handleStatusChange(status: string) {
    if (!staff) return;
    try {
      await hrApi.staff.updateStatus(staff.id, status);
      toast({ title: "Employment status updated" });
      reload();
    } catch (err) {
      toast({ title: "Failed to update status", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  if (loading || !staff) {
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
            <AvatarImage src={staff.photoUrl ? `/uploads/${staff.photoUrl}` : undefined} alt="Staff photo" className="object-cover" />
            <AvatarFallback className="rounded-md bg-primary/10 text-base text-primary">
              {staff.firstName.slice(0, 1)}
              {staff.lastName.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {staff.firstName} {staff.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {staff.employeeCode} &middot; {staff.designation}
            </p>
          </div>
          <Can anyOf={["staff:manage"]}>
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
          <Badge variant={STATUS_VARIANT[staff.employmentStatus]} className="text-sm">
            {staff.employmentStatus}
          </Badge>
          <Can anyOf={["staff:manage"]}>
            <Select value={staff.employmentStatus} onValueChange={handleStatusChange}>
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
          <Can anyOf={["staff:manage"]}>
            <PromoteStaffDialog
              staff={staff}
              onPromoted={() => {
                reload();
                setHistoryKey((k) => k + 1);
              }}
            />
          </Can>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium">{staff.email ?? staff.user.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Phone</p>
            <p className="font-medium">{staff.phone ?? "-"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Department</p>
            <p className="font-medium">{staff.department}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Date of joining</p>
            <p className="font-medium">{new Date(staff.dateOfJoining).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Login status</p>
            <p className="font-medium">{staff.user.isActive ? "Active" : "Disabled"}</p>
          </div>
        </CardContent>
      </Card>

      <PromotionHistoryCard key={historyKey} staffId={staff.id} />
    </div>
  );
}
