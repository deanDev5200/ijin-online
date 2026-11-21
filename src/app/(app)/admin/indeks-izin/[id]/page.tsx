import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { RequestDetail } from "@/components/permission/request-detail";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/guards";
import { findPermissionRequestDetail } from "@/lib/permissions/queries";

export const metadata: Metadata = {
  title: "Detail Izin",
};

export default async function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN");
  const { id } = await params;

  const request = await findPermissionRequestDetail(id);

  if (!request) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detail Izin"
        description="Lihat informasi lengkap pengajuan dan keputusan penyetujunya."
      >
        <Button variant="outline" asChild>
          <Link href="/admin/indeks-izin">
            <ArrowLeft />
            Kembali ke indeks
          </Link>
        </Button>
      </PageHeader>

      <RequestDetail request={request} />
    </div>
  );
}
