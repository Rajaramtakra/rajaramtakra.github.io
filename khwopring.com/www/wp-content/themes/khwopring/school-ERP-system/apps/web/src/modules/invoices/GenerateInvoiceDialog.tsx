import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Plus, Search, Trash2 } from "lucide-react";
import { invoiceApi } from "./invoice.api";
import { feeApi, type FeeStructure } from "@/modules/fees/fee.api";
import { academicApi, type AcademicSession } from "@/modules/academic/academic.api";
import { studentApi, type StudentRecord } from "@/modules/students/student.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function money(value: number | string) {
  return Number(value).toFixed(2);
}

interface InstallmentFormValues {
  dueDate: string;
  installments: { dueDate: string; amount: number }[];
}

export function GenerateInvoiceDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);

  const [studentId, setStudentId] = useState("");
  const [studentLabel, setStudentLabel] = useState("");
  const [studentTerm, setStudentTerm] = useState("");
  const [studentResults, setStudentResults] = useState<StudentRecord[]>([]);

  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [academicSessionId, setAcademicSessionId] = useState("");
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [feeStructureIds, setFeeStructureIds] = useState<string[]>([]);

  const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm<InstallmentFormValues>({
    defaultValues: { dueDate: "", installments: [] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "installments" });

  useEffect(() => {
    if (!open) return;
    academicApi.listSessions().then(setSessions);
  }, [open]);

  useEffect(() => {
    if (!studentTerm.trim()) {
      setStudentResults([]);
      return;
    }
    const handle = setTimeout(() => {
      studentApi.search({ search: studentTerm, pageSize: 5 }).then((res) => setStudentResults(res.data));
    }, 300);
    return () => clearTimeout(handle);
  }, [studentTerm]);

  useEffect(() => {
    setFeeStructureIds([]);
    if (!academicSessionId) {
      setStructures([]);
      return;
    }
    feeApi.listStructures({ academicSessionId }).then(setStructures);
  }, [academicSessionId]);

  function resetAll() {
    reset({ dueDate: "", installments: [] });
    setStudentId("");
    setStudentLabel("");
    setStudentTerm("");
    setStudentResults([]);
    setAcademicSessionId("");
    setStructures([]);
    setFeeStructureIds([]);
  }

  function toggleStructure(id: string) {
    setFeeStructureIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const selectedTotal = structures
    .filter((s) => feeStructureIds.includes(s.id))
    .reduce((sum, s) => sum + Number(s.amount), 0);

  async function onSubmit(values: InstallmentFormValues) {
    if (!studentId) {
      toast({ title: "Select a student first", variant: "destructive" });
      return;
    }
    if (!academicSessionId) {
      toast({ title: "Select an academic session first", variant: "destructive" });
      return;
    }
    if (feeStructureIds.length === 0) {
      toast({ title: "Select at least one fee structure", variant: "destructive" });
      return;
    }
    try {
      const invoice = await invoiceApi.generate({
        studentId,
        academicSessionId,
        dueDate: values.dueDate,
        feeStructureIds,
        installments:
          values.installments.length > 0
            ? values.installments.map((i) => ({ dueDate: i.dueDate, amount: Number(i.amount) }))
            : undefined,
      });
      toast({ title: "Invoice generated", description: `Invoice #${invoice.invoiceNumber}` });
      resetAll();
      setOpen(false);
      onCreated();
    } catch (err) {
      toast({ title: "Failed to generate invoice", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetAll();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> Generate invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate invoice</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label>Student</Label>
            {studentId ? (
              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                <span className="font-medium">{studentLabel}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    setStudentId("");
                    setStudentLabel("");
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Search student by name or registration number..."
                    value={studentTerm}
                    onChange={(e) => setStudentTerm(e.target.value)}
                  />
                </div>
                {studentResults.length > 0 && (
                  <div className="rounded-md border border-border">
                    {studentResults.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                        onClick={() => {
                          setStudentId(s.id);
                          setStudentLabel(`${s.firstName} ${s.lastName} (${s.registrationNumber})`);
                          setStudentTerm("");
                          setStudentResults([]);
                        }}
                      >
                        <span>
                          {s.firstName} {s.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">{s.registrationNumber}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Academic session</Label>
              <Select value={academicSessionId} onValueChange={setAcademicSessionId}>
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
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input type="date" {...register("dueDate", { required: true })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Fee structures</Label>
            {academicSessionId ? (
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                {structures.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border"
                      checked={feeStructureIds.includes(s.id)}
                      onChange={() => toggleStructure(s.id)}
                    />
                    <span className="flex-1">
                      {s.class.name} - {s.feeCategory.name}
                    </span>
                    <span className="text-muted-foreground">{money(s.amount)}</span>
                  </label>
                ))}
                {structures.length === 0 && (
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">No fee structures for this session.</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Select an academic session to see available fee structures.</p>
            )}
            {feeStructureIds.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Selected gross amount: {money(selectedTotal)} (final total may differ after discounts/scholarships).
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Installment schedule (optional)</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ dueDate: "", amount: 0 })}>
                <Plus className="h-3.5 w-3.5" /> Add installment
              </Button>
            </div>
            {fields.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Installment amounts must add up to the final invoice total (calculated after discounts/scholarships are
                applied). Leave empty to invoice the full amount as a single payment.
              </p>
            )}
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 rounded-md border border-border p-3">
                <div className="space-y-1">
                  <Label className="text-xs">Due date</Label>
                  <Input type="date" {...register(`installments.${index}.dueDate`, { required: true })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`installments.${index}.amount`, { required: true, valueAsNumber: true })}
                  />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              Generate invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
