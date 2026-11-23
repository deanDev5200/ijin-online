"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import {
  GraduationCap,
  Info,
  Loader2,
  Save,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";

import { FormFeedback } from "@/components/form-feedback";
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
import {
  generateStaffUsername,
  generateUsername,
  INITIAL_PASSWORD,
} from "@/lib/accounts/username";
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
  const [fullName, setFullName] = useState(state.values?.fullName ?? "");

  const errors = state.fieldErrors;
  const usernamePreview = fullName.trim()
    ? kind === "STAFF"
      ? generateStaffUsername(fullName)
      : generateUsername(fullName)
    : "—";
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
                Pembina, Pegawai, Staff Asrama, Kepala Asrama, Wakasek
                Kesiswaan, Guru, Wakasek Akademik, atau Kepala Sekolah. NIP wajib
                diisi saat menambah akun manual.
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
                <option value="STAFF_ASRAMA">Pegawai</option>
                <option value="STAFF_ASRAMA_TAMBAHAN">Staff Asrama</option>
                <option value="KEPALA_ASRAMA">Kepala Asrama</option>
                <option value="WAKASEK_KESISWAAN">Wakasek Kesiswaan</option>
                <option value="GURU">Guru</option>
                <option value="WAKASEK_AKADEMIK">Wakasek Akademik</option>
                <option value="KEPALA_SEKOLAH">Kepala Sekolah</option>
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
            Username dibuat otomatis dari nama lengkap, sehingga hanya nama
            yang perlu diisi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nama lengkap</Label>
              <Input
                id="fullName"
                name="fullName"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
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
              <Label htmlFor="usernamePreview">Username otomatis</Label>
              <div
                id="usernamePreview"
                className="flex h-10 items-center rounded-lg border bg-muted/40 px-3 font-mono text-sm text-foreground"
              >
                {usernamePreview}
              </div>
              <p className="text-xs text-muted-foreground">
                {kind === "STAFF"
                  ? "Diambil dari dua kata pertama nama (tanpa awalan I/Ni), huruf kecil, maksimal 9 karakter. Contoh: Gede Sucipta, S.Pd → gedesucip."
                  : "Diambil dari kata terakhir nama, huruf kecil, maksimal 6 karakter."}{" "}
                Jika bentrok, angka unik ditambahkan otomatis.
              </p>
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
            Kredensial awal dibuat sistem dan wajib diganti pengguna saat login
            pertama.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-3 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="space-y-1 text-muted-foreground">
              <p>
                Password awal:{" "}
                <span className="font-mono font-semibold text-foreground">
                  {INITIAL_PASSWORD}
                </span>
              </p>
              <p className="text-xs leading-relaxed">
                Saat pertama kali masuk, pengguna akan diminta membuat username
                pribadi (maksimal 8 karakter) dan password sendiri. Perubahan
                tersebut langsung tersimpan di database.
              </p>
            </div>
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
