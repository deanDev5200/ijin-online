import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, KeyRound, ShieldCheck } from "lucide-react";

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
  AccountStatusForm,
  ResetPasswordForm,
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
          nip: true
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

  const statusDisabled =
    isSelf || (account.role === "ADMIN" && activeAdmins <= 1);
  const statusDisabledReason = isSelf
    ? "Anda tidak dapat mengubah status akun sendiri."
    : "Akun administrator aktif terakhir tidak dapat dinonaktifkan.";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detail Akun"
        description="Perbarui identitas akun, reset password, atau ubah status akses tanpa menghapus riwayat."
      >
        <Button variant="outline" asChild>
          <Link href="/admin/kelola-akun">
            <ArrowLeft />
            Kembali
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                  Wajib ganti password
                </Badge>
              ) : null}
              {isSelf ? <Badge variant="outline">Akun Anda</Badge> : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              @{account.username}
              {account.studentProfile
                ? ` · ${account.studentProfile.nis} · ${account.studentProfile.kelas} · ${account.studentProfile.grha}`
                : account.staffProfile
                  ? ` · NIP ${account.staffProfile.nip}`
                  : ""}
            </p>
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
          <CardHeader>
            <CardTitle className="text-base">Data akun</CardTitle>
            <CardDescription>
              Username digunakan untuk login. NIS atau NIP harus unik di antara
              seluruh akun.
            </CardDescription>
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="size-4 text-primary" />
                Reset password
              </CardTitle>
              <CardDescription>
                Tetapkan password baru dan paksa penggantian saat login.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResetPasswordForm
                accountId={account.id}
                fullName={account.fullName}
                disabled={isSelf}
                disabledReason="Gunakan halaman Profil untuk mengganti password akun Anda sendiri."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="size-4 text-primary" />
                Status akun
              </CardTitle>
              <CardDescription>
                Menonaktifkan akun tidak menghapus riwayat pengajuan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccountStatusForm
                accountId={account.id}
                isActive={account.isActive}
                disabled={statusDisabled}
                disabledReason={statusDisabledReason}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
