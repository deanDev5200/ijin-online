import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  FileText,
  MapPin,
  UserRound,
  UsersRound,
} from "lucide-react";

import { RequestStatusBadge } from "@/components/permission/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  formatDateRange,
  formatDateTime,
  formatTimeRange,
} from "@/lib/permissions/dates";
import type { PermissionRequestListEntry } from "@/lib/permissions/queries";
import { isPendingStatus } from "@/lib/permissions/status";
import { cn } from "@/lib/utils";

export function RequestListItem({
  request,
  href,
  showRequester = false,
  deadlineDays,
  now,
  className,
}: {
  request: PermissionRequestListEntry;
  href: string;
  showRequester?: boolean;
  deadlineDays?: number;
  now?: Date;
  className?: string;
}) {
  const isOverdue =
    typeof deadlineDays === "number" &&
    now !== undefined &&
    isPendingStatus(request.status) &&
    request.createdAt.getTime() + deadlineDays * 86_400_000 < now.getTime();

  return (
    <Link
      href={href}
      className={cn(
        "group relative block overflow-hidden rounded-xl border bg-card p-4 shadow-xs transition-all hover:border-primary/30 hover:bg-accent/30 hover:shadow-sm sm:p-5",
        className,
      )}
    >
      <span
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-linear-to-b from-primary/40 to-transparent opacity-70 transition-opacity group-hover:opacity-100"
        aria-hidden="true"
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 gap-3 sm:gap-4">
          <div className="hidden size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10 sm:flex">
            <FileText className="size-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <RequestStatusBadge status={request.status} />
              <Badge variant="outline" className="text-[10px]">
                {request.type.name}
              </Badge>
              {isOverdue ? (
                <Badge
                  variant="outline"
                  className="border-destructive/30 bg-destructive/10 text-[10px] text-destructive"
                >
                  Melewati batas waktu
                </Badge>
              ) : null}
              <span className="text-xs text-muted-foreground">
                Diajukan {formatDateTime(request.createdAt)}
              </span>
            </div>

            <div className="space-y-0.5">
              <p className="text-[10px] font-medium tracking-wide text-muted-foreground/80 uppercase">
                Tujuan pengajuan
              </p>
              <p className="text-base font-semibold tracking-tight text-balance">
                {request.purpose}
              </p>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1.5 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5 shrink-0" />
                {formatDateRange(request.startDate, request.endDate)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-3.5 shrink-0" />
                {formatTimeRange(request.startTime, request.endTime)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0" />
                {request.place}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UsersRound className="size-3.5 shrink-0" />
                {request.students.length} siswa
              </span>
              <span className="inline-flex items-center gap-1.5">
                {showRequester ? (
                  <>
                    <UserRound className="size-3.5 shrink-0" />
                    Pengaju: {request.requester.fullName}
                  </>
                ) : (
                  <>
                    <UserRound className="size-3.5 shrink-0" />
                    Pembina: {request.mentor?.fullName ?? "-"}
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-primary">
          Lihat detail
          <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </span>
      </div>
    </Link>
  );
}
