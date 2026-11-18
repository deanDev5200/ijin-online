import type { RequestStatus, Role } from "@/generated/prisma/enums";
import { isStaffRole } from "@/lib/auth/roles";

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
  step: 1 | 2 | 3;
  role: Extract<Role, "PEMBINA" | "STAFF_ASRAMA" | "KEPALA_ASRAMA">;
  pendingStatus: PendingStatus;
  title: string;
  description: string;
};

export const APPROVAL_STEPS: readonly ApprovalStepConfig[] = [
  {
    step: 1,
    role: "PEMBINA",
    pendingStatus: "PENDING_MENTOR",
    title: "Pembina / Pendamping",
    description:
      "Memeriksa kesesuaian kegiatan dan memberikan persetujuan awal.",
  },
  {
    step: 2,
    role: "STAFF_ASRAMA",
    pendingStatus: "PENDING_DORM_STAFF",
    title: "Staff Asrama",
    description:
      "Memverifikasi data asrama, jadwal, dan siswa yang terlibat.",
  },
  {
    step: 3,
    role: "KEPALA_ASRAMA",
    pendingStatus: "PENDING_DORM_HEAD",
    title: "Kepala Asrama",
    description:
      "Memberikan persetujuan akhir sebelum izin dinyatakan berlaku.",
  },
] as const;

export function isPendingStatus(status: RequestStatus): status is PendingStatus {
  return (PENDING_STATUSES as readonly RequestStatus[]).includes(status);
}

export function getStageByStatus(
  status: RequestStatus,
): ApprovalStepConfig | null {
  return APPROVAL_STEPS.find((stage) => stage.pendingStatus === status) ?? null;
}

export function getStageByRole(role: Role): ApprovalStepConfig | null {
  return APPROVAL_STEPS.find((stage) => stage.role === role) ?? null;
}

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

/**
 * Stage 1 belongs to the selected Pembina/Pendamping. Stages 2 and 3 are
 * role-based: any active user with the role may decide, and the first
 * decision wins.
 */
export function canUserActOnRequest(
  user: { id: string; role: Role },
  request: { status: RequestStatus; mentorId: string },
): boolean {
  const stage = getStageByStatus(request.status);

  if (!stage) {
    return false;
  }

  if (stage.step === 1) {
    return isStaffRole(user.role) && request.mentorId === user.id;
  }

  if (stage.role !== user.role) {
    return false;
  }

  return true;
}

export function canUserViewStaffRequest(
  user: { id: string; role: Role },
  request: {
    mentorId: string;
    status: RequestStatus;
    approvals: { approverId: string | null }[];
  },
): boolean {
  if (request.mentorId === user.id) {
    return true;
  }

  if (request.approvals.some((approval) => approval.approverId === user.id)) {
    return true;
  }

  const stage = getStageByStatus(request.status);

  if (!stage || stage.step === 1 || stage.role !== user.role) {
    return false;
  }

  return true;
}
