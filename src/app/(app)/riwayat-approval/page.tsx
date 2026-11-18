import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
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
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <FileClock className="size-6" />
            </div>
            <div>
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
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Keputusan terbaru</CardTitle>
              <CardDescription>
                Menampilkan {approvals.length} keputusan terbaru yang Anda
                berikan.
              </CardDescription>
            </CardHeader>
          </Card>

          {approvals.map((approval) => {
            const request = approval.request;
            const isApproved = approval.status === "APPROVED";

            return (
              <Link
                key={approval.id}
                href={`/permintaan-izin/${request.id}`}
                className="group block rounded-xl border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/30 sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
                        {isApproved ? <CheckCircle2 /> : <XCircle />}
                        {isApproved ? "Anda menyetujui" : "Anda menolak"}
                      </Badge>
                      <RequestStatusBadge status={request.status} />
                      {approval.actedAt ? (
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(approval.actedAt)}
                        </span>
                      ) : null}
                    </div>

                    <p className="text-base font-semibold tracking-tight text-balance">
                      {request.purpose}
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="size-3.5 shrink-0" />
                        {formatDateRange(request.startDate, request.endDate)}
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
                      <span>{formatTimeRange(request.startTime, request.endTime)}</span>
                    </div>

                    {approval.note ? (
                      <p className="rounded-lg bg-muted/60 px-2.5 py-2 text-xs leading-relaxed">
                        Catatan: {approval.note}
                      </p>
                    ) : null}
                  </div>

                  <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-primary">
                    Lihat detail
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
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
