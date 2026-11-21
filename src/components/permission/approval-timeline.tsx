import type { Role } from "@/generated/prisma/enums";
import {
  Check,
  Circle,
  Clock3,
  MinusCircle,
  X,
} from "lucide-react";

import { formatDateTime } from "@/lib/permissions/dates";
import type { PermissionRequestDetail } from "@/lib/permissions/queries";
import { getStageFromApproval } from "@/lib/permissions/status";
import { cn } from "@/lib/utils";

function stepStateClasses({
  isComplete,
  isRejected,
  isCancelled,
  isCurrent,
}: {
  isComplete: boolean;
  isRejected: boolean;
  isCancelled: boolean;
  isCurrent: boolean;
}) {
  if (isComplete) {
    return "border-primary bg-primary text-primary-foreground";
  }

  if (isRejected) {
    return "border-destructive bg-destructive text-white";
  }

  if (isCancelled) {
    return "border-border bg-muted text-muted-foreground";
  }

  if (isCurrent) {
    return "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }

  return "border-border bg-background text-muted-foreground";
}

function StepIcon({
  status,
}: {
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
}) {
  if (status === "APPROVED") {
    return <Check className="size-3.5" />;
  }

  if (status === "REJECTED") {
    return <X className="size-3.5" />;
  }

  if (status === "CANCELLED") {
    return <MinusCircle className="size-3.5" />;
  }

  return <Clock3 className="size-3.5" />;
}

export function ApprovalTimeline({
  request,
  viewerRole,
}: {
  request: PermissionRequestDetail;
  viewerRole?: Role;
}) {
  const approvals = [...request.approvals].sort((a, b) => a.step - b.step);
  const currentApproval = approvals.find(
    (approval) => approval.status === "PENDING",
  );
  const hasTerminalApproval = approvals.some(
    (approval) => approval.status === "REJECTED" || approval.status === "CANCELLED",
  );
  const isComplete =
    request.status === "APPROVED" ||
    (approvals.length > 0 &&
      approvals.every(
        (approval) =>
          approval.status === "APPROVED" || approval.status === "CANCELLED",
      ));
  const requestCancelled = request.status === "CANCELLED";

  return (
    <div className="relative space-y-0">
      {approvals.map((approval, index) => {
        const stage = getStageFromApproval(approval);
        const isCurrent =
          currentApproval?.id === approval.id && !requestCancelled && !hasTerminalApproval;
        const activeForViewer = isCurrent && stage?.role === viewerRole;
        const isLast = index === approvals.length - 1;
        const isCompleteStep = approval.status === "APPROVED";
        const isRejectedStep = approval.status === "REJECTED";
        const isCancelledStep =
          requestCancelled || approval.status === "CANCELLED";

        return (
          <div key={approval.id} className="relative flex gap-4 pb-7 last:pb-0">
            {!isLast ? (
              <div
                className={cn(
                  "absolute top-9 bottom-0 left-[17px] w-px",
                  isCompleteStep ? "bg-primary/40" : "bg-border",
                )}
              />
            ) : null}

            <div
              className={cn(
                "relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                stepStateClasses({
                  isComplete: isCompleteStep,
                  isRejected: isRejectedStep,
                  isCancelled: isCancelledStep,
                  isCurrent,
                }),
                activeForViewer && "ring-4 ring-primary/10",
              )}
            >
              {isCancelledStep ? <Circle className="size-3" /> : <StepIcon status={approval.status} />}
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">
                  {approval.label?.trim() || stage?.title || `Tahap ${approval.step}`}
                </p>
                {activeForViewer ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    Menunggu Anda
                  </span>
                ) : null}
              </div>

              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {stage?.description ??
                  "Meninjau pengajuan pada tahap ini."}
              </p>

              {approval.approver?.fullName ? (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {approval.approver.fullName}
                  {approval.actedAt
                    ? ` · ${formatDateTime(approval.actedAt)}`
                    : ""}
                </p>
              ) : null}

              {approval.note ? (
                <div className="mt-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-foreground/80">
                  {approval.note}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}

      {isComplete ? (
        <div className="mt-1 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-medium text-primary">
          <Check className="size-4" />
          Semua tahap persetujuan telah selesai.
        </div>
      ) : null}
    </div>
  );
}
