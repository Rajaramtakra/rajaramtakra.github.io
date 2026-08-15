import { useState } from "react";
import { Plus } from "lucide-react";
import { payrollApi } from "./payroll.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function NewPayrollRunDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [monthValue, setMonthValue] = useState(currentMonthValue());
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const [yearStr, monthStr] = monthValue.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!year || !month) {
      toast({ title: "Select a valid month and year", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const run = await payrollApi.createRun({ month, year });
      toast({ title: `Payroll run generated with ${run.payslips?.length ?? 0} payslip(s)` });
      setOpen(false);
      onCreated();
    } catch (err) {
      toast({ title: "Failed to generate payroll run", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> New payroll run
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate payroll run</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Month</Label>
          <Input type="month" value={monthValue} onChange={(e) => setMonthValue(e.target.value)} />
          <p className="text-xs text-muted-foreground">
            Generates one payslip for every active teacher/staff member who has a salary structure. Re-running for the
            same month while still in DRAFT recalculates payslips from the latest salary structures.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting}>
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
