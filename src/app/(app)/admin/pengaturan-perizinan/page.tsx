import type { Metadata } from "next";
import {
  ChevronRight,
  ClipboardList,
  Clock3,
  PlusCircle,
  Settings2,
  ShieldCheck,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { approvalLabel, getPermissionTypeConfig } from "@/lib/permissions/config";
import { getPermissionSettings } from "@/lib/permissions/settings";

import {
  PermissionSettingsForm,
  PermissionTypeCreateForm,
  PermissionTypeEditForm,
} from "./settings-forms";

export const metadata: Metadata = {
  title: "Pengaturan Perizinan",
};

export default async function PermissionSettingsPage() {
  await requireRole("ADMIN");

  const [settings, types] = await Promise.all([
    getPermissionSettings(),
    prisma.permissionType.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        sortOrder: true,
        approvalRoles: true,
        requiredFields: true,
        fieldLabels: true,
        approvalLabels: true,
        formGuide: true,
        _count: {
          select: {
            requests: true,
          },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Perizinan"
        description="Atur jenis izin, ketentuan pengajuan, dan satu penyetuju untuk setiap jenis izin."
      />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="size-4 text-primary" />
              Ketentuan pengajuan
            </CardTitle>
            <CardDescription>
              Aturan ini diperiksa saat siswa mengirim pengajuan dan digunakan
              sebagai nilai bawaan pada formulir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PermissionSettingsForm
              settings={{
                minLeadDays: settings.minLeadDays,
                maxRangeDays: settings.maxRangeDays,
                maxStudentsPerRequest: settings.maxStudentsPerRequest,
                approvalDeadlineDays: settings.approvalDeadlineDays,
                defaultStartTime: settings.defaultStartTime,
                defaultEndTime: settings.defaultEndTime,
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-primary" />
              Penyetuju per jenis izin
            </CardTitle>
            <CardDescription>
              Setiap jenis izin cukup satu penyetuju. Ubah melalui panel jenis
              izin di bawah.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {types.slice(0, 6).map((type) => {
                const config = getPermissionTypeConfig(type);

                return (
                  <div key={type.id} className="rounded-xl border bg-background p-3">
                    <p className="text-sm font-medium">{type.name}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {config.approvalRoles.map((role) => (
                        <Badge
                          key={role}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {approvalLabel(config, role)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
              {types.length === 0 ? (
                <p className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                  Belum ada jenis izin yang dikonfigurasi.
                </p>
              ) : null}
            </div>

            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              <p className="flex items-center gap-1.5 font-medium text-foreground">
                <Clock3 className="size-3.5" />
                Batas waktu persetujuan {settings.approvalDeadlineDays} hari
              </p>
              <p className="mt-1">
                Pengajuan yang belum selesai melewati batas ini ditandai pada
                Indeks Izin.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="size-4 text-primary" />
            Jenis izin
          </CardTitle>
          <CardDescription>
            Jenis izin aktif akan muncul pada formulir pengajuan siswa. Jenis
            yang dinonaktifkan tetap tersimpan pada riwayat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {types.length === 0 ? (
            <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              Belum ada jenis izin. Tambahkan satu jenis izin agar siswa dapat
              mengajukan.
            </p>
          ) : (
            types.map((type) => (
              <details
                key={type.id}
                className="group rounded-xl border bg-background"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 p-3 [&::-webkit-details-marker]:hidden">
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">{type.name}</p>
                      <Badge
                        variant="outline"
                        className={
                          type.isActive
                            ? "border-primary/30 bg-primary/10 text-[10px] text-primary"
                            : "bg-muted text-[10px] text-muted-foreground"
                        }
                      >
                        {type.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        Urutan {type.sortOrder}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {type._count.requests} pengajuan menggunakan jenis ini
                    </p>
                  </div>
                </summary>
                <div className="border-t p-4">
                  <PermissionTypeEditForm
                    type={{
                      id: type.id,
                      name: type.name,
                      description: type.description ?? "",
                      isActive: type.isActive,
                      sortOrder: type.sortOrder,
                      config: getPermissionTypeConfig(type),
                    }}
                  />
                </div>
              </details>
            ))
          )}

          <details className="group rounded-xl border border-dashed bg-muted/20">
            <summary className="flex cursor-pointer list-none items-center gap-2 p-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
              <PlusCircle className="size-4 text-primary" />
              Tambah jenis izin
              <ChevronRight className="ml-auto size-4 text-muted-foreground transition-transform group-open:rotate-90" />
            </summary>
            <div className="border-t p-4">
              <PermissionTypeCreateForm />
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}
