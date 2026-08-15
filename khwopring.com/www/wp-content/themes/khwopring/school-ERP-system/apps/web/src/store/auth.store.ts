import { create } from "zustand";
import type { AuthUser, Permission } from "@erp/shared";

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isBootstrapping: boolean;
  setSession: (accessToken: string, user: AuthUser) => void;
  clearSession: () => void;
  setBootstrapping: (value: boolean) => void;
  hasPermission: (...anyOf: Permission[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  isBootstrapping: true,
  setSession: (accessToken, user) => set({ accessToken, user }),
  clearSession: () => set({ accessToken: null, user: null }),
  setBootstrapping: (value) => set({ isBootstrapping: value }),
  hasPermission: (...anyOf) => {
    const { user } = get();
    if (!user) return false;
    return anyOf.some((p) => user.permissions.includes(p));
  },
}));
