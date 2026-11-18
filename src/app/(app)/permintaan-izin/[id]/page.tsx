import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { RequestDetail } from "@/components/permission/request-detail";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth/guards";
import {
  canUserActOnRequest,
  canUserViewStaffRequest,
} from "@/lib/permissions/status";
import { findPermissionRequestDetail } from "@/lib/permissions/queries";

import { ApprovalForm } from "./approval-form";

export const metadata: Metadata = {
  title: "Detail Permintaan",
};

export default async function StaffRequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const user = await requireStaff();
  const { id } = await params;
  const query = await searchParams;

  const request = await findPermissionRequestDetail(id);

  if (!request || !canUserViewStaffRequest(user, request)) {
    notFound();
  }

  const canAct = canUserActOnRequest(user, request);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detail Permintaan"
        description="Tinjau informasi pengajuan sebelum memberikan keputusan persetujuan."
      >
        <Button variant="outline" asChild>
          <Link href="/permintaan-izin">
            <ArrowLeft />
            Kembali ke antrean
          </Link>
        </Button>
      </PageHeader>

      {query.updated === "1" ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Keputusan berhasil disimpan</p>
            <p className="text-primary/80">
              Status pengajuan telah diperbarui dan notifikasi telah dikirim.
            </p>
          </div>
        </div>
      ) : null}

      <RequestDetail request={request} highlightRole={user.role}>
        {canAct ? <ApprovalForm requestId={request.id} /> : null}
      </RequestDetail>
    </div>
  );
}
