import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Search } from "lucide-react";
import { feeApi, type Discount, type FeeCategory, type FeeStructure, type Fine, type Scholarship } from "./fee.api";
import { academicApi, type AcademicSession, type ClassRecord } from "@/modules/academic/academic.api";
import { studentApi, type StudentRecord } from "@/modules/students/student.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Can } from "@/components/Can";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function money(value: number | string) {
  return Number(value).toFixed(2);
}

/** Minimal inline "search then pick" field for choosing a student, since no combobox primitive exists yet. */
function StudentField({
  studentId,
  studentLabel,
  onSelect,
}: {
  studentId: string;
  studentLabel: string;
  onSelect: (id: string, label: string) => void;
}) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<StudentRecord[]>([]);

  useEffect(() => {
    if (!term.trim()) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      studentApi.search({ search: term, pageSize: 5 }).then((res) => setResults(res.data));
    }, 300);
    return () => clearTimeout(handle);
  }, [term]);

  if (studentId) {
    return (
      <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
        <span className="font-medium">{studentLabel}</span>
        <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => onSelect("", "")}>
          Change
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Search student by name or registration number..."
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>
      {results.length > 0 && (
        <div className="rounded-md border border-border">
          {results.map((s) => (
            <button
              type="button"
              key={s.id}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
              onClick={() => {
                onSelect(s.id, `${s.firstName} ${s.lastName} (${s.registrationNumber})`);
                setTerm("");
                setResults([]);
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
  );
}

function CategoriesTab() {
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{ name: string; description?: string }>();

  function reload() {
    feeApi.listCategories().then(setCategories);
  }
  useEffect(reload, []);

  async function onSubmit(values: { name: string; description?: string }) {
    try {
      await feeApi.createCategory(values);
      toast({ title: "Fee category created" });
      reset();
      setOpen(false);
      reload();
    } catch (err) {
      toast({ title: "Failed to create category", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold text-foreground">Fee Categories</CardTitle>
        <Can anyOf={["fee:manage"]}>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" /> New category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New fee category</DialogTitle>
              </DialogHeader>
              <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input placeholder="Tuition Fee" {...register("name", { required: true })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea placeholder="Optional description" {...register("description")} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </Can>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.description ?? "-"}</TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground">
                  No fee categories yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function StructuresTab() {
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [classFilter, setClassFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<{ classId: string; feeCategoryId: string; academicSessionId: string; amount: number; frequency: string }>();

  function reload(filter = classFilter) {
    feeApi.listStructures(filter !== "all" ? { classId: filter } : undefined).then(setStructures);
  }
  useEffect(() => {
    feeApi.listCategories().then(setCategories);
    academicApi.listClasses().then(setClasses);
    academicApi.listSessions().then(setSessions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    reload(classFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classFilter]);

  async function onSubmit(values: { classId: string; feeCategoryId: string; academicSessionId: string; amount: number; frequency: string }) {
    try {
      await feeApi.createStructure({ ...values, amount: Number(values.amount) });
      toast({ title: "Fee structure created" });
      reset();
      setOpen(false);
      reload();
    } catch (err) {
      toast({ title: "Failed to create fee structure", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  const orderedClasses = [...classes].sort((a, b) => a.order - b.order);
  const groups = orderedClasses
    .map((cls) => ({ cls, items: structures.filter((s) => s.classId === cls.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold text-foreground">Fee Structures</CardTitle>
        <Can anyOf={["fee:manage"]}>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" /> New fee structure
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New fee structure</DialogTitle>
              </DialogHeader>
              <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-1.5">
                  <Label>Class</Label>
                  <Select onValueChange={(v) => setValue("classId", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Fee category</Label>
                  <Select onValueChange={(v) => setValue("feeCategoryId", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Academic session</Label>
                  <Select onValueChange={(v) => setValue("academicSessionId", v)}>
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Amount</Label>
                    <Input type="number" step="0.01" {...register("amount", { required: true, valueAsNumber: true })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Frequency</Label>
                    <Select onValueChange={(v) => setValue("frequency", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {["ONE_TIME", "MONTHLY", "QUARTERLY", "ANNUAL"].map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </Can>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Filter by class</Label>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {orderedClasses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {structures.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">No fee structures yet.</p>
        )}

        {groups.map(({ cls, items }) => (
          <div key={cls.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">{cls.name}</h3>
              <Badge variant="secondary">
                {items.length} {items.length === 1 ? "fee" : "fees"}
              </Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.feeCategory.name}</TableCell>
                    <TableCell>{s.academicSession.name}</TableCell>
                    <TableCell>{money(s.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{s.frequency}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DiscountsScholarshipsTab() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);

  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountStudentId, setDiscountStudentId] = useState("");
  const [discountStudentLabel, setDiscountStudentLabel] = useState("");
  const discountForm = useForm<{ feeStructureId?: string; type: string; value: number; reason: string }>();

  const [scholarshipOpen, setScholarshipOpen] = useState(false);
  const [scholarshipStudentId, setScholarshipStudentId] = useState("");
  const [scholarshipStudentLabel, setScholarshipStudentLabel] = useState("");
  const scholarshipForm = useForm<{ name: string; amount: number; academicSessionId: string }>();

  function reload() {
    feeApi.listDiscounts().then(setDiscounts);
    feeApi.listScholarships().then(setScholarships);
  }
  useEffect(() => {
    reload();
    feeApi.listStructures().then(setStructures);
    academicApi.listSessions().then(setSessions);
  }, []);

  async function onCreateDiscount(values: { feeStructureId?: string; type: string; value: number; reason: string }) {
    if (!discountStudentId) {
      toast({ title: "Select a student first", variant: "destructive" });
      return;
    }
    try {
      await feeApi.createDiscount({ ...values, value: Number(values.value), studentId: discountStudentId });
      toast({ title: "Discount created" });
      discountForm.reset();
      setDiscountStudentId("");
      setDiscountStudentLabel("");
      setDiscountOpen(false);
      reload();
    } catch (err) {
      toast({ title: "Failed to create discount", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  async function onCreateScholarship(values: { name: string; amount: number; academicSessionId: string }) {
    if (!scholarshipStudentId) {
      toast({ title: "Select a student first", variant: "destructive" });
      return;
    }
    try {
      await feeApi.createScholarship({ ...values, amount: Number(values.amount), studentId: scholarshipStudentId });
      toast({ title: "Scholarship created" });
      scholarshipForm.reset();
      setScholarshipStudentId("");
      setScholarshipStudentLabel("");
      setScholarshipOpen(false);
      reload();
    } catch (err) {
      toast({ title: "Failed to create scholarship", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-semibold text-foreground">Discounts</CardTitle>
          <Can anyOf={["discount:approve"]}>
            <Dialog
              open={discountOpen}
              onOpenChange={(v) => {
                setDiscountOpen(v);
                if (!v) {
                  setDiscountStudentId("");
                  setDiscountStudentLabel("");
                }
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4" /> New discount
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New discount</DialogTitle>
                </DialogHeader>
                <form className="space-y-3" onSubmit={discountForm.handleSubmit(onCreateDiscount)}>
                  <div className="space-y-1.5">
                    <Label>Student</Label>
                    <StudentField
                      studentId={discountStudentId}
                      studentLabel={discountStudentLabel}
                      onSelect={(id, label) => {
                        setDiscountStudentId(id);
                        setDiscountStudentLabel(label);
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Fee structure (optional, applies to all if empty)</Label>
                    <Select onValueChange={(v) => discountForm.setValue("feeStructureId", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any fee structure" />
                      </SelectTrigger>
                      <SelectContent>
                        {structures.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.class.name} - {s.feeCategory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Type</Label>
                      <Select onValueChange={(v) => discountForm.setValue("type", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENT">Percent</SelectItem>
                          <SelectItem value="FIXED">Fixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Value</Label>
                      <Input type="number" step="0.01" {...discountForm.register("value", { required: true, valueAsNumber: true })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Reason</Label>
                    <Textarea {...discountForm.register("reason", { required: true })} />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={discountForm.formState.isSubmitting}>
                      Create
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </Can>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fee structure</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discounts.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.feeStructure ? d.feeStructure.feeCategory.name : "All"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{d.type}</Badge>
                  </TableCell>
                  <TableCell>{d.type === "PERCENT" ? `${money(d.value)}%` : money(d.value)}</TableCell>
                  <TableCell className="text-muted-foreground">{d.reason}</TableCell>
                </TableRow>
              ))}
              {discounts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No discounts yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-semibold text-foreground">Scholarships</CardTitle>
          <Can anyOf={["discount:approve"]}>
            <Dialog
              open={scholarshipOpen}
              onOpenChange={(v) => {
                setScholarshipOpen(v);
                if (!v) {
                  setScholarshipStudentId("");
                  setScholarshipStudentLabel("");
                }
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4" /> New scholarship
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New scholarship</DialogTitle>
                </DialogHeader>
                <form className="space-y-3" onSubmit={scholarshipForm.handleSubmit(onCreateScholarship)}>
                  <div className="space-y-1.5">
                    <Label>Student</Label>
                    <StudentField
                      studentId={scholarshipStudentId}
                      studentLabel={scholarshipStudentLabel}
                      onSelect={(id, label) => {
                        setScholarshipStudentId(id);
                        setScholarshipStudentLabel(label);
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Name</Label>
                    <Input placeholder="Merit Scholarship" {...scholarshipForm.register("name", { required: true })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Amount</Label>
                    <Input type="number" step="0.01" {...scholarshipForm.register("amount", { required: true, valueAsNumber: true })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Academic session</Label>
                    <Select onValueChange={(v) => scholarshipForm.setValue("academicSessionId", v)}>
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
                  <DialogFooter>
                    <Button type="submit" disabled={scholarshipForm.formState.isSubmitting}>
                      Create
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </Can>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scholarships.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{money(s.amount)}</TableCell>
                </TableRow>
              ))}
              {scholarships.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No scholarships yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

const FINE_STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  PENDING: "warning",
  PAID: "success",
  WAIVED: "secondary",
};

function FinesTab() {
  const [fines, setFines] = useState<Fine[]>([]);
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [studentLabel, setStudentLabel] = useState("");
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{ reason: string; amount: number }>();

  function reload() {
    feeApi.listFines().then(setFines);
  }
  useEffect(reload, []);

  async function onSubmit(values: { reason: string; amount: number }) {
    if (!studentId) {
      toast({ title: "Select a student first", variant: "destructive" });
      return;
    }
    try {
      await feeApi.createFine({ ...values, amount: Number(values.amount), studentId });
      toast({ title: "Fine created" });
      reset();
      setStudentId("");
      setStudentLabel("");
      setOpen(false);
      reload();
    } catch (err) {
      toast({ title: "Failed to create fine", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  async function handleWaive(id: string) {
    try {
      await feeApi.waiveFine(id);
      toast({ title: "Fine waived" });
      reload();
    } catch (err) {
      toast({ title: "Failed to waive fine", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  async function handleMarkPaid(id: string) {
    try {
      await feeApi.markFinePaid(id);
      toast({ title: "Fine marked as paid" });
      reload();
    } catch (err) {
      toast({ title: "Failed to update fine", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold text-foreground">Fines</CardTitle>
        <Can anyOf={["fee:manage"]}>
          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) {
                setStudentId("");
                setStudentLabel("");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" /> New fine
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New fine</DialogTitle>
              </DialogHeader>
              <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-1.5">
                  <Label>Student</Label>
                  <StudentField
                    studentId={studentId}
                    studentLabel={studentLabel}
                    onSelect={(id, label) => {
                      setStudentId(id);
                      setStudentLabel(label);
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Reason</Label>
                  <Textarea {...register("reason", { required: true })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Amount</Label>
                  <Input type="number" step="0.01" {...register("amount", { required: true, valueAsNumber: true })} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </Can>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reason</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fines.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.reason}</TableCell>
                <TableCell>{money(f.amount)}</TableCell>
                <TableCell>
                  <Badge variant={FINE_STATUS_VARIANT[f.status]}>{f.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {f.status === "PENDING" && (
                    <Can anyOf={["fee:manage"]}>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleMarkPaid(f.id)}>
                          Mark paid
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleWaive(f.id)}>
                          Waive
                        </Button>
                      </div>
                    </Can>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {fines.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No fines recorded.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function FeeSetupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Fee Setup</h1>
        <p className="text-sm text-muted-foreground">
          Manage fee categories, class fee structures, discounts, scholarships, and fines.
        </p>
      </div>
      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="structures">Fee Structures</TabsTrigger>
          <TabsTrigger value="discounts">Discounts &amp; Scholarships</TabsTrigger>
          <TabsTrigger value="fines">Fines</TabsTrigger>
        </TabsList>
        <TabsContent value="categories">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="structures">
          <StructuresTab />
        </TabsContent>
        <TabsContent value="discounts">
          <DiscountsScholarshipsTab />
        </TabsContent>
        <TabsContent value="fines">
          <FinesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
