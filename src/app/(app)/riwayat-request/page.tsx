import type { Metadata } from "next";
import Link from "next/link";
import { FilePlus2, History } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { RequestListItem } from "@/components/permission/request-list-item";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { permissionRequestListSelect } from "@/lib/permissions/queries";

export const metadata: Metadata = {
  title: "Riwayat Izin",
};

export default async function RequestHistoryPage() {
  const user = await requireRole("SISWA");

  const requests = await prisma.permissionRequest.findMany({
    where: {
      students: {
        some: {
          studentId: user.id,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
    select: permissionRequestListSelect,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat Izin"
        description="Lihat seluruh pengajuan izin yang Anda buat atau ikuti beserta status persetujuannya."
      >
        <Button asChild>
          <Link href="/request-izin">
            <FilePlus2 />
            Ajukan izin
          </Link>
        </Button>
      </PageHeader>

      {requests.length === 0 ? (
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
              <History className="size-6" />
            </div>
            <div className="relative">
              <p className="text-sm font-medium">Belum ada pengajuan izin</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Pengajuan yang Anda buat atau ikuti akan muncul di sini beserta
                status persetujuannya.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/request-izin">
                <FilePlus2 />
                Buat pengajuan pertama
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <Card>
            <CardHeader className="grid-cols-[auto_1fr_auto] items-center gap-3 py-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <History className="size-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <CardTitle className="text-sm">Pengajuan terbaru</CardTitle>
                <CardDescription>
                  Menampilkan {requests.length} pengajuan terbaru yang melibatkan
                  Anda.
                </CardDescription>
              </div>
              <Badge variant="outline" className="hidden shrink-0 sm:inline-flex">
                {requests.length} izin
              </Badge>
            </CardHeader>
          </Card>

          {requests.map((request) => (
            <RequestListItem
              key={request.id}
              request={request}
              href={`/riwayat-request/${request.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
