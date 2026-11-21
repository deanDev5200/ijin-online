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
] as const;

export type PendingStatus = (typeof PENDING_STATUSES)[number];

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING_MENTOR: "Menunggu Pembina",
  PENDING_DORM_STAFF: "Menunggu Staff Asrama",
  PENDING_DORM_HEAD: "Menunggu Kepala Asrama",
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

export const APPROVAL_STEPS: readonly ApprovalStepConfig[] = [
  {
    step: 1,
    role: "PEMBINA",
    pendingStatus: "PENDING_MENTOR",
    title: APPROVAL_ROLE_LABELS.PEMBINA,
    description: APPROVAL_ROLE_DESCRIPTIONS.PEMBINA,
  },
  {
    step: 2,
    role: "STAFF_ASRAMA",
    pendingStatus: "PENDING_DORM_STAFF",
    title: APPROVAL_ROLE_LABELS.STAFF_ASRAMA,
    description: APPROVAL_ROLE_DESCRIPTIONS.STAFF_ASRAMA,
  },
  {
    step: 3,
    role: "KEPALA_ASRAMA",
    pendingStatus: "PENDING_DORM_HEAD",
    title: APPROVAL_ROLE_LABELS.KEPALA_ASRAMA,
    description: APPROVAL_ROLE_DESCRIPTIONS.KEPALA_ASRAMA,
  },
] as const;

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
  mentorId: string;
  approvals: ApprovalRowLike[];
};

function toApprovalRole(role: Role): ApprovalRole | null {
  return isApprovalRole(role) ? role : null;
}

export function isPendingStatus(status: RequestStatus): status is PendingStatus {
  return (PENDING_STATUSES as readonly RequestStatus[]).includes(status);
}

/** Kept for callers that only know the generic request status. */
export function getStageByStatus(
  status: RequestStatus,
): ApprovalStepConfig | null {
  return APPROVAL_STEPS.find((stage) => stage.pendingStatus === status) ?? null;
}

/** Kept for callers that only know a staff role. */
export function getStageByRole(role: Role): ApprovalStepConfig | null {
  const approvalRole = toApprovalRole(role);

  return approvalRole
    ? APPROVAL_STEPS.find((stage) => stage.role === approvalRole) ?? null
    : null;
}

/** Legacy single-flow helper. Dynamic flows use getNextStatusForApprovals. */
export function getNextStatusForStep(step: number): RequestStatus | null {
  if (step === 1) {
    return "PENDING_DORM_STAFF";
  }

  if (step === 2) {
    return "PENDING_DORM_HEAD";
  }

  if (step === 3) {
    return "APPROVED";
  }

  return null;
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
 * The selected Pembina/Pendamping is pinned to the PEMBINA approval row.
 * Other roles are shared role-based queues where the first decision wins.
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

  if (stage.pendingStatus !== request.status) {
    return false;
  }

  if (stage.role === "PEMBINA") {
    return currentApproval.approverId === user.id;
  }

  return true;
}

export function canUserViewStaffRequest(
  user: { id: string; role: Role },
  request: RequestApprovalLike,
): boolean {
  if (request.mentorId === user.id) {
    return true;
  }

  if (
    request.approvals.some(
      (approval) => approval.approverId === user.id && approval.status !== "PENDING",
    )
  ) {
    return true;
  }

  const stage = getStageFromApproval(getCurrentApproval(request) ?? {
    id: "fallback",
    step: 0,
    role: user.role,
    status: "PENDING",
  });

  return stage?.role === user.role && stage.role !== "PEMBINA";
}
