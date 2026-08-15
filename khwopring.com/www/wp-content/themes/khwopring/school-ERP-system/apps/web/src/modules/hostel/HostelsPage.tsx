import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createHostelRoomSchema,
  createHostelSchema,
  type CreateHostelInput,
  type CreateHostelRoomInput,
} from "@erp/shared";
import { Plus, Search, UserMinus } from "lucide-react";
import { hostelApi, type HostelAllocationRecord, type HostelRecord } from "./hostel.api";
import { hrApi, type StaffMemberRecord } from "@/modules/hr/hr.api";
import { studentApi, type StudentRecord } from "@/modules/students/student.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Can } from "@/components/Can";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const NO_WARDEN = "NONE";

function NewHostelDialog({ staff, onCreated }: { staff: StaffMemberRecord[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateHostelInput>({ resolver: zodResolver(createHostelSchema) });

  async function onSubmit(values: CreateHostelInput) {
    try {
      await hostelApi.createHostel(values);
      toast({ title: "Hostel created" });
      reset();
      setOpen(false);
      onCreated();
    } catch (err) {
      toast({ title: "Failed to create hostel", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> New hostel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New hostel</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input placeholder="Boys Hostel A" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Address (optional)</Label>
            <Input {...register("address")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Total capacity</Label>
              <Input type="number" min={1} {...register("totalCapacity", { valueAsNumber: true })} />
              {errors.totalCapacity && <p className="text-xs text-destructive">{errors.totalCapacity.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Warden (optional)</Label>
              <Select onValueChange={(v) => setValue("wardenStaffId", v === NO_WARDEN ? undefined : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="No warden assigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_WARDEN}>No warden assigned</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
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
  );
}

function NewRoomDialog({ hostelId, onCreated }: { hostelId: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateHostelRoomInput>({
    resolver: zodResolver(createHostelRoomSchema),
    defaultValues: { hostelId },
  });

  async function onSubmit(values: CreateHostelRoomInput) {
    try {
      await hostelApi.createRoom({ ...values, hostelId });
      toast({ title: "Room added" });
      reset({ hostelId });
      setOpen(false);
      onCreated();
    } catch (err) {
      toast({ title: "Failed to add room", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4" /> New room
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New room</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Room number</Label>
              <Input placeholder="101" {...register("roomNumber")} />
              {errors.roomNumber && <p className="text-xs text-destructive">{errors.roomNumber.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Capacity</Label>
              <Input type="number" min={1} {...register("capacity", { valueAsNumber: true })} />
              {errors.capacity && <p className="text-xs text-destructive">{errors.capacity.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Room type (optional)</Label>
            <Input placeholder="Dormitory, Double, Single..." {...register("roomType")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              Add room
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function HostelsAndRoomsTab() {
  const [hostels, setHostels] = useState<HostelRecord[]>([]);
  const [staff, setStaff] = useState<StaffMemberRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    hostelApi
      .listHostels()
      .then((list) => {
        setHostels(list);
        if (!selectedId && list.length > 0) setSelectedId(list[0].id);
      })
      .finally(() => setLoading(false));
  }
  useEffect(reload, []);
  useEffect(() => {
    hrApi.staff.list({ pageSize: 200 }).then((r) => setStaff(r.data));
  }, []);

  const selected = hostels.find((h) => h.id === selectedId);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-semibold text-foreground">Hostels</CardTitle>
          <Can anyOf={["hostel:manage"]}>
            <NewHostelDialog staff={staff} onCreated={reload} />
          </Can>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            hostels.map((h) => {
              const occupied = h.rooms.reduce((sum, r) => sum + r.occupied, 0);
              return (
                <button
                  key={h.id}
                  onClick={() => setSelectedId(h.id)}
                  className={`w-full rounded-md border p-3 text-left text-sm transition-colors ${
                    selectedId === h.id ? "border-primary bg-accent" : "border-border hover:bg-accent/50"
                  }`}
                >
                  <p className="font-medium">{h.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {h.wardenStaff ? `Warden: ${h.wardenStaff.firstName} ${h.wardenStaff.lastName}` : "No warden"}
                  </p>
                  <Badge variant={occupied >= h.totalCapacity ? "destructive" : "secondary"} className="mt-1 text-[10px]">
                    {occupied}/{h.totalCapacity} occupied
                  </Badge>
                </button>
              );
            })
          )}
          {!loading && hostels.length === 0 && <p className="text-sm text-muted-foreground">No hostels yet.</p>}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-semibold text-foreground">
            {selected ? `Rooms — ${selected.name}` : "Rooms"}
          </CardTitle>
          {selected && (
            <Can anyOf={["hostel:manage"]}>
              <NewRoomDialog hostelId={selected.id} onCreated={reload} />
            </Can>
          )}
        </CardHeader>
        <CardContent>
          {!selected ? (
            <p className="text-sm text-muted-foreground">Select a hostel to view its rooms.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Occupancy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selected.rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.roomNumber}</TableCell>
                    <TableCell>{room.roomType ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant={room.occupied >= room.capacity ? "destructive" : "success"}>
                        {room.occupied}/{room.capacity}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {selected.rooms.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No rooms yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AllocationsTab() {
  const [hostels, setHostels] = useState<HostelRecord[]>([]);
  const [allocations, setAllocations] = useState<HostelAllocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomId, setRoomId] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<StudentRecord[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reload() {
    setLoading(true);
    hostelApi
      .listAllocations({ status: "ACTIVE" })
      .then(setAllocations)
      .finally(() => setLoading(false));
  }
  useEffect(reload, []);
  useEffect(() => {
    hostelApi.listHostels().then(setHostels);
  }, []);

  async function handleSearch() {
    if (!search.trim()) return;
    const res = await studentApi.search({ search, pageSize: 5, status: "ACTIVE" });
    setResults(res.data);
  }

  async function handleAllocate() {
    if (!roomId || !selectedStudent) return;
    setSubmitting(true);
    try {
      await hostelApi.createAllocation({ hostelRoomId: roomId, studentId: selectedStudent.id });
      toast({ title: "Student checked in" });
      setSelectedStudent(null);
      setRoomId("");
      reload();
    } catch (err) {
      toast({ title: "Failed to check in student", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCheckout(id: string) {
    try {
      await hostelApi.checkoutAllocation(id);
      toast({ title: "Student checked out" });
      reload();
    } catch (err) {
      toast({ title: "Failed to check out student", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <Can anyOf={["hostel:manage"]}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">Check in a student</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Student</Label>
                {selectedStudent ? (
                  <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                    <span>
                      {selectedStudent.firstName} {selectedStudent.lastName} ({selectedStudent.registrationNumber})
                    </span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-8"
                        placeholder="Search student..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                      />
                    </div>
                    {results.length > 0 && (
                      <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border border-border p-1">
                        {results.map((s) => (
                          <button
                            type="button"
                            key={s.id}
                            className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
                            onClick={() => {
                              setSelectedStudent(s);
                              setResults([]);
                            }}
                          >
                            {s.firstName} {s.lastName} ({s.registrationNumber})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Room</Label>
                <Select value={roomId} onValueChange={setRoomId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {hostels.map((h) => (
                      <div key={h.id}>
                        {h.rooms.map((r) => (
                          <SelectItem key={r.id} value={r.id} disabled={r.occupied >= r.capacity}>
                            {h.name} — {r.roomNumber} ({r.occupied}/{r.capacity})
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleAllocate} disabled={submitting || !roomId || !selectedStudent}>
              Check in
            </Button>
          </CardContent>
        </Card>
      </Can>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground">Current occupants</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Hostel</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Checked in</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      {a.student.firstName} {a.student.lastName}
                    </TableCell>
                    <TableCell>{a.hostelRoom.hostel.name}</TableCell>
                    <TableCell>{a.hostelRoom.roomNumber}</TableCell>
                    <TableCell>{new Date(a.checkInDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Can anyOf={["hostel:manage"]}>
                        <button onClick={() => handleCheckout(a.id)} className="text-destructive hover:opacity-70" aria-label="Check out">
                          <UserMinus className="h-4 w-4" />
                        </button>
                      </Can>
                    </TableCell>
                  </TableRow>
                ))}
                {allocations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No active hostel occupants.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function HostelsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hostel</h1>
        <p className="text-sm text-muted-foreground">
          Manage hostels, rooms, and student allocations. Hostel fees are billed through the Fees module.
        </p>
      </div>
      <Tabs defaultValue="hostels">
        <TabsList>
          <TabsTrigger value="hostels">Hostels &amp; Rooms</TabsTrigger>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
        </TabsList>
        <TabsContent value="hostels">
          <HostelsAndRoomsTab />
        </TabsContent>
        <TabsContent value="allocations">
          <AllocationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
