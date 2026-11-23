import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  KeyRound,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
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
import { ROLE_LABELS } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/permissions/dates";

import {
  AccountDetailsForm,
  DeleteAccountForm,
  ResetCredentialsForm,
} from "./account-forms";

export const metadata: Metadata = {
  title: "Detail Akun",
};

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireRole("ADMIN");
  const { id } = await params;

  const account = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      createdAt: true,
      updatedAt: true,
      studentProfile: {
        select: {
          nis: true,
          grha: true,
          kelas: true,
        },
      },
      staffProfile: {
        select: {
          nip: true,
          canBeMentor: true,
        },
      },
    },
  });

  if (!account) {
    notFound();
  }

  const isSelf = account.id === admin.id;
  const activeAdmins =
    account.role === "ADMIN" && account.isActive
      ? await prisma.user.count({
          where: { role: "ADMIN", isActive: true },
        })
      : 2;

  const deleteDisabled =
    isSelf || (account.role === "ADMIN" && activeAdmins <= 1);
  const deleteDisabledReason = isSelf
    ? "Anda tidak dapat menghapus akun sendiri."
    : "Akun administrator aktif terakhir tidak dapat dihapus.";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detail Akun"
        description="Perbarui identitas akun, reset kredensial, atau hapus akun secara permanen beserta riwayatnya."
      >
        <Button variant="outline" asChild>
          <Link href="/admin/kelola-akun">
            <ArrowLeft />
            Kembali
          </Link>
        </Button>
      </PageHeader>

      <Card className="bg-linear-to-br from-primary/[0.05] via-card to-card">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
              <UserRound className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-semibold">
                  {account.fullName}
                </h2>
                <Badge variant="secondary">{ROLE_LABELS[account.role]}</Badge>
                <Badge
                  variant="outline"
                  className={
                    account.isActive
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {account.isActive ? "Aktif" : "Nonaktif"}
                </Badge>
                {account.mustChangePassword ? (
                  <Badge
                    variant="outline"
                    className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  >
                    Wajib setup akun
                  </Badge>
                ) : null}
                {isSelf ? <Badge variant="outline">Akun Anda</Badge> : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                @{account.username}
                {account.studentProfile
                  ? ` · ${account.studentProfile.nis} · ${account.studentProfile.kelas} · ${account.studentProfile.grha}`
                  : account.staffProfile?.nip
                    ? ` · NIP ${account.staffProfile.nip}`
                    : ""}
              </p>
            </div>
          </div>

          <div className="grid shrink-0 gap-1 text-xs text-muted-foreground sm:text-right">
            <span className="inline-flex items-center gap-1.5 sm:justify-end">
              <CalendarClock className="size-3.5" />
              Dibuat {formatDateTime(account.createdAt)}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="grid-cols-[auto_1fr] items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserRound className="size-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <CardTitle className="text-base">Data akun</CardTitle>
              <CardDescription>
                Username dapat direset melalui kartu Reset kredensial. NIS atau
                NIP harus unik di antara seluruh akun.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <AccountDetailsForm
              account={{
                id: account.id,
                role: account.role,
                fullName: account.fullName,
                username: account.username,
                nis: account.studentProfile?.nis ?? "",
                nip: account.staffProfile?.nip ?? "",
                grha: account.studentProfile?.grha ?? "",
                kelas: account.studentProfile?.kelas ?? "",
              }}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="grid-cols-[auto_1fr] items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <KeyRound className="size-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <CardTitle className="text-base">Reset kredensial</CardTitle>
                <CardDescription>
                  Buat ulang username dari nama dan kembalikan password ke 123456, lalu paksa setup akun saat login.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ResetCredentialsForm
                accountId={account.id}
                fullName={account.fullName}
                isSelf={isSelf}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="grid-cols-[auto_1fr] items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <Trash2 className="size-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <CardTitle className="text-base">Hapus akun</CardTitle>
                <CardDescription>
                  Hapus akun beserta pengajuan dan notifikasi terkait secara
                  permanen. Setelah dihapus, akun tidak muncul lagi di daftar.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <DeleteAccountForm
                accountId={account.id}
                fullName={account.fullName}
                disabled={deleteDisabled}
                disabledReason={deleteDisabledReason}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {account.role === "PEMBINA" ? (
        <div className="flex items-start gap-2.5 rounded-lg border bg-muted/30 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <p>
            Untuk mengatur apakah akun ini dapat dipilih pada pengajuan siswa,
            buka{" "}
            <Link
              href="/admin/pengaturan-perizinan"
              className="font-medium text-primary hover:underline"
            >
              Pengaturan Perizinan
            </Link>
            .
          </p>
        </div>
      ) : null}
    </div>
  );
}
