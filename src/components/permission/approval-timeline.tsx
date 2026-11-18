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
import { APPROVAL_STEPS } from "@/lib/permissions/status";
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

export function ApprovalTimeline({
  request,
  highlightRole,
}: {
  request: PermissionRequestDetail;
  highlightRole?: Role;
}) {
  return (
    <ol className="space-y-4">
      {APPROVAL_STEPS.map((stage, index) => {
        const approval = request.approvals.find(
          (item) => item.step === stage.step,
        );
        const status = approval?.status ?? "PENDING";
        const isComplete = status === "APPROVED";
        const isRejected = status === "REJECTED";
        const isCancelled = status === "CANCELLED";
        const isCurrent = request.status === stage.pendingStatus;
        const Icon = isComplete
          ? Check
          : isRejected
            ? X
            : isCancelled
              ? MinusCircle
              : isCurrent
                ? Clock3
                : Circle;

        const actorName =
          approval?.approver?.fullName ??
          (stage.step === 1 ? request.mentor.fullName : null);

        const showMine = highlightRole === stage.role && isCurrent;

        return (
          <li key={stage.step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border",
                  stepStateClasses({
                    isComplete,
                    isRejected,
                    isCancelled,
                    isCurrent,
                  }),
                )}
              >
                <Icon className="size-4" />
              </div>
              {index < APPROVAL_STEPS.length - 1 ? (
                <div className="mt-1 w-px flex-1 bg-border" />
              ) : null}
            </div>

            <div className={cn("min-w-0 flex-1", index < APPROVAL_STEPS.length - 1 && "pb-2")}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{stage.title}</p>
                {showMine ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    Tahap Anda
                  </span>
                ) : null}
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    isComplete && "bg-primary/10 text-primary",
                    isRejected && "bg-destructive/10 text-destructive",
                    isCancelled && "bg-muted text-muted-foreground",
                    !isComplete &&
                      !isRejected &&
                      !isCancelled &&
                      isCurrent &&
                      "bg-amber-500/10 text-amber-700 dark:text-amber-300",
                    !isComplete &&
                      !isRejected &&
                      !isCancelled &&
                      !isCurrent &&
                      "bg-muted text-muted-foreground",
                  )}
                >
                  {isComplete
                    ? "Disetujui"
                    : isRejected
                      ? "Ditolak"
                      : isCancelled
                        ? "Dibatalkan"
                        : isCurrent
                          ? "Menunggu keputusan"
                          : "Belum diproses"}
                </span>
              </div>

              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {stage.description}
              </p>

              <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                {actorName ? (
                  <p>
                    {stage.step === 1 ? "Pembina/Pendamping" : "Penyetuju"}:{" "}
                    <span className="font-medium text-foreground">
                      {actorName}
                    </span>
                  </p>
                ) : isCurrent ? (
                  <p>Menunggu keputusan dari peran {stage.title}.</p>
                ) : null}
                {approval?.actedAt ? (
                  <p>{formatDateTime(approval.actedAt)}</p>
                ) : null}
              </div>

              {approval?.note ? (
                <p className="mt-2 rounded-lg bg-muted/60 px-2.5 py-2 text-xs leading-relaxed">
                  {approval.note}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
