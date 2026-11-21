import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ClipboardCheck, Inbox } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { RequestListItem } from "@/components/permission/request-list-item";
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
import { permissionRequestListSelect } from "@/lib/permissions/queries";
import { getStageByRole } from "@/lib/permissions/status";

export const metadata: Metadata = {
  title: "Permintaan Izin",
};

function getDescription(role: string): string {
  if (role === "PEMBINA") {
    return "Pengajuan yang memilih Anda sebagai Pembina/Pendamping dan menunggu keputusan Anda sesuai alur jenis izin.";
  }

  if (role === "STAFF_ASRAMA") {
    return "Pengajuan yang menunggu verifikasi Anda pada tahap Staff Asrama sesuai alur jenis izin.";
  }

  return "Pengajuan yang menunggu persetujuan akhir Anda pada tahap Kepala Asrama sesuai alur jenis izin.";
}

export default async function PermissionRequestsPage() {
  const user = await requireStaff();
  const stage = getStageByRole(user.role);

  if (!stage) {
    redirect("/dashboard");
  }

  const where = {
    status: stage.pendingStatus,
    ...(user.role === "PEMBINA" ? { mentorId: user.id } : {}),
  };

  const [requests, total] = await Promise.all([
    prisma.permissionRequest.findMany({
      where,
      orderBy: {
        createdAt: "asc",
      },
      take: 50,
      select: permissionRequestListSelect,
    }),
    prisma.permissionRequest.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permintaan Izin"
        description={getDescription(user.role)}
      >
        <Badge variant="secondary" className="gap-1.5">
          <ClipboardCheck className="size-3" />
          {total} menunggu
        </Badge>
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
              <Inbox className="size-6" />
            </div>
            <div className="relative">
              <p className="text-sm font-medium">
                Tidak ada permintaan yang menunggu
              </p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Pengajuan yang masuk ke tahap persetujuan Anda akan muncul di
                sini. Anda akan menerima notifikasi saat ada permintaan baru.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <Card>
            <CardHeader className="grid-cols-[auto_1fr_auto] items-center gap-3 py-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ClipboardCheck className="size-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <CardTitle className="text-sm">Antrean persetujuan</CardTitle>
                <CardDescription>
                  Diurutkan dari pengajuan paling lama. Keputusan pertama pada
                  tahap yang sama akan menghentikan antrean.
                </CardDescription>
              </div>
              <Badge variant="outline" className="hidden shrink-0 sm:inline-flex">
                {requests.length} menunggu
              </Badge>
            </CardHeader>
          </Card>

          {requests.map((request) => (
            <RequestListItem
              key={request.id}
              request={request}
              href={`/permintaan-izin/${request.id}`}
              showRequester
            />
          ))}
        </div>
      )}
    </div>
  );
}
