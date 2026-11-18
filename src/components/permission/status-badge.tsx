import type {
  ApprovalStatus,
  RequestStatus,
} from "@/generated/prisma/enums";
import { Badge } from "@/components/ui/badge";
import {
  APPROVAL_STATUS_LABELS,
  REQUEST_STATUS_LABELS,
} from "@/lib/permissions/status";
import { cn } from "@/lib/utils";

const requestStatusClasses: Record<RequestStatus, string> = {
  PENDING_MENTOR:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  PENDING_DORM_STAFF:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  PENDING_DORM_HEAD:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  APPROVED: "border-primary/30 bg-primary/10 text-primary",
  REJECTED: "border-destructive/30 bg-destructive/10 text-destructive",
  CANCELLED: "border-border bg-muted text-muted-foreground",
};

const approvalStatusClasses: Record<ApprovalStatus, string> = {
  PENDING:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  APPROVED: "border-primary/30 bg-primary/10 text-primary",
  REJECTED: "border-destructive/30 bg-destructive/10 text-destructive",
  CANCELLED: "border-border bg-muted text-muted-foreground",
};

export function RequestStatusBadge({
  status,
  className,
}: {
  status: RequestStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", requestStatusClasses[status], className)}
    >
      {REQUEST_STATUS_LABELS[status]}
    </Badge>
  );
}

export function ApprovalStatusBadge({
  status,
  className,
}: {
  status: ApprovalStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", approvalStatusClasses[status], className)}
    >
      {APPROVAL_STATUS_LABELS[status]}
    </Badge>
  );
}
