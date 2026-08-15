import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import type { Permission } from "@erp/shared";
import { Loader2 } from "lucide-react";

export function ProtectedRoute() {
  const { user, isBootstrapping } = useAuthStore();
  const location = useLocation();

  if (isBootstrapping) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export function RequirePermission({ anyOf, children }: { anyOf: Permission[]; children: React.ReactNode }) {
  const hasPermission = useAuthStore((s) => s.hasPermission(...anyOf));
  if (!hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center text-muted-foreground">
        <p className="text-lg font-medium">Access restricted</p>
        <p className="text-sm">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }
  return <>{children}</>;
}
