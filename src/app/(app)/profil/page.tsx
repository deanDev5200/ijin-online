import type { Metadata } from "next";
import Link from "next/link";
import {
  GraduationCap,
  KeyRound,
  LockKeyhole,
  School,
  ShieldCheck,
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
import { Separator } from "@/components/ui/separator";
import { requireAppUser } from "@/lib/auth/guards";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/auth/roles";

import { ProfileNameForm } from "./profile-name-form";

export const metadata: Metadata = {
  title: "Profil",
};

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2.5">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}

export default async function ProfilePage() {
  const user = await requireAppUser();
  const isStudent = user.role === "SISWA";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil"
        description="Lihat informasi akun Anda dan perbarui data yang diizinkan."
      >
        <Badge variant="outline" className="gap-1.5">
          <ShieldCheck className="size-3 text-primary" />
          {ROLE_LABELS[user.role]}
        </Badge>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="grid-cols-[auto_1fr] items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserRound className="size-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <CardTitle className="text-base">Informasi pribadi</CardTitle>
              <CardDescription>
                Nama lengkap dapat Anda ubah sendiri. Data lain dikelola oleh
                administrator asrama.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <ProfileNameForm fullName={user.fullName} />
            <Separator />
            <dl className="grid gap-4 sm:grid-cols-2">
              <InfoItem label="Username" value={user.username} />
              <InfoItem label="Peran" value={ROLE_LABELS[user.role]} />
              <InfoItem
                label="Status akun"
                value={user.mustChangePassword ? "Perlu ganti password" : "Aktif"}
              />
              <InfoItem
                label="Deskripsi peran"
                value={ROLE_DESCRIPTIONS[user.role]}
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="grid-cols-[auto_1fr] items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {isStudent ? (
                <GraduationCap className="size-4" />
              ) : (
                <School className="size-4" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <CardTitle className="text-base">
                {isStudent ? "Data akademik" : "Data kepegawaian"}
              </CardTitle>
              <CardDescription>
                Data ini hanya dapat diubah oleh administrator asrama.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {isStudent ? (
                <>
                  <InfoItem label="NIS" value={user.nis} />
                  <InfoItem label="Kelas" value={user.kelas} />
                  <InfoItem label="Grha" value={user.grha} />
                </>
              ) : (
                <InfoItem label="NIP" value={user.nip} />
              )}
            </dl>
            <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-background text-primary ring-1 ring-foreground/10">
                <LockKeyhole className="size-3.5" />
              </span>
              <p>
                Hubungi administrator asrama jika ada data yang perlu
                diperbaiki.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="grid-cols-[auto_1fr] items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="size-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base">Keamanan akun</CardTitle>
            <CardDescription>
              Ganti password secara berkala untuk menjaga keamanan akun Anda.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Password akun</p>
            <p className="text-sm text-muted-foreground">
              Gunakan minimal 6 karakter yang sulit ditebak.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/ganti-password">
              <KeyRound />
              Ganti password
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
