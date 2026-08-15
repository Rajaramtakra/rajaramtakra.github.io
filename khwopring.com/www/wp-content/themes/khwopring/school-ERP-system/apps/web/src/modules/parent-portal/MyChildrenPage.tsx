import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { parentApi, type ChildRecord } from "./parent.api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  TRANSFERRED: "secondary",
  ALUMNI: "default",
  EXPELLED: "destructive",
};

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

export function MyChildrenPage() {
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    parentApi
      .listMyChildren()
      .then(setChildren)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Children</h1>
        <p className="text-sm text-muted-foreground">View attendance, homework, and timetable for each child.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <Link key={child.id} to={`/my-children/${child.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-3 p-5">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {initials(child.firstName, child.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {child.firstName} {child.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {child.section.class.name} - {child.section.name}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Badge variant={STATUS_VARIANT[child.status] ?? "default"} className="text-[10px]">
                        {child.status}
                      </Badge>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <GraduationCap className="h-3 w-3" /> {child.relation}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {children.length === 0 && (
            <Card className="sm:col-span-2 lg:col-span-3">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No children are linked to your account yet. Contact the school office if this seems wrong.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
