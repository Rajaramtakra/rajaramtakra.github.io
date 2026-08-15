import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { issueOfferLetterSchema, type IssueOfferLetterInput } from "@erp/shared";
import { FileText } from "lucide-react";
import { hrApi } from "./hr.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function OfferLetterDialog({
  candidateApplicationId,
  onIssued,
}: {
  candidateApplicationId: string;
  onIssued: () => void;
}) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IssueOfferLetterInput>({ resolver: zodResolver(issueOfferLetterSchema) });

  async function onSubmit(values: IssueOfferLetterInput) {
    try {
      await hrApi.applications.issueOfferLetter(candidateApplicationId, values as never);
      toast({ title: "Offer letter generated" });
      reset();
      setOpen(false);
      onIssued();
    } catch (err) {
      toast({ title: "Failed to generate offer letter", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <FileText className="h-3.5 w-3.5" /> Generate offer letter
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate offer letter</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label>Position</Label>
            <Input {...register("position")} />
            {errors.position && <p className="text-xs text-destructive">{errors.position.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Salary offered</Label>
            <Input type="number" step="0.01" {...register("salaryOffered")} />
            {errors.salaryOffered && <p className="text-xs text-destructive">{errors.salaryOffered.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Joining date</Label>
            <Input type="date" {...register("joiningDate")} />
            {errors.joiningDate && <p className="text-xs text-destructive">{errors.joiningDate.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              Generate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
