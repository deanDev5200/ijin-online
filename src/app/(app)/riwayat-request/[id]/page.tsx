import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { RequestDetail } from "@/components/permission/request-detail";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/guards";
import { isPendingStatus } from "@/lib/permissions/status";
import { findPermissionRequestDetail } from "@/lib/permissions/queries";

import { CancelRequestCard } from "./cancel-request-card";

export const metadata: Metadata = {
  title: "Detail Izin",
};

export default async function StudentRequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; updated?: string }>;
}) {
  const user = await requireRole("SISWA");
  const { id } = await params;
  const query = await searchParams;

  const request = await findPermissionRequestDetail(id);

  if (!request) {
    notFound();
  }

  const isIncluded = request.students.some(
    (item) => item.student.id === user.id,
  );

  if (!isIncluded) {
    notFound();
  }

  const canCancel =
    request.requesterId === user.id && isPendingStatus(request.status);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detail Izin"
        description="Pantau status persetujuan dan informasi lengkap pengajuan izin."
      >
        <Button variant="outline" asChild>
          <Link href="/riwayat-request">
            <ArrowLeft />
            Kembali ke riwayat
          </Link>
        </Button>
      </PageHeader>

      {query.created === "1" ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Pengajuan berhasil dikirim</p>
            <p className="text-primary/80">
              Pengajuan Anda sudah diteruskan ke Pembina/Pendamping yang dipilih.
            </p>
          </div>
        </div>
      ) : null}

      {query.updated === "1" ? (
        <div className="flex items-start gap-2.5 rounded-xl border bg-muted/60 px-4 py-3 text-sm">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="font-medium text-muted-foreground">
            Pengajuan izin berhasil dibatalkan.
          </p>
        </div>
      ) : null}

      <RequestDetail request={request}>
        {canCancel ? <CancelRequestCard requestId={request.id} /> : null}
      </RequestDetail>
    </div>
  );
}
