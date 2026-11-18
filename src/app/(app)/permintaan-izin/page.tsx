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
    return "Pengajuan yang memilih Anda sebagai Pembina/Pendamping dan menunggu persetujuan tahap pertama.";
  }

  if (role === "STAFF_ASRAMA") {
    return "Pengajuan yang telah disetujui Pembina/Pendamping dan menunggu verifikasi Staff Asrama.";
  }

  return "Pengajuan yang telah disetujui Staff Asrama dan menunggu persetujuan akhir Kepala Asrama.";
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
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Inbox className="size-6" />
            </div>
            <div>
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
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Antrean persetujuan</CardTitle>
              <CardDescription>
                Diurutkan dari pengajuan paling lama. Keputusan pertama pada
                tahap yang sama akan menghentikan antrean.
              </CardDescription>
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
