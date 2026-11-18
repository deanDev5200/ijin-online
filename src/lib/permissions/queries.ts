import "server-only";

import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/db";

export const permissionRequestDetailSelect = {
  id: true,
  type: {
    select: {
      id: true,
      name: true,
      description: true,
    },
  },
  requesterId: true,
  mentorId: true,
  purpose: true,
  place: true,
  startDate: true,
  endDate: true,
  startTime: true,
  endTime: true,
  status: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
  requester: {
    select: {
      id: true,
      fullName: true,
      username: true,
    },
  },
  mentor: {
    select: {
      id: true,
      fullName: true,
      username: true,
      staffProfile: {
        select: {
          nip: true,
        },
      },
    },
  },
  students: {
    select: {
      isRequester: true,
      student: {
        select: {
          id: true,
          fullName: true,
          username: true,
          studentProfile: {
            select: {
              nis: true,
              kelas: true,
              grha: true,
            },
          },
        },
      },
    },
  },
  approvals: {
    orderBy: {
      step: "asc",
    },
    select: {
      id: true,
      step: true,
      role: true,
      approverId: true,
      status: true,
      note: true,
      actedAt: true,
      approver: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  },
} satisfies Prisma.PermissionRequestSelect;

export type PermissionRequestDetail = Prisma.PermissionRequestGetPayload<{
  select: typeof permissionRequestDetailSelect;
}>;

export const permissionRequestListSelect = {
  id: true,
  purpose: true,
  place: true,
  startDate: true,
  endDate: true,
  startTime: true,
  endTime: true,
  status: true,
  createdAt: true,
  type: {
    select: {
      name: true,
    },
  },
  requester: {
    select: {
      fullName: true,
    },
  },
  mentor: {
    select: {
      fullName: true,
    },
  },
  students: {
    select: {
      studentId: true,
    },
  },
} satisfies Prisma.PermissionRequestSelect;

export type PermissionRequestListEntry = Prisma.PermissionRequestGetPayload<{
  select: typeof permissionRequestListSelect;
}>;

export function findPermissionRequestDetail(
  requestId: string,
): Promise<PermissionRequestDetail | null> {
  return prisma.permissionRequest.findUnique({
    where: { id: requestId },
    select: permissionRequestDetailSelect,
  });
}
