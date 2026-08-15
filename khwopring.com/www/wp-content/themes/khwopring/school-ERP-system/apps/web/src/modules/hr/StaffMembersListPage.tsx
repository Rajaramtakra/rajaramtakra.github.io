import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { hrApi, type StaffMemberRecord } from "./hr.api";
import { NewStaffMemberDialog } from "./NewStaffMemberDialog";
import { Can } from "@/components/Can";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  ACTIVE: "success",
  ON_LEAVE: "warning",
  TERMINATED: "destructive",
  RESIGNED: "secondary",
  RETIRED: "default",
};

export function StaffMembersListPage() {
  const [data, setData] = useState<StaffMemberRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    hrApi.staff
      .list({ page, pageSize: 10, search: search || undefined, employmentStatus })
      .then((res) => {
        setData(res.data);
        setTotal(res.meta.total);
      })
      .finally(() => setLoading(false));
  }

  useEffect(reload, [page, employmentStatus]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Staff Members</h1>
          <p className="text-sm text-muted-foreground">Manage non-teaching staff records and employment status.</p>
        </div>
        <Can anyOf={["staff:manage"]}>
          <NewStaffMemberDialog onCreated={reload} />
        </Can>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search by name or employee code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && reload()}
              />
            </div>
            <Select
              value={employmentStatus ?? "ALL"}
              onValueChange={(v) => {
                setEmploymentStatus(v === "ALL" ? undefined : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {["ACTIVE", "ON_LEAVE", "TERMINATED", "RESIGNED", "RETIRED"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell>
                        <Link to={`/hr/staff/${staff.id}`} className="font-medium text-primary hover:underline">
                          {staff.employeeCode}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {staff.firstName} {staff.lastName}
                      </TableCell>
                      <TableCell>{staff.department}</TableCell>
                      <TableCell>{staff.designation}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[staff.employmentStatus]}>{staff.employmentStatus}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No staff members found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">{total} total staff members</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={page * 10 >= total} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
