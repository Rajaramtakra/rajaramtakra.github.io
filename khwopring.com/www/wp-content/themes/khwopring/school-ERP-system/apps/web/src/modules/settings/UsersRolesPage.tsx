import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { settingsApi, type RoleRecord, type UserRecord } from "./settings.api";
import { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Can } from "@/components/Can";
import { useAuthStore } from "@/store/auth.store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function UsersTab() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Record<string, string>>({});
  const canManageRoles = useAuthStore((s) => s.hasPermission("settings:manage", "role:manage"));

  function reload() {
    setLoading(true);
    Promise.all([
      settingsApi.listUsers({ page, pageSize: 10, search: search || undefined }),
      settingsApi.listRoles(),
    ])
      .then(([usersRes, rolesRes]) => {
        setUsers(usersRes.data);
        setTotal(usersRes.meta.total);
        setRoles(rolesRes);
      })
      .finally(() => setLoading(false));
  }

  useEffect(reload, [page]);

  async function handleAssign(userId: string) {
    const roleId = selectedRole[userId];
    if (!roleId) {
      toast({ title: "Select a role first", variant: "destructive" });
      return;
    }
    try {
      await settingsApi.assignRole(userId, roleId);
      toast({ title: "Role assigned" });
      reload();
    } catch (err) {
      toast({ title: "Failed to assign role", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  async function handleRevoke(userId: string, roleId: string) {
    try {
      await settingsApi.revokeRole(userId, roleId);
      toast({ title: "Role removed" });
      reload();
    } catch (err) {
      toast({ title: "Failed to remove role", description: getErrorMessage(err), variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">Users</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && reload()}
          />
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  {canManageRoles && <TableHead className="w-64">Assign role</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {user.roles.map((ur) => (
                          <Badge key={ur.id} variant="secondary" className="gap-1 pr-1">
                            {ur.role.name}
                            <Can anyOf={["settings:manage", "role:manage"]}>
                              <button
                                type="button"
                                aria-label={`Remove ${ur.role.name}`}
                                className="rounded-sm hover:bg-background/60"
                                onClick={() => handleRevoke(user.id, ur.roleId)}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Can>
                          </Badge>
                        ))}
                        {user.roles.length === 0 && <span className="text-xs text-muted-foreground">No roles</span>}
                      </div>
                    </TableCell>
                    {canManageRoles && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={selectedRole[user.id] ?? ""}
                            onValueChange={(v) => setSelectedRole((prev) => ({ ...prev, [user.id]: v }))}
                          >
                            <SelectTrigger className="h-8 w-40">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map((role) => (
                                <SelectItem key={role.id} value={role.id}>
                                  {role.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="outline" onClick={() => handleAssign(user.id)}>
                            Assign
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canManageRoles ? 4 : 3} className="text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">{total} total users</p>
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
  );
}

function RolesTab() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsApi.listRoles().then(setRoles).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Roles and their permissions are defined by the system and are read-only here. To change what a role can do, the
        seeded permission matrix must be updated in code.
      </p>
      {roles.map((role) => (
        <Card key={role.id}>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-semibold text-foreground">{role.name}</CardTitle>
            <Badge variant={role.isSystem ? "outline" : "secondary"}>{role.isSystem ? "System role" : "Custom role"}</Badge>
          </CardHeader>
          <CardContent>
            {role.description && <p className="mb-3 text-sm text-muted-foreground">{role.description}</p>}
            <div className="flex flex-wrap gap-1.5">
              {role.permissions.map((rp) => (
                <Badge key={rp.permission.id} variant="outline" className="font-mono text-[10px]">
                  {rp.permission.key}
                </Badge>
              ))}
              {role.permissions.length === 0 && <span className="text-xs text-muted-foreground">No permissions assigned.</span>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function UsersRolesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users &amp; Roles</h1>
        <p className="text-sm text-muted-foreground">
          Manage user role assignments. Role changes take effect the next time a user logs in or their session refreshes.
        </p>
      </div>
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        <TabsContent value="roles">
          <RolesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
