import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { isAppRole, type AppRole } from "@/lib/auth/roles";

export type AccountStatusFilter = "ALL" | "active" | "inactive";

export type AccountFilters = {
  q: string;
  role: AppRole | "ALL";
  status: AccountStatusFilter;
};

type RawParams = Record<string, string | string[] | undefined>;

function getString(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

/** Parses the shared Kelola Akun filters used by both the list page and exports. */
export function parseAccountFilters(params: RawParams): AccountFilters {
  const roleValue = getString(params.role);
  const statusValue = getString(params.status);

  return {
    q: getString(params.q).trim().slice(0, 100),
    role: isAppRole(roleValue) ? roleValue : "ALL",
    status:
      statusValue === "active" || statusValue === "inactive"
        ? statusValue
        : "ALL",
  };
}

export function buildAccountWhere(
  filters: AccountFilters,
): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};

  if (filters.q) {
    where.OR = [
      { fullName: { contains: filters.q, mode: "insensitive" } },
      { username: { contains: filters.q, mode: "insensitive" } },
      {
        studentProfile: {
          is: {
            OR: [
              { nis: { contains: filters.q, mode: "insensitive" } },
              { kelas: { contains: filters.q, mode: "insensitive" } },
              { grha: { contains: filters.q, mode: "insensitive" } },
            ],
          },
        },
      },
      {
        staffProfile: {
          is: {
            nip: { contains: filters.q, mode: "insensitive" },
          },
        },
      },
    ];
  }

  if (filters.role !== "ALL") {
    where.role = filters.role;
  }

  if (filters.status !== "ALL") {
    where.isActive = filters.status === "active";
  }

  return where;
}

type AccountQueryKey = "q" | "role" | "status" | "page" | "deleted" | "created";

export function buildAccountQuery(
  filters: AccountFilters,
  overrides: Partial<Record<AccountQueryKey, string>> = {},
): string {
  const params = new URLSearchParams();
  const values = {
    q: filters.q,
    role: filters.role === "ALL" ? "" : filters.role,
    status: filters.status === "ALL" ? "" : filters.status,
    page: "",
    deleted: "",
    created: "",
    ...overrides,
  };

  if (values.q) params.set("q", values.q);
  if (values.role) params.set("role", values.role);
  if (values.status) params.set("status", values.status);
  if (values.page) params.set("page", values.page);
  if (values.deleted) params.set("deleted", values.deleted);
  if (values.created) params.set("created", values.created);

  const search = params.toString();

  return search ? `?${search}` : "";
}
