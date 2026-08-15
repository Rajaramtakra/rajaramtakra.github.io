import type { Permission } from "./permissions";
import type { RoleName } from "./enums";

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorBody {
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  schoolId: string;
  roles: RoleName[];
  permissions: Permission[];
}

export interface JwtAccessPayload {
  sub: string;
  schoolId: string;
  roles: RoleName[];
  permissions: Permission[];
}
