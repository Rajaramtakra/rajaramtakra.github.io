import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { transportApi, type Route, type RouteAssignment } from "./transport.api";
import { studentApi, type StudentRecord } from "@/modules/students/student.api";
import { academicApi, type SectionRecord } from "@/modules/academic/academic.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Can } from "@/components/Can";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const NO_PICKUP_POINT = "NONE";

export function RouteAssignmentsPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [assignments, setAssignments] = useState<RouteAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [studentId, setStudentId] = useState<string>("");
  const [routeId, setRouteId] = useState<string>("");
  const [pickupPointId, setPickupPointId] = useState<string>("");

  const [sections, setSections] = useState<SectionRecord[]>([]);
  const [bulkSectionId, setBulkSectionId] = useState<string>("");
  const [bulkRouteId, setBulkRouteId] = useState<string>("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  function reload() {
    setLoading(true);
    Promise.all([transportApi.listRoutes(), studentApi.search({ pageSize: 100 }), transportApi.listAssignments()])
      .then(([r, s, a]) => {
        setRoutes(r);
        setStudents(s.data);
        setAssignments(a);
      })
      .finally(() => setLoading(false));
  }
  useEffect(reload, []);
  useEffect(() => {
    academicApi.listSections().then(setSections);
  }, []);

  async function handleBulkAssign() {
    if (!bulkSectionId || !bulkRouteId) return;
    setBulkSubmitting(true);
    try {
      const { data: sectionStudents } = await studentApi.search({ sectionId: bulkSectionId, pageSize: 200, status: "ACTIVE" });
      if (sectionStudents.length === 0) {
        toast({ title: "No active students in this section", variant: "destructive" });
        return;
      }
      const assigned = await transportApi.bulkAssignStudents(bulkRouteId, {
        studentIds: sectionStudents.map((s) => s.id),
      });
      toast({ title: `Assigned ${assigned.length} of ${sectionStudents.length} students to the route` });
      setBulkSectionId("");
      setBulkRouteId("");
      reload();
    } catch (err) {
      toast({
        title: "Bulk assignment stopped partway through",
        description: getErrorMessage(err),
        variant: "destructive",
      });
      reload();
    } finally {
      setBulkSubmitting(false);
    }
  }

  const selectedRoute = useMemo(() => routes.find((r) => r.id === routeId), [routes, routeId]);
  const routeById = useMemo(() => new Map(routes.map((r) => [r.id, r])), [routes]);

  async function handleAssign() {
    if (!studentId || !routeId) {
      toast({ title: "Select a student and a route", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await transportApi.assignStudent({
        studentId,
        routeId,
        pickupPointId: pickupPointId && pickupPointId !== NO_PICKUP_POINT ? pickupPointId : undefined,
      });
      toast({ title: "Student assigned to route" });
      setStudentId("");
      setRouteId("");
      setPickupPointId("");
      reload();
    } catch (err) {
      toast({ title: "Failed to assign student", description: getErrorMessage(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id: string) {
    try {
      await transportApi.removeAssignment(id);
      toast({ title: "Assignment removed" });
      reload();
    } catch (err) {
      toast({ title: "Failed to remove assignment", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Route Assignments</h1>
        <p className="text-sm text-muted-foreground">
          Assign students to a transport route and pickup point. Reassigning a student replaces their prior assignment.
        </p>
      </div>

      <Can anyOf={["transport:manage"]}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">Assign a student</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Student</Label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({s.registrationNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Route</Label>
                <Select
                  value={routeId}
                  onValueChange={(v) => {
                    setRouteId(v);
                    setPickupPointId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select route" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                        {r.vehicle ? ` (${r._count?.assignments ?? 0}/${r.vehicle.capacity})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Pickup point (optional)</Label>
                <Select value={pickupPointId} onValueChange={setPickupPointId} disabled={!selectedRoute}>
                  <SelectTrigger>
                    <SelectValue placeholder="No specific stop" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_PICKUP_POINT}>No specific stop</SelectItem>
                    {selectedRoute?.pickupPoints.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button onClick={handleAssign} disabled={submitting}>
                Assign
              </Button>
            </div>
          </CardContent>
        </Card>
      </Can>

      <Can anyOf={["transport:manage"]}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">Bulk assign a whole section</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Section</Label>
                <Select value={bulkSectionId} onValueChange={setBulkSectionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.class?.name} - {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Route</Label>
                <Select value={bulkRouteId} onValueChange={setBulkRouteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select route" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                        {r.vehicle ? ` (${r._count?.assignments ?? 0}/${r.vehicle.capacity})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              All active students in the section are assigned; the batch stops once the vehicle reaches capacity.
            </p>
            <div className="mt-3 flex justify-end">
              <Button onClick={handleBulkAssign} disabled={bulkSubmitting || !bulkSectionId || !bulkRouteId}>
                Bulk assign
              </Button>
            </div>
          </CardContent>
        </Card>
      </Can>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground">Current assignments</CardTitle>
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
                  <TableHead>Student</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Pickup point</TableHead>
                  <TableHead>Seats</TableHead>
                  <Can anyOf={["transport:manage"]}>
                    <TableHead className="w-10" />
                  </Can>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((a) => {
                  const route = routeById.get(a.routeId);
                  const capacity = route?.vehicle?.capacity ?? a.route.vehicle?.capacity;
                  const taken = route?._count?.assignments;
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        {a.student.firstName} {a.student.lastName}
                      </TableCell>
                      <TableCell>{a.route.name}</TableCell>
                      <TableCell>{a.pickupPoint?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>
                        {capacity !== undefined ? (
                          <Badge variant={(taken ?? 0) >= capacity ? "destructive" : "secondary"} className="text-[10px]">
                            {taken ?? "?"}/{capacity}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <Can anyOf={["transport:manage"]}>
                        <TableCell>
                          <button
                            onClick={() => handleRemove(a.id)}
                            className="text-destructive hover:opacity-70"
                            aria-label="Remove assignment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </TableCell>
                      </Can>
                    </TableRow>
                  );
                })}
                {assignments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No route assignments yet.
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
