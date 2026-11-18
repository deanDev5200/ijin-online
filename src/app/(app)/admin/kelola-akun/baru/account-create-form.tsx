"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import {
  GraduationCap,
  Loader2,
  Save,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";

import { FormFeedback } from "@/components/form-feedback";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  INITIAL_ACCOUNT_ACTION_STATE,
  type AccountActionState,
} from "@/lib/accounts/form-state";
import { cn } from "@/lib/utils";

import { createAccountAction } from "../actions";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-destructive">{message}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="h-10" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          Menyimpan...
        </>
      ) : (
        <>
          <Save />
          Buat akun
        </>
      )}
    </Button>
  );
}

export function AccountCreateForm() {
  const [state, formAction] = useActionState<
    AccountActionState,
    FormData
  >(createAccountAction, INITIAL_ACCOUNT_ACTION_STATE);
  const [kind, setKind] = useState<"SISWA" | "STAFF">(() =>
    state.values?.role && state.values.role !== "SISWA" ? "STAFF" : "SISWA",
  );

  const errors = state.fieldErrors;
  const staffRole =
    state.values?.role && state.values.role !== "SISWA"
      ? state.values.role
      : "PEMBINA";

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRoundCog className="size-4 text-primary" />
            Jenis akun
          </CardTitle>
          <CardDescription>
            Pilih apakah akun ini untuk siswa atau tenaga kependidikan asrama.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
              kind === "SISWA" && "border-primary bg-primary/5",
            )}
          >
            <input
              type="radio"
              name="accountKind"
              value="SISWA"
              checked={kind === "SISWA"}
              onChange={() => setKind("SISWA")}
              className="mt-1 accent-primary"
            />
            <span className="space-y-1">
              <span className="flex items-center gap-2 text-sm font-medium">
                <GraduationCap className="size-4 text-primary" />
                Akun siswa
              </span>
              <span className="block text-xs leading-relaxed text-muted-foreground">
                Memiliki NIS, grha, dan kelas. Dapat mengajukan izin asrama.
              </span>
            </span>
          </label>

          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
              kind === "STAFF" && "border-primary bg-primary/5",
            )}
          >
            <input
              type="radio"
              name="accountKind"
              value="STAFF"
              checked={kind === "STAFF"}
              onChange={() => setKind("STAFF")}
              className="mt-1 accent-primary"
            />
            <span className="space-y-1">
              <span className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="size-4 text-primary" />
                Tenaga kependidikan
              </span>
              <span className="block text-xs leading-relaxed text-muted-foreground">
                Pembina, Staff Asrama, atau Kepala Asrama dengan NIP.
              </span>
            </span>
          </label>

          {kind === "SISWA" ? (
            <input type="hidden" name="role" value="SISWA" />
          ) : (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="role">Peran</Label>
              <select
                id="role"
                name="role"
                defaultValue={staffRole}
                className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
              >
                <option value="PEMBINA">Pembina / Pendamping</option>
                <option value="STAFF_ASRAMA">Staff Asrama</option>
                <option value="KEPALA_ASRAMA">Kepala Asrama</option>
              </select>
              <FieldError message={errors?.role?.[0]} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="size-4 text-primary" />
            Identitas akun
          </CardTitle>
          <CardDescription>
            Nama lengkap dan username digunakan untuk masuk ke aplikasi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nama lengkap</Label>
              <Input
                id="fullName"
                name="fullName"
                defaultValue={state.values?.fullName ?? ""}
                placeholder="cth. Ahmad Fauzi"
                required
                minLength={3}
                maxLength={100}
                aria-invalid={Boolean(errors?.fullName?.[0])}
                className="h-10"
              />
              <FieldError message={errors?.fullName?.[0]} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                defaultValue={state.values?.username ?? ""}
                placeholder="cth. ahmad.fauzi"
                required
                minLength={5}
                maxLength={20}
                autoComplete="off"
                aria-invalid={Boolean(errors?.username?.[0])}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                5–20 karakter, tanpa spasi. Huruf akan disimpan dalam bentuk
                kecil.
              </p>
              <FieldError message={errors?.username?.[0]} />
            </div>
          </div>

          {kind === "SISWA" ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="nis">NIS</Label>
                <Input
                  id="nis"
                  name="nis"
                  defaultValue={state.values?.nis ?? ""}
                  placeholder="cth. 24001"
                  required
                  aria-invalid={Boolean(errors?.nis?.[0])}
                  className="h-10"
                />
                <FieldError message={errors?.nis?.[0]} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kelas">Kelas</Label>
                <Input
                  id="kelas"
                  name="kelas"
                  defaultValue={state.values?.kelas ?? ""}
                  placeholder="cth. X IPA 1"
                  required
                  aria-invalid={Boolean(errors?.kelas?.[0])}
                  className="h-10"
                />
                <FieldError message={errors?.kelas?.[0]} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="grha">Grha</Label>
                <Input
                  id="grha"
                  name="grha"
                  defaultValue={state.values?.grha ?? ""}
                  placeholder="cth. Grha A"
                  required
                  aria-invalid={Boolean(errors?.grha?.[0])}
                  className="h-10"
                />
                <FieldError message={errors?.grha?.[0]} />
              </div>
            </div>
          ) : (
            <div className="space-y-2 sm:max-w-sm">
              <Label htmlFor="nip">NIP</Label>
              <Input
                id="nip"
                name="nip"
                defaultValue={state.values?.nip ?? ""}
                placeholder="cth. 198501012010012001"
                required
                aria-invalid={Boolean(errors?.nip?.[0])}
                className="h-10"
              />
              <FieldError message={errors?.nip?.[0]} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-primary" />
            Keamanan akun
          </CardTitle>
          <CardDescription>
            Password awal wajib diganti pengguna saat login pertama.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Password awal</Label>
            <PasswordInput
              id="password"
              name="password"
              placeholder="Minimal 6 karakter"
              required
              minLength={6}
              maxLength={72}
              autoComplete="new-password"
              aria-invalid={Boolean(errors?.password?.[0])}
              className="h-10"
            />
            <FieldError message={errors?.password?.[0]} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Ulangi password</Label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Ulangi password awal"
              required
              minLength={6}
              maxLength={72}
              autoComplete="new-password"
              aria-invalid={Boolean(errors?.confirmPassword?.[0])}
              className="h-10"
            />
            <FieldError message={errors?.confirmPassword?.[0]} />
          </div>
        </CardContent>
      </Card>

      <FormFeedback state={state} />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" size="lg" className="h-10" asChild>
          <Link href="/admin/kelola-akun">Batal</Link>
        </Button>
        <SubmitButton />
      </div>
    </form>
  );
}
