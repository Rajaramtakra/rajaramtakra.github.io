import type { Permission } from "@erp/shared";
import { useAuthStore } from "@/store/auth.store";

interface CanProps {
  anyOf: Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Can({ anyOf, children, fallback = null }: CanProps) {
  const hasPermission = useAuthStore((s) => s.hasPermission(...anyOf));
  return <>{hasPermission ? children : fallback}</>;
}
