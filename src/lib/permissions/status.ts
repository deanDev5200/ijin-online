import type {
  ApprovalStatus,
  RequestStatus,
  Role,
} from "@/generated/prisma/enums";

import {
  APPROVAL_ROLE_DESCRIPTIONS,
  APPROVAL_ROLE_LABELS,
  isApprovalRole,
  pendingStatusForRole,
  type ApprovalRole,
} from "./config";

export const PENDING_STATUSES = [
  "PENDING_MENTOR",
  "PENDING_DORM_STAFF",
  "PENDING_DORM_HEAD",
  "PENDING_WAKASEK",
] as const;

export type PendingStatus = (typeof PENDING_STATUSES)[number];

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING_MENTOR: "Menunggu Penyetuju",
  PENDING_DORM_STAFF: "Menunggu Penyetuju",
  PENDING_DORM_HEAD: "Menunggu Penyetuju",
  PENDING_WAKASEK: "Menunggu Penyetuju",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  CANCELLED: "Dibatalkan",
};

export const APPROVAL_STATUS_LABELS = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  CANCELLED: "Dibatalkan",
} as const;

export type ApprovalStepConfig = {
  step: number;
  role: ApprovalRole;
  pendingStatus: PendingStatus;
  title: string;
  description: string;
};

export type ApprovalRowLike = {
  id: string;
  step: number;
  role: Role;
  status: ApprovalStatus;
  approverId?: string | null;
  label?: string | null;
};

export type RequestApprovalLike = {
  status: RequestStatus;
  approvals: ApprovalRowLike[];
};

function toApprovalRole(role: Role): ApprovalRole | null {
  return isApprovalRole(role) ? role : null;
}

export function isPendingStatus(status: RequestStatus): status is PendingStatus {
  return (PENDING_STATUSES as readonly RequestStatus[]).includes(status);
}

export function getStageFromApproval(
  approval: ApprovalRowLike,
): ApprovalStepConfig | null {
  const role = toApprovalRole(approval.role);
  const pendingStatus = role ? pendingStatusForRole(role) : null;

  if (!role || !pendingStatus) {
    return null;
  }

  return {
    step: approval.step,
    role,
    pendingStatus,
    title: approval.label?.trim() || APPROVAL_ROLE_LABELS[role],
    description: APPROVAL_ROLE_DESCRIPTIONS[role],
  };
}

function sortedApprovals(request: RequestApprovalLike): ApprovalRowLike[] {
  return [...request.approvals].sort((a, b) => a.step - b.step);
}

export function getCurrentApproval(
  request: RequestApprovalLike,
): ApprovalRowLike | null {
  return (
    sortedApprovals(request).find((approval) => approval.status === "PENDING") ??
    null
  );
}

export function getNextApproval(
  request: RequestApprovalLike,
  currentStep: number,
): ApprovalRowLike | null {
  return (
    sortedApprovals(request).find(
      (approval) => approval.step > currentStep && approval.status === "PENDING",
    ) ?? null
  );
}

export function getNextStatusForApprovals(
  request: RequestApprovalLike,
  currentStep: number,
): RequestStatus {
  const nextApproval = getNextApproval(request, currentStep);

  if (!nextApproval) {
    return "APPROVED";
  }

  const stage = getStageFromApproval(nextApproval);

  return stage?.pendingStatus ?? "APPROVED";
}

/**
 * Each request has exactly one approval row. Any active user with the
 * configured role may decide; the first decision wins.
 */
export function canUserActOnRequest(
  user: { id: string; role: Role },
  request: RequestApprovalLike,
): boolean {
  const currentApproval = getCurrentApproval(request);

  if (!currentApproval) {
    return false;
  }

  const stage = getStageFromApproval(currentApproval);

  if (!stage || stage.role !== user.role) {
    return false;
  }

  return stage.pendingStatus === request.status;
}

export function canUserViewStaffRequest(
  user: { id: string; role: Role },
  request: RequestApprovalLike,
): boolean {
  if (
    request.approvals.some(
      (approval) =>
        approval.approverId === user.id && approval.status !== "PENDING",
    )
  ) {
    return true;
  }

  const currentApproval = getCurrentApproval(request);
  const stage = currentApproval
    ? getStageFromApproval(currentApproval)
    : null;

  return stage?.role === user.role;
}
