import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createStudentRequestSchema, type CreateStudentRequestInput } from "@erp/shared";
import { Plus, Search } from "lucide-react";
import { receptionApi } from "./reception.api";
import { studentApi, type StudentRecord } from "@/modules/students/student.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function NewStudentRequestDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<StudentRecord[]>([]);
  const [selected, setSelected] = useState<StudentRecord | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateStudentRequestInput>({ resolver: zodResolver(createStudentRequestSchema) });

  async function handleSearch() {
    if (!search.trim()) return;
    const res = await studentApi.search({ search, pageSize: 5 });
    setResults(res.data);
  }

  function pickStudent(student: StudentRecord) {
    setSelected(student);
    setValue("studentId", student.id);
    setResults([]);
  }

  async function onSubmit(values: CreateStudentRequestInput) {
    try {
      await receptionApi.createStudentRequest(values as never);
      toast({ title: "Request logged" });
      reset();
      setSelected(null);
      setOpen(false);
      onCreated();
    } catch (err) {
      toast({ title: "Failed to log request", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> New request
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a student/parent request</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label>Student</Label>
            {selected ? (
              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                <span>
                  {selected.firstName} {selected.lastName} ({selected.registrationNumber})
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(null)}>
                  Change
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Search by name or registration no."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                  />
                </div>
                {results.length > 0 && (
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-1">
                    {results.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                        onClick={() => pickStudent(s)}
                      >
                        {s.firstName} {s.lastName} ({s.registrationNumber})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {errors.studentId && <p className="text-xs text-destructive">Please select a student</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Input placeholder="Bonafide certificate, fee concession, complaint..." {...register("category")} />
            {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Input {...register("subject")} />
            {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea {...register("description")} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || !selected}>
              Log request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
