import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createDriverSchema,
  createVehicleSchema,
  type CreateDriverInput,
  type CreateVehicleInput,
} from "@erp/shared";
import { Plus, Trash2 } from "lucide-react";
import { transportApi, type Driver, type FuelLog, type Vehicle } from "./transport.api";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const VEHICLE_TYPES = ["BUS", "VAN", "CAR", "OTHER"] as const;
const NO_DRIVER = "NONE";

function NewVehicleDialog({ drivers, onCreated }: { drivers: Driver[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateVehicleInput>({
    resolver: zodResolver(createVehicleSchema),
    defaultValues: { type: "BUS" },
  });

  async function onSubmit(values: CreateVehicleInput) {
    try {
      await transportApi.createVehicle(values);
      toast({ title: "Vehicle added" });
      reset({ type: "BUS" });
      setOpen(false);
      onCreated();
    } catch (err) {
      toast({ title: "Failed to add vehicle", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> New vehicle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New vehicle</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label>Registration number</Label>
            <Input placeholder="KA-01-AB-1234" {...register("registrationNumber")} />
            {errors.registrationNumber && <p className="text-xs text-destructive">{errors.registrationNumber.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select defaultValue="BUS" onValueChange={(v) => setValue("type", v as CreateVehicleInput["type"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Capacity</Label>
              <Input type="number" placeholder="40" {...register("capacity", { valueAsNumber: true })} />
              {errors.capacity && <p className="text-xs text-destructive">{errors.capacity.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Driver (optional)</Label>
            <Select onValueChange={(v) => setValue("driverId", v === NO_DRIVER ? undefined : v)}>
              <SelectTrigger>
                <SelectValue placeholder="No driver assigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_DRIVER}>No driver assigned</SelectItem>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.fullName}
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

function NewDriverDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateDriverInput>({ resolver: zodResolver(createDriverSchema) });

  async function onSubmit(values: CreateDriverInput) {
    try {
      await transportApi.createDriver(values);
      toast({ title: "Driver added" });
      reset();
      setOpen(false);
      onCreated();
    } catch (err) {
      toast({ title: "Failed to add driver", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" /> New driver
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New driver</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input {...register("fullName")} />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input {...register("phone")} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>License number</Label>
            <Input {...register("licenseNumber")} />
            {errors.licenseNumber && <p className="text-xs text-destructive">{errors.licenseNumber.message}</p>}
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

function VehiclesTab() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    Promise.all([transportApi.listVehicles(), transportApi.listDrivers()])
      .then(([v, d]) => {
        setVehicles(v);
        setDrivers(d);
      })
      .finally(() => setLoading(false));
  }
  useEffect(reload, []);

  async function handleDelete(id: string) {
    try {
      await transportApi.deleteVehicle(id);
      toast({ title: "Vehicle removed" });
      reload();
    } catch (err) {
      toast({ title: "Failed to remove vehicle", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold text-foreground">Vehicles</CardTitle>
        <Can anyOf={["transport:manage"]}>
          <NewVehicleDialog drivers={drivers} onCreated={reload} />
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
                <TableHead>Registration #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Driver</TableHead>
                <Can anyOf={["transport:manage"]}>
                  <TableHead className="w-10" />
                </Can>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.registrationNumber}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{vehicle.type}</Badge>
                  </TableCell>
                  <TableCell>{vehicle.capacity}</TableCell>
                  <TableCell>{vehicle.driver?.fullName ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                  <Can anyOf={["transport:manage"]}>
                    <TableCell>
                      <button
                        onClick={() => handleDelete(vehicle.id)}
                        className="text-destructive hover:opacity-70"
                        aria-label="Remove vehicle"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </Can>
                </TableRow>
              ))}
              {vehicles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No vehicles yet.
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

function DriversTab() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    transportApi
      .listDrivers()
      .then(setDrivers)
      .finally(() => setLoading(false));
  }
  useEffect(reload, []);

  async function handleDelete(id: string) {
    try {
      await transportApi.deleteDriver(id);
      toast({ title: "Driver removed" });
      reload();
    } catch (err) {
      toast({ title: "Failed to remove driver", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold text-foreground">Drivers</CardTitle>
        <Can anyOf={["transport:manage"]}>
          <NewDriverDialog onCreated={reload} />
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
                <TableHead>Full name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>License #</TableHead>
                <Can anyOf={["transport:manage"]}>
                  <TableHead className="w-10" />
                </Can>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium">{driver.fullName}</TableCell>
                  <TableCell>{driver.phone}</TableCell>
                  <TableCell>{driver.licenseNumber}</TableCell>
                  <Can anyOf={["transport:manage"]}>
                    <TableCell>
                      <button
                        onClick={() => handleDelete(driver.id)}
                        className="text-destructive hover:opacity-70"
                        aria-label="Remove driver"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </Can>
                </TableRow>
              ))}
              {drivers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No drivers yet.
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

function FuelLogsTab() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [litres, setLitres] = useState("");
  const [costPerLitre, setCostPerLitre] = useState("");
  const [odometerReading, setOdometerReading] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    transportApi.listVehicles().then(setVehicles);
  }, []);

  function reload() {
    if (!vehicleId) return;
    transportApi.listFuelLogs(vehicleId).then(setLogs);
  }
  useEffect(reload, [vehicleId]);

  async function handleSubmit() {
    if (!vehicleId || !litres || !costPerLitre) return;
    setSubmitting(true);
    try {
      await transportApi.createFuelLog(vehicleId, {
        litres: Number(litres),
        costPerLitre: Number(costPerLitre),
        odometerReading: odometerReading ? Number(odometerReading) : undefined,
      });
      toast({ title: "Fuel log recorded" });
      setLitres("");
      setCostPerLitre("");
      setOdometerReading("");
      reload();
    } catch (err) {
      toast({ title: "Failed to record fuel log", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">Fuel Logs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={vehicleId} onValueChange={setVehicleId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select vehicle" />
          </SelectTrigger>
          <SelectContent>
            {vehicles.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.registrationNumber}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {vehicleId && (
          <>
            <Can anyOf={["transport:manage"]}>
              <div className="flex flex-wrap items-end gap-3 rounded-md border border-border p-3">
                <div className="space-y-1">
                  <Label className="text-xs">Litres</Label>
                  <Input className="w-28" type="number" value={litres} onChange={(e) => setLitres(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cost / Litre</Label>
                  <Input
                    className="w-28"
                    type="number"
                    value={costPerLitre}
                    onChange={(e) => setCostPerLitre(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Odometer (optional)</Label>
                  <Input
                    className="w-32"
                    type="number"
                    value={odometerReading}
                    onChange={(e) => setOdometerReading(e.target.value)}
                  />
                </div>
                <Button size="sm" onClick={handleSubmit} disabled={submitting || !litres || !costPerLitre}>
                  Add fuel log
                </Button>
              </div>
            </Can>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filled At</TableHead>
                  <TableHead>Litres</TableHead>
                  <TableHead>Cost / Litre</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Odometer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.filledAt).toLocaleString()}</TableCell>
                    <TableCell>{log.litres}</TableCell>
                    <TableCell>{log.costPerLitre}</TableCell>
                    <TableCell>{log.totalCost}</TableCell>
                    <TableCell>{log.odometerReading ?? "-"}</TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No fuel logs recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function VehiclesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Vehicles &amp; Drivers</h1>
        <p className="text-sm text-muted-foreground">Manage the transport fleet and drivers roster.</p>
      </div>
      <Tabs defaultValue="vehicles">
        <TabsList>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="fuel-logs">Fuel Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="vehicles">
          <VehiclesTab />
        </TabsContent>
        <TabsContent value="drivers">
          <DriversTab />
        </TabsContent>
        <TabsContent value="fuel-logs">
          <FuelLogsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
