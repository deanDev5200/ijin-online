import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { RequestStatus } from "@/generated/prisma/enums";
import { dateOnlySchema } from "@/lib/validations/permission";

export const PERMISSION_INDEX_STATUSES = [
  "PENDING_MENTOR",
  "PENDING_DORM_STAFF",
  "PENDING_DORM_HEAD",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
] as const satisfies readonly RequestStatus[];

export type PermissionIndexStatus = "ALL" | RequestStatus;

export type PermissionIndexFilters = {
  q: string;
  status: PermissionIndexStatus;
  typeId: string;
  from: string;
  to: string;
};

function getString(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function getValidDate(value: string): string {
  return dateOnlySchema.safeParse(value).success ? value : "";
}

export function parsePermissionIndexFilters(
  params: Record<string, string | string[] | undefined>,
): PermissionIndexFilters {
  const statusValue = getString(params.status);

  return {
    q: getString(params.q).trim().slice(0, 100),
    status: (PERMISSION_INDEX_STATUSES as readonly string[]).includes(
      statusValue,
    )
      ? (statusValue as RequestStatus)
      : "ALL",
    typeId: getString(params.typeId) || "ALL",
    from: getValidDate(getString(params.from)),
    to: getValidDate(getString(params.to)),
  };
}

export function buildPermissionIndexWhere(
  filters: PermissionIndexFilters,
): Prisma.PermissionRequestWhereInput {
  const where: Prisma.PermissionRequestWhereInput = {};

  if (filters.status !== "ALL") {
    where.status = filters.status;
  }

  if (filters.typeId !== "ALL") {
    where.typeId = filters.typeId;
  }

  if (filters.from && filters.to) {
    where.startDate = { lte: new Date(`${filters.to}T00:00:00.000Z`) };
    where.endDate = { gte: new Date(`${filters.from}T00:00:00.000Z`) };
  } else if (filters.from) {
    where.endDate = { gte: new Date(`${filters.from}T00:00:00.000Z`) };
  } else if (filters.to) {
    where.startDate = { lte: new Date(`${filters.to}T00:00:00.000Z`) };
  }

  if (filters.q) {
    where.OR = [
      { purpose: { contains: filters.q, mode: "insensitive" } },
      { place: { contains: filters.q, mode: "insensitive" } },
      {
        students: {
          some: {
            student: {
              OR: [
                { fullName: { contains: filters.q, mode: "insensitive" } },
                { username: { contains: filters.q, mode: "insensitive" } },
                {
                  studentProfile: {
                    is: {
                      OR: [
                        {
                          nis: {
                            contains: filters.q,
                            mode: "insensitive",
                          },
                        },
                        {
                          kelas: {
                            contains: filters.q,
                            mode: "insensitive",
                          },
                        },
                        {
                          grha: {
                            contains: filters.q,
                            mode: "insensitive",
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      },
    ];
  }

  return where;
}
