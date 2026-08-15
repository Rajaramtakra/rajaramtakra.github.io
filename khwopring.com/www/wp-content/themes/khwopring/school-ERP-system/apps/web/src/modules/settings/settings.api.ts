import { api } from "@/lib/api";
import type { PaginatedResult, Permission } from "@erp/shared";

export interface SchoolProfile {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  idCardPrimaryColor?: string | null;
  idCardSecondaryColor?: string | null;
  idCardQrVerificationEnabled: boolean;
}

export interface RolePermissionRecord {
  permission: { id: string; key: Permission; description?: string | null };
}

export interface RoleRecord {
  id: string;
  schoolId?: string | null;
  name: string;
  description?: string | null;
  isSystem: boolean;
  permissions: RolePermissionRecord[];
}

export interface UserRoleRecord {
  id: string;
  roleId: string;
  role: RoleRecord;
}

export interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  roles: UserRoleRecord[];
}

export interface UpdateSchoolProfilePayload {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: File;
  idCardPrimaryColor?: string;
  idCardSecondaryColor?: string;
  idCardQrVerificationEnabled?: boolean;
}

export const settingsApi = {
  getSchoolProfile: () => api.get<{ school: SchoolProfile }>("/settings/school").then((r) => r.data.school),

  updateSchoolProfile: (data: UpdateSchoolProfilePayload) => {
    const { logo, ...fields } = data;
    if (!logo) {
      return api.patch<{ school: SchoolProfile }>("/settings/school", fields).then((r) => r.data.school);
    }
    const form = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined) form.append(key, String(value));
    });
    form.append("logo", logo);
    return api
      .patch<{ school: SchoolProfile }>("/settings/school", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.school);
  },

  listUsers: (params: { page?: number; pageSize?: number; search?: string }) =>
    api.get<PaginatedResult<UserRecord>>("/settings/users", { params }).then((r) => r.data),

  listRoles: () => api.get<{ roles: RoleRecord[] }>("/settings/roles").then((r) => r.data.roles),

  assignRole: (userId: string, roleId: string) =>
    api.post<{ userRole: UserRoleRecord }>(`/settings/users/${userId}/roles`, { roleId }).then((r) => r.data.userRole),

  revokeRole: (userId: string, roleId: string) => api.delete(`/settings/users/${userId}/roles/${roleId}`),

  listHolidays: () => api.get<{ holidays: Holiday[] }>("/settings/holidays").then((r) => r.data.holidays),
  createHoliday: (data: { name: string; date: string; recurring?: boolean }) =>
    api.post<{ holiday: Holiday }>("/settings/holidays", data).then((r) => r.data.holiday),
  deleteHoliday: (id: string) => api.delete(`/settings/holidays/${id}`),
};

export interface Holiday {
  id: string;
  name: string;
  date: string;
  recurring: boolean;
}
