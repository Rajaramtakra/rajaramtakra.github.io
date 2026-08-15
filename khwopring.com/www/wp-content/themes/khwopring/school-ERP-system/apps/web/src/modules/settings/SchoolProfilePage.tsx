import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createHolidaySchema, updateSchoolProfileSchema, type CreateHolidayInput, type UpdateSchoolProfileInput } from "@erp/shared";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { settingsApi, type Holiday, type SchoolProfile } from "./settings.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Can } from "@/components/Can";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function NewHolidayDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateHolidayInput>({ resolver: zodResolver(createHolidaySchema), defaultValues: { recurring: false } });

  async function onSubmit(values: CreateHolidayInput) {
    try {
      await settingsApi.createHoliday({ ...values, date: new Date(values.date).toISOString() });
      toast({ title: "Holiday added" });
      reset({ recurring: false });
      setOpen(false);
      onCreated();
    } catch (err) {
      toast({ title: "Failed to add holiday", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> New holiday
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New holiday</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input placeholder="Independence Day" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" {...register("date")} />
            {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={watch("recurring")} onCheckedChange={(v) => setValue("recurring", v)} />
            <Label>Recurs every year</Label>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              Add holiday
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function HolidaysCard() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    settingsApi.listHolidays().then(setHolidays).finally(() => setLoading(false));
  }
  useEffect(reload, []);

  async function handleDelete(id: string) {
    try {
      await settingsApi.deleteHoliday(id);
      toast({ title: "Holiday removed" });
      reload();
    } catch (err) {
      toast({ title: "Failed to remove holiday", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold text-foreground">Holiday List</CardTitle>
        <Can anyOf={["settings:manage"]}>
          <NewHolidayDialog onCreated={reload} />
        </Can>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Recurring</TableHead>
                <Can anyOf={["settings:manage"]}>
                  <TableHead className="w-10" />
                </Can>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holidays.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.name}</TableCell>
                  <TableCell>{new Date(h.date).toLocaleDateString()}</TableCell>
                  <TableCell>{h.recurring && <Badge variant="secondary">Yearly</Badge>}</TableCell>
                  <Can anyOf={["settings:manage"]}>
                    <TableCell>
                      <button
                        onClick={() => handleDelete(h.id)}
                        className="text-destructive hover:opacity-70"
                        aria-label="Remove holiday"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </Can>
                </TableRow>
              ))}
              {holidays.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No holidays defined yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export function SchoolProfilePage() {
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UpdateSchoolProfileInput>({ resolver: zodResolver(updateSchoolProfileSchema) });

  function reload() {
    setLoading(true);
    settingsApi
      .getSchoolProfile()
      .then((profile) => {
        setSchool(profile);
        reset({
          name: profile.name,
          address: profile.address ?? "",
          phone: profile.phone ?? "",
          email: profile.email ?? "",
          website: profile.website ?? "",
          idCardPrimaryColor: profile.idCardPrimaryColor ?? "#1d4ed8",
          idCardSecondaryColor: profile.idCardSecondaryColor ?? "#1e293b",
          idCardQrVerificationEnabled: profile.idCardQrVerificationEnabled,
        });
      })
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function onSubmit(values: UpdateSchoolProfileInput) {
    try {
      const updated = await settingsApi.updateSchoolProfile({ ...values, logo: logoFile ?? undefined });
      setSchool(updated);
      setLogoFile(null);
      setLogoPreview(null);
      toast({ title: "School profile updated" });
    } catch (err) {
      toast({ title: "Failed to update profile", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  if (loading || !school) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const currentLogo = logoPreview ?? (school.logoUrl ? `/uploads/${school.logoUrl}` : undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">School Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your school's identity and contact information.</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Profile details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 rounded-md">
                <AvatarImage src={currentLogo} alt={school.name} className="object-contain" />
                <AvatarFallback className="rounded-md bg-primary/10 text-base text-primary">
                  {school.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Can anyOf={["settings:manage"]}>
                <label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setLogoFile(file);
                      setLogoPreview(URL.createObjectURL(file));
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <ImagePlus className="h-4 w-4" /> Change logo
                    </span>
                  </Button>
                </label>
              </Can>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>School name</Label>
                <Input {...register("name")} disabled />
                <p className="text-xs text-muted-foreground">
                  School code: <span className="font-medium">{school.code}</span>
                </p>
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Address</Label>
                <Input {...register("address")} />
                {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input {...register("phone")} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Website</Label>
                <Input placeholder="https://example.edu" {...register("website")} />
                {errors.website && <p className="text-xs text-destructive">{errors.website.message}</p>}
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border p-4">
              <p className="text-sm font-semibold">ID Card Settings</p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Primary color</Label>
                  <Input type="color" className="h-9 w-full p-1" {...register("idCardPrimaryColor")} />
                  {errors.idCardPrimaryColor && (
                    <p className="text-xs text-destructive">{errors.idCardPrimaryColor.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Secondary color</Label>
                  <Input type="color" className="h-9 w-full p-1" {...register("idCardSecondaryColor")} />
                  {errors.idCardSecondaryColor && (
                    <p className="text-xs text-destructive">{errors.idCardSecondaryColor.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>QR verification</Label>
                  <div className="flex h-9 items-center gap-2">
                    <Controller
                      control={control}
                      name="idCardQrVerificationEnabled"
                      render={({ field }) => (
                        <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
                      )}
                    />
                    <span className="text-sm text-muted-foreground">Enabled</span>
                  </div>
                </div>
              </div>
            </div>

            <Can anyOf={["settings:manage"]}>
              <Button type="submit" disabled={isSubmitting}>
                Save changes
              </Button>
            </Can>
          </form>
        </CardContent>
      </Card>

      <HolidaysCard />
    </div>
  );
}
