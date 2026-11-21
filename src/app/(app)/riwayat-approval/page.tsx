import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileClock,
  MapPin,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { RequestStatusBadge } from "@/components/permission/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireStaff } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import {
  formatDateRange,
  formatDateTime,
  formatTimeRange,
} from "@/lib/permissions/dates";
import { permissionRequestListSelect } from "@/lib/permissions/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Riwayat Approval",
};

export default async function ApprovalHistoryPage() {
  const user = await requireStaff();

  const approvals = await prisma.approval.findMany({
    where: {
      approverId: user.id,
      status: {
        in: ["APPROVED", "REJECTED"],
      },
    },
    orderBy: {
      actedAt: "desc",
    },
    take: 50,
    select: {
      id: true,
      status: true,
      note: true,
      actedAt: true,
      step: true,
      request: {
        select: permissionRequestListSelect,
      },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat Approval"
        description="Telusuri kembali seluruh keputusan persetujuan yang pernah Anda berikan."
      >
        <Badge variant="secondary" className="gap-1.5">
          <FileClock className="size-3" />
          {approvals.length} keputusan
        </Badge>
      </PageHeader>

      {approvals.length === 0 ? (
        <Card className="bg-linear-to-b from-primary/[0.04] to-card">
          <CardContent className="relative flex flex-col items-center justify-center gap-3 overflow-hidden px-6 py-16 text-center">
            <div
              className="pointer-events-none absolute -top-10 left-1/2 size-36 -translate-x-1/2 rounded-full border border-primary/10"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -top-4 left-1/2 size-24 -translate-x-1/2 rounded-full bg-primary/[0.06]"
              aria-hidden="true"
            />
            <div className="relative flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/5">
              <FileClock className="size-6" />
            </div>
            <div className="relative">
              <p className="text-sm font-medium">Belum ada keputusan</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Keputusan persetujuan yang Anda berikan akan tercatat di sini
                beserta catatan dan waktu keputusannya.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <Card>
            <CardHeader className="grid-cols-[auto_1fr_auto] items-center gap-3 py-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileClock className="size-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <CardTitle className="text-sm">Keputusan terbaru</CardTitle>
                <CardDescription>
                  Menampilkan {approvals.length} keputusan terbaru yang Anda
                  berikan.
                </CardDescription>
              </div>
              <Badge variant="outline" className="hidden shrink-0 sm:inline-flex">
                {approvals.length} keputusan
              </Badge>
            </CardHeader>
          </Card>

          {approvals.map((approval) => {
            const request = approval.request;
            const isApproved = approval.status === "APPROVED";

            return (
              <Link
                key={approval.id}
                href={`/permintaan-izin/${request.id}`}
                className="group relative block overflow-hidden rounded-xl border bg-card p-4 shadow-xs transition-all hover:border-primary/30 hover:bg-accent/30 hover:shadow-sm sm:p-5"
              >
                <span
                  className={cn(
                    "pointer-events-none absolute inset-y-0 left-0 w-1 to-transparent opacity-70 transition-opacity group-hover:opacity-100",
                    isApproved
                      ? "bg-linear-to-b from-primary/40"
                      : "bg-linear-to-b from-destructive/40",
                  )}
                  aria-hidden="true"
                />
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-1 gap-3 sm:gap-4">
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1",
                        isApproved
                          ? "bg-primary/10 text-primary ring-primary/10"
                          : "bg-destructive/10 text-destructive ring-destructive/10",
                      )}
                    >
                      {isApproved ? (
                        <CheckCircle2 className="size-5" />
                      ) : (
                        <XCircle className="size-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            isApproved
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : "border-destructive/30 bg-destructive/10 text-destructive"
                          }
                        >
                          {isApproved ? "Anda menyetujui" : "Anda menolak"}
                        </Badge>
                        <RequestStatusBadge status={request.status} />
                        {approval.actedAt ? (
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(approval.actedAt)}
                          </span>
                        ) : null}
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
                          {formatTimeRange(
                            request.startTime,
                            request.endTime,
                          )}
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
                          <UserRound className="size-3.5 shrink-0" />
                          Pengaju: {request.requester.fullName}
                        </span>
                      </div>

                      {approval.note ? (
                        <p className="rounded-lg border border-border/60 bg-muted/60 px-2.5 py-2 text-xs leading-relaxed">
                          Catatan: {approval.note}
                        </p>
                      ) : null}
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
          })}
        </div>
      )}
    </div>
  );
}
