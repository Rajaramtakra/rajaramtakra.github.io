import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSalaryStructureSchema, type CreateSalaryStructureInput } from "@erp/shared";
import { Plus, Trash2 } from "lucide-react";
import { payrollApi } from "./payroll.api";
import { teacherApi, type TeacherRecord } from "@/modules/teachers/teacher.api";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface StaffOption {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
}

export function NewSalaryStructureDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [personType, setPersonType] = useState<"TEACHER" | "STAFF">("TEACHER");
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [staffLookupFailed, setStaffLookupFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    teacherApi
      .search({ pageSize: 100 })
      .then((res) => setTeachers(res.data))
      .catch(() => setTeachers([]));
    api
      .get<{ data: StaffOption[] }>("/hr/staff", { params: { pageSize: 100 } })
      .then((res) => setStaffOptions(res.data.data))
      .catch(() => setStaffLookupFailed(true));
  }, [open]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateSalaryStructureInput>({
    resolver: zodResolver(createSalaryStructureSchema),
    defaultValues: { allowances: [], deductions: [] },
  });

  const allowanceFields = useFieldArray({ control, name: "allowances" });
  const deductionFields = useFieldArray({ control, name: "deductions" });

  function handlePersonTypeChange(value: "TEACHER" | "STAFF") {
    setPersonType(value);
    setValue("teacherId", undefined);
    setValue("staffId", undefined);
  }

  async function onSubmit(values: CreateSalaryStructureInput) {
    try {
      await payrollApi.createStructure(values as never);
      toast({ title: "Salary structure created" });
      reset({ allowances: [], deductions: [] });
      setOpen(false);
      onCreated();
    } catch (err) {
      toast({ title: "Failed to create salary structure", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> New salary structure
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New salary structure</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Employee type</Label>
              <Select value={personType} onValueChange={(v) => handlePersonTypeChange(v as "TEACHER" | "STAFF")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEACHER">Teacher</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{personType === "TEACHER" ? "Teacher" : "Staff member"}</Label>
              {personType === "TEACHER" ? (
                <Select onValueChange={(v) => setValue("teacherId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.firstName} {t.lastName} ({t.employeeCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : staffLookupFailed ? (
                <Input placeholder="Staff member ID" onChange={(e) => setValue("staffId", e.target.value)} />
              ) : (
                <Select onValueChange={(v) => setValue("staffId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({s.employeeCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {(errors.teacherId || errors.staffId) && (
                <p className="text-xs text-destructive">Select exactly one employee</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Basic salary</Label>
            <Input type="number" step="0.01" {...register("basicSalary")} />
            {errors.basicSalary && <p className="text-xs text-destructive">{errors.basicSalary.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Allowances</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => allowanceFields.append({ name: "", amount: 0 })}
              >
                <Plus className="h-3.5 w-3.5" /> Add allowance
              </Button>
            </div>
            {allowanceFields.fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 rounded-md border border-border p-3">
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input {...register(`allowances.${index}.name`)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Amount</Label>
                  <Input type="number" step="0.01" {...register(`allowances.${index}.amount`)} />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => allowanceFields.remove(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Deductions</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => deductionFields.append({ name: "", amount: 0 })}
              >
                <Plus className="h-3.5 w-3.5" /> Add deduction
              </Button>
            </div>
            {deductionFields.fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 rounded-md border border-border p-3">
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input {...register(`deductions.${index}.name`)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Amount</Label>
                  <Input type="number" step="0.01" {...register(`deductions.${index}.amount`)} />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => deductionFields.remove(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              Create salary structure
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
