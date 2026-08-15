import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createJournalEntrySchema, type CreateJournalEntryInput } from "@erp/shared";
import { Plus, Trash2 } from "lucide-react";
import { accountingApi, type Account } from "./accounting.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const EMPTY_LINE = { accountId: "", debit: 0, credit: 0 };
const VOUCHER_TYPES = ["JOURNAL", "PAYMENT", "RECEIPT", "CONTRA"] as const;
const VOUCHER_TYPE_LABEL: Record<(typeof VOUCHER_TYPES)[number], string> = {
  JOURNAL: "General Journal Entry",
  PAYMENT: "Payment Voucher",
  RECEIPT: "Receipt Voucher",
  CONTRA: "Contra Voucher",
};

export function NewJournalEntryDialog({
  onCreated,
  defaultVoucherType = "JOURNAL",
  trigger,
}: {
  onCreated: () => void;
  defaultVoucherType?: (typeof VOUCHER_TYPES)[number];
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    if (!open) return;
    accountingApi.listAccounts().then(setAccounts);
  }, [open]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateJournalEntryInput>({
    resolver: zodResolver(createJournalEntrySchema),
    defaultValues: {
      description: "",
      reference: "",
      voucherType: defaultVoucherType,
      lines: [{ ...EMPTY_LINE }, { ...EMPTY_LINE }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const lines = watch("lines");
  const totalDebit = (lines ?? []).reduce((sum, l) => sum + (Number(l?.debit) || 0), 0);
  const totalCredit = (lines ?? []).reduce((sum, l) => sum + (Number(l?.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.005 && totalDebit > 0;

  async function onSubmit(values: CreateJournalEntryInput) {
    try {
      await accountingApi.createJournalEntry(values);
      toast({ title: "Entry posted" });
      reset({ description: "", reference: "", voucherType: defaultVoucherType, lines: [{ ...EMPTY_LINE }, { ...EMPTY_LINE }] });
      setOpen(false);
      onCreated();
    } catch (err) {
      toast({ title: "Failed to post entry", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4" /> New journal entry
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>New {VOUCHER_TYPE_LABEL[watch("voucherType") ?? defaultVoucherType].toLowerCase()}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Voucher type</Label>
              <Select value={watch("voucherType")} onValueChange={(v) => setValue("voucherType", v as CreateJournalEntryInput["voucherType"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOUCHER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {VOUCHER_TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Entry date</Label>
              <Input type="date" {...register("entryDate")} />
              {errors.entryDate && <p className="text-xs text-destructive">{errors.entryDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Reference (optional)</Label>
              <Input placeholder="INV-1042" {...register("reference")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input {...register("description")} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Lines</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ ...EMPTY_LINE })}>
                <Plus className="h-3.5 w-3.5" /> Add line
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[2fr_1fr_1fr_auto] items-end gap-2 rounded-md border border-border p-3">
                <div className="space-y-1">
                  <Label className="text-xs">Account</Label>
                  <Select
                    defaultValue={field.accountId || undefined}
                    onValueChange={(v) => setValue(`lines.${index}.accountId`, v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.code} &middot; {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Debit</Label>
                  <Input type="number" step="0.01" min="0" {...register(`lines.${index}.debit`, { valueAsNumber: true })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Credit</Label>
                  <Input type="number" step="0.01" min="0" {...register(`lines.${index}.credit`, { valueAsNumber: true })} />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={fields.length === 2}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {errors.lines?.message && <p className="text-xs text-destructive">{errors.lines.message}</p>}
          </div>

          <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 p-3 text-sm">
            <div className="flex gap-6">
              <span>
                Total debit: <span className="font-semibold">{totalDebit.toFixed(2)}</span>
              </span>
              <span>
                Total credit: <span className="font-semibold">{totalCredit.toFixed(2)}</span>
              </span>
            </div>
            <Badge variant={isBalanced ? "success" : "warning"}>{isBalanced ? "Balanced" : "Not balanced"}</Badge>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || !isBalanced}>
              Post entry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
