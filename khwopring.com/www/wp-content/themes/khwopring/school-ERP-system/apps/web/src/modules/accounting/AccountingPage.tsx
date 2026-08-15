import { Fragment, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createAccountSchema,
  createBankAccountSchema,
  createCashBookEntrySchema,
  createIncomeExpenseTypeSchema,
  type CreateAccountInput,
  type CreateBankAccountInput,
  type CreateCashBookEntryInput,
  type CreateIncomeExpenseTypeInput,
} from "@erp/shared";
import { Download, Plus } from "lucide-react";
import {
  accountingApi,
  type Account,
  type BankAccount,
  type CashBookEntry,
  type IncomeExpenseType,
  type JournalEntry,
} from "./accounting.api";
import { NewJournalEntryDialog } from "./NewJournalEntryDialog";
import { downloadBlob } from "@/modules/students/idCard.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Can } from "@/components/Can";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const ACCOUNT_TYPES = ["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"] as const;

const ACCOUNT_TYPE_VARIANT: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  ASSET: "success",
  LIABILITY: "warning",
  EQUITY: "secondary",
  INCOME: "default",
  EXPENSE: "destructive",
};

// =========================================================================
// Chart of Accounts
// =========================================================================

interface AccountNode extends Account {
  children: AccountNode[];
}

function buildAccountTree(accounts: Account[]): AccountNode[] {
  const nodes = new Map<string, AccountNode>(accounts.map((a) => [a.id, { ...a, children: [] }]));
  const roots: AccountNode[] = [];
  for (const node of nodes.values()) {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function AccountRows({ nodes, depth = 0 }: { nodes: AccountNode[]; depth?: number }) {
  return (
    <>
      {nodes.map((node) => (
        <Fragment key={node.id}>
          <TableRow>
            <TableCell style={{ paddingLeft: `${1 + depth * 1.5}rem` }} className="font-medium">
              {node.code}
            </TableCell>
            <TableCell>{node.name}</TableCell>
            <TableCell>
              <Badge variant={ACCOUNT_TYPE_VARIANT[node.type]}>{node.type}</Badge>
            </TableCell>
          </TableRow>
          {node.children.length > 0 && <AccountRows nodes={node.children} depth={depth + 1} />}
        </Fragment>
      ))}
    </>
  );
}

function ChartOfAccountsTab() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  function reload() {
    setLoading(true);
    accountingApi
      .listAccounts()
      .then(setAccounts)
      .finally(() => setLoading(false));
  }
  useEffect(reload, []);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAccountInput>({ resolver: zodResolver(createAccountSchema) });

  const tree = useMemo(() => buildAccountTree(accounts), [accounts]);

  async function onSubmit(values: CreateAccountInput) {
    try {
      await accountingApi.createAccount(values);
      toast({ title: "Account created" });
      reset();
      setOpen(false);
      reload();
    } catch (err) {
      toast({ title: "Failed to create account", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold text-foreground">Chart of Accounts</CardTitle>
        <Can anyOf={["accounting:manage"]}>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" /> New account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New account</DialogTitle>
              </DialogHeader>
              <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-1.5">
                  <Label>Code</Label>
                  <Input placeholder="1000" {...register("code")} />
                  {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input placeholder="Cash in hand" {...register("name")} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select onValueChange={(v) => setValue("type", v as CreateAccountInput["type"])}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Parent account (optional)</Label>
                  <Select onValueChange={(v) => setValue("parentId", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
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
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tree.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No accounts yet.
                  </TableCell>
                </TableRow>
              ) : (
                <AccountRows nodes={tree} />
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// =========================================================================
// Journal Entries
// =========================================================================

const VOUCHER_TYPE_VARIANT: Record<string, "default" | "secondary" | "success" | "warning"> = {
  JOURNAL: "secondary",
  PAYMENT: "warning",
  RECEIPT: "success",
  CONTRA: "default",
};

function JournalEntriesTab() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    accountingApi
      .listJournalEntries()
      .then(setEntries)
      .finally(() => setLoading(false));
  }
  useEffect(reload, []);

  async function handlePrint(entry: JournalEntry) {
    try {
      const blob = await accountingApi.downloadJournalEntryPdf(entry.id);
      downloadBlob(blob, `${entry.voucherNumber ?? entry.id}.pdf`);
    } catch (err) {
      toast({ title: "Failed to generate voucher PDF", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold text-foreground">Journal Entries &amp; Vouchers</CardTitle>
        <Can anyOf={["accounting:manage"]}>
          <div className="flex gap-2">
            <NewJournalEntryDialog
              onCreated={reload}
              defaultVoucherType="PAYMENT"
              trigger={
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" /> Payment voucher
                </Button>
              }
            />
            <NewJournalEntryDialog
              onCreated={reload}
              defaultVoucherType="RECEIPT"
              trigger={
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" /> Receipt voucher
                </Button>
              }
            />
            <NewJournalEntryDialog onCreated={reload} />
          </div>
        </Can>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Voucher</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Lines</TableHead>
                <TableHead>Total debit</TableHead>
                <TableHead>Total credit</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const totalDebit = entry.lines.reduce((sum, l) => sum + Number(l.debit), 0);
                const totalCredit = entry.lines.reduce((sum, l) => sum + Number(l.credit), 0);
                return (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.entryDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={VOUCHER_TYPE_VARIANT[entry.voucherType]} className="w-fit text-[10px]">
                          {entry.voucherType}
                        </Badge>
                        {entry.voucherNumber && <span className="text-xs text-muted-foreground">{entry.voucherNumber}</span>}
                      </div>
                    </TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {entry.lines.map((line) => (
                          <Badge key={line.id} variant="secondary">
                            {line.account.code}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{totalDebit.toFixed(2)}</TableCell>
                    <TableCell>{totalCredit.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handlePrint(entry)} aria-label="Print voucher">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No journal entries posted yet.
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

// =========================================================================
// Income / Expense Types
// =========================================================================

function NewIncomeExpenseTypeDialog({ accounts, onCreated }: { accounts: Account[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateIncomeExpenseTypeInput>({ resolver: zodResolver(createIncomeExpenseTypeSchema) });

  async function onSubmit(values: CreateIncomeExpenseTypeInput) {
    try {
      await accountingApi.createIncomeExpenseType(values);
      toast({ title: "Income/expense type created" });
      reset();
      setOpen(false);
      onCreated();
    } catch (err) {
      toast({ title: "Failed to create type", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> New type
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New income/expense type</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input placeholder="Tuition Fee, Stationery..." {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Kind</Label>
            <Select onValueChange={(v) => setValue("kind", v as CreateIncomeExpenseTypeInput["kind"])}>
              <SelectTrigger>
                <SelectValue placeholder="Select kind" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCOME">Income</SelectItem>
                <SelectItem value="EXPENSE">Expense</SelectItem>
              </SelectContent>
            </Select>
            {errors.kind && <p className="text-xs text-destructive">{errors.kind.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Linked ledger account (optional)</Label>
            <Select onValueChange={(v) => setValue("accountId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
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
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function IncomeExpenseTypesTab() {
  const [types, setTypes] = useState<IncomeExpenseType[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    accountingApi
      .listIncomeExpenseTypes()
      .then(setTypes)
      .finally(() => setLoading(false));
  }
  useEffect(() => {
    reload();
    accountingApi.listAccounts().then(setAccounts);
  }, []);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold text-foreground">Income &amp; Expense Types</CardTitle>
        <Can anyOf={["accounting:manage"]}>
          <NewIncomeExpenseTypeDialog accounts={accounts} onCreated={reload} />
        </Can>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Linked account</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>
                    <Badge variant={t.kind === "INCOME" ? "success" : "warning"}>{t.kind}</Badge>
                  </TableCell>
                  <TableCell>{t.account ? `${t.account.code} · ${t.account.name}` : "-"}</TableCell>
                </TableRow>
              ))}
              {types.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No income/expense types defined yet.
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

// =========================================================================
// Cash Book & Bank Accounts
// =========================================================================

function NewCashBookEntryDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCashBookEntryInput>({ resolver: zodResolver(createCashBookEntrySchema) });

  async function onSubmit(values: CreateCashBookEntryInput) {
    try {
      await accountingApi.createCashBookEntry(values);
      toast({ title: "Cash book entry recorded" });
      reset();
      setOpen(false);
      onCreated();
    } catch (err) {
      toast({ title: "Failed to record entry", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> New cash book entry
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New cash book entry</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" {...register("date")} />
            {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input {...register("description")} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Debit</Label>
              <Input type="number" step="0.01" min="0" {...register("debit", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label>Credit</Label>
              <Input type="number" step="0.01" min="0" {...register("credit", { valueAsNumber: true })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NewBankAccountDialog({ accounts, onCreated }: { accounts: Account[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateBankAccountInput>({ resolver: zodResolver(createBankAccountSchema) });

  async function onSubmit(values: CreateBankAccountInput) {
    try {
      await accountingApi.createBankAccount(values);
      toast({ title: "Bank account added" });
      reset();
      setOpen(false);
      onCreated();
    } catch (err) {
      toast({ title: "Failed to add bank account", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4" /> New bank account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New bank account</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label>Bank name</Label>
            <Input {...register("bankName")} />
            {errors.bankName && <p className="text-xs text-destructive">{errors.bankName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Account number</Label>
            <Input {...register("accountNumber")} />
            {errors.accountNumber && <p className="text-xs text-destructive">{errors.accountNumber.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Linked ledger account</Label>
            <Select onValueChange={(v) => setValue("accountId", v)}>
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
            {errors.accountId && <p className="text-xs text-destructive">{errors.accountId.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CashBookAndBankTab() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [cashBook, setCashBook] = useState<CashBookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  function reloadCashBook() {
    setLoading(true);
    accountingApi
      .listCashBookEntries({ startDate: startDate || undefined, endDate: endDate || undefined })
      .then(setCashBook)
      .finally(() => setLoading(false));
  }
  function reloadBankAccounts() {
    accountingApi.listBankAccounts().then(setBankAccounts);
  }

  useEffect(() => {
    accountingApi.listAccounts().then(setAccounts);
    reloadBankAccounts();
    reloadCashBook();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-semibold text-foreground">Cash Book</CardTitle>
          <Can anyOf={["accounting:manage"]}>
            <NewCashBookEntryDialog onCreated={reloadCashBook} />
          </Can>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <Label className="text-xs">From</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">To</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <Button variant="outline" size="sm" onClick={reloadCashBook}>
              Apply filter
            </Button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Debit</TableHead>
                  <TableHead>Credit</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashBook.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell>{Number(entry.debit).toFixed(2)}</TableCell>
                    <TableCell>{Number(entry.credit).toFixed(2)}</TableCell>
                    <TableCell className="font-medium">{Number(entry.balance).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {cashBook.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No cash book entries for this range.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-semibold text-foreground">Bank Accounts</CardTitle>
          <Can anyOf={["accounting:manage"]}>
            <NewBankAccountDialog accounts={accounts} onCreated={reloadBankAccounts} />
          </Can>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bank name</TableHead>
                <TableHead>Account number</TableHead>
                <TableHead>Linked ledger account</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bankAccounts.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.bankName}</TableCell>
                  <TableCell>{b.accountNumber}</TableCell>
                  <TableCell>
                    {b.account.code} &middot; {b.account.name}
                  </TableCell>
                </TableRow>
              ))}
              {bankAccounts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No bank accounts yet.
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

// =========================================================================
// Page
// =========================================================================

export function AccountingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Accounting</h1>
        <p className="text-sm text-muted-foreground">Chart of accounts, journal entries, and cash/bank ledgers.</p>
      </div>
      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="journal">Journal Entries &amp; Vouchers</TabsTrigger>
          <TabsTrigger value="cashbook">Cash Book &amp; Bank Accounts</TabsTrigger>
          <TabsTrigger value="income-expense-types">Income &amp; Expense Types</TabsTrigger>
        </TabsList>
        <TabsContent value="accounts">
          <ChartOfAccountsTab />
        </TabsContent>
        <TabsContent value="journal">
          <JournalEntriesTab />
        </TabsContent>
        <TabsContent value="cashbook">
          <CashBookAndBankTab />
        </TabsContent>
        <TabsContent value="income-expense-types">
          <IncomeExpenseTypesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
