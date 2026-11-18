import type { Metadata } from "next";
import Link from "next/link";
import { FilePlus2, History } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { RequestListItem } from "@/components/permission/request-list-item";
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
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <History className="size-6" />
            </div>
            <div>
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
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Pengajuan terbaru</CardTitle>
              <CardDescription>
                Menampilkan {requests.length} pengajuan terbaru yang melibatkan
                Anda.
              </CardDescription>
            </CardHeader>
          </Card>

          {requests.map((request) => (
            <RequestListItem
              key={request.id}
              request={request}
              href={`/riwayat-request/${request.id}`}
              showRequester
            />
          ))}
        </div>
      )}
    </div>
  );
}
