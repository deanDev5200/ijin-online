import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, GraduationCap, KeyRound, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/guards";
import { ROLE_LABELS } from "@/lib/auth/roles";

import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = {
  title: "Ganti Password",
};

const schoolName = process.env.NEXT_PUBLIC_SCHOOL_NAME ?? "Sekolah Asrama";
const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Ijin Online";

export default async function ChangePasswordPage() {
  const user = await requireUser();
  const forced = user.mustChangePassword;

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-muted/30 px-5 py-10">
      <div className="pointer-events-none absolute -top-32 -left-24 size-80 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-32 size-96 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="relative w-full max-w-lg">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="size-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              {schoolName}
            </p>
            <p className="text-sm font-semibold">{appName}</p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="space-y-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="size-5" />
            </div>
            <div className="space-y-1.5">
              <CardTitle className="text-xl">
                {forced ? "Amankan akun Anda" : "Ganti password"}
              </CardTitle>
              <CardDescription>
                {forced
                  ? "Sebelum mulai menggunakan aplikasi, ganti password awal Anda dengan password pribadi."
                  : "Perbarui password akun Anda secara berkala untuk menjaga keamanan."}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              <span className="font-medium">{user.fullName}</span>
              <span className="text-muted-foreground">
                {" "}
                · {user.username} · {ROLE_LABELS[user.role]}
              </span>
            </div>

            <ChangePasswordForm forced={forced} />
          </CardContent>
        </Card>

        {forced ? (
          <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-xs leading-relaxed text-amber-900 dark:text-amber-100">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <p>
              Anda harus mengganti password sebelum dapat mengakses halaman
              lain. Password baru akan langsung menggantikan password awal.
            </p>
          </div>
        ) : (
          <div className="mt-5 text-center">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">
                <ArrowLeft />
                Kembali ke dashboard
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
