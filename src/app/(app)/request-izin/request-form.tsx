"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import {
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  Loader2,
  LockKeyhole,
  MapPin,
  Save,
  UserRound,
  UsersRound,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { addDaysToDateOnly } from "@/lib/permissions/dates";
import {
  INITIAL_PERMISSION_REQUEST_FORM_STATE,
  type PermissionRequestFormState,
} from "@/lib/permissions/form-state";
import { cn } from "@/lib/utils";

import { createPermissionRequestAction } from "./actions";
import {
  StudentPicker,
  type SelectableStudent,
} from "./student-picker";

type Requester = {
  id: string;
  fullName: string;
  nis: string | null;
  kelas: string | null;
  grha: string | null;
};

type MentorOption = {
  id: string;
  fullName: string;
  nip: string | null;
};

type PermissionTypeOption = {
  id: string;
  name: string;
  description: string | null;
};

type RequestRules = {
  minLeadDays: number;
  maxRangeDays: number;
  maxStudentsPerRequest: number;
  defaultStartTime: string;
  defaultEndTime: string;
};

const textareaClassName =
  "min-h-28 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

const selectClassName =
  "h-10 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-destructive">{message}</p>;
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      className="h-10"
      disabled={pending || disabled}
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          Mengirim...
        </>
      ) : (
        <>
          <Save />
          Kirim pengajuan
        </>
      )}
    </Button>
  );
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function PermissionRequestForm({
  requester,
  students,
  mentors,
  types,
  settings,
  today,
}: {
  requester: Requester;
  students: SelectableStudent[];
  mentors: MentorOption[];
  types: PermissionTypeOption[];
  settings: RequestRules;
  today: string;
}) {
  const [state, formAction] = useActionState<
    PermissionRequestFormState,
    FormData
  >(createPermissionRequestAction, INITIAL_PERMISSION_REQUEST_FORM_STATE);

  const [dateMode, setDateMode] = useState<"single" | "range">(
    state.values?.dateMode ?? "single",
  );

  const errors = state.fieldErrors;
  const requesterMeta = [requester.nis, requester.kelas, requester.grha]
    .filter(Boolean)
    .join(" · ");
  const earliestStart = addDaysToDateOnly(today, settings.minLeadDays);
  const maxOtherStudents = Math.max(0, settings.maxStudentsPerRequest - 1);
  const selectedTypeId =
    state.values?.typeId ??
    (types.length === 1 ? types[0]?.id ?? "" : "");

  const mentorDefault =
    state.values?.mentorId ??
    (mentors.length === 1 ? mentors[0]?.id ?? "" : "");

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="size-4 text-primary" />
            Jenis izin
          </CardTitle>
          <CardDescription>
            Jenis izin yang tersedia saat ini untuk siswa asrama.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {types.length === 0 ? (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertTitle>Belum ada jenis izin aktif</AlertTitle>
              <AlertDescription>
                Hubungi administrator asrama untuk mengaktifkan jenis izin
                sebelum mengajukan.
              </AlertDescription>
            </Alert>
          ) : types.length === 1 ? (
            <>
              <input type="hidden" name="typeId" value={selectedTypeId} />
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm font-semibold">{types[0]?.name}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {types[0]?.description ??
                    "Jenis izin ini berlaku untuk pengajuan dispensasi asrama."}
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="typeId">Pilih jenis izin</Label>
              <select
                id="typeId"
                name="typeId"
                defaultValue={selectedTypeId}
                required
                aria-invalid={Boolean(errors?.typeId?.[0])}
                className={selectClassName}
              >
                <option value="" disabled>
                  Pilih jenis izin
                </option>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <FieldError message={errors?.typeId?.[0]} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UsersRound className="size-4 text-primary" />
            Siswa yang terlibat
          </CardTitle>
          <CardDescription>
            Anda otomatis tercantum sebagai siswa pertama. Tambahkan siswa lain
            yang mengikuti kegiatan yang sama.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {getInitials(requester.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate text-sm font-medium">
                  {requester.fullName}
                </p>
                <Badge variant="secondary" className="text-[10px]">
                  Pengaju
                </Badge>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {requesterMeta || "Data akademik belum lengkap"}
              </p>
            </div>
            <LockKeyhole
              className="size-4 shrink-0 text-muted-foreground"
              aria-label="Terkunci sebagai pengaju"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="student-search">
              Tambah siswa lain{" "}
              <span className="font-normal text-muted-foreground">
                (opsional)
              </span>
            </Label>
            <StudentPicker
              students={students}
              requesterId={requester.id}
              initialSelectedIds={state.values?.studentIds ?? []}
              maxStudents={maxOtherStudents}
            />
            <p className="text-xs text-muted-foreground">
              Maksimal {settings.maxStudentsPerRequest} siswa per pengajuan,
              termasuk Anda sebagai pengaju.
            </p>
            <FieldError message={errors?.studentIds?.[0]} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="size-4 text-primary" />
            Detail kegiatan
          </CardTitle>
          <CardDescription>
            Jelaskan kegiatan dan tempat pelaksanaannya secara singkat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="purpose">Tujuan kegiatan</Label>
            <textarea
              id="purpose"
              name="purpose"
              defaultValue={state.values?.purpose ?? ""}
              placeholder="cth. Mengikuti lomba debat antar sekolah"
              required
              minLength={5}
              maxLength={200}
              aria-invalid={Boolean(errors?.purpose?.[0])}
              className={textareaClassName}
            />
            <p className="text-xs text-muted-foreground">
              Maksimal 200 karakter. Sertakan nama kegiatan yang jelas.
            </p>
            <FieldError message={errors?.purpose?.[0]} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="place">Tempat kegiatan</Label>
            <Input
              id="place"
              name="place"
              type="text"
              defaultValue={state.values?.place ?? ""}
              placeholder="cth. Aula SMA Negeri 1"
              required
              minLength={3}
              maxLength={150}
              aria-invalid={Boolean(errors?.place?.[0])}
              className="h-10"
            />
            <FieldError message={errors?.place?.[0]} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4 text-primary" />
            Jadwal izin
          </CardTitle>
          <CardDescription>
            Tentukan tanggal dan jam berlakunya izin. Untuk kegiatan beberapa
            hari, gunakan rentang tanggal.
          </CardDescription>
          <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <p>
              Pengajuan paling cepat{" "}
              {settings.minLeadDays === 0
                ? "pada hari yang sama"
                : `${settings.minLeadDays} hari sebelum tanggal mulai`}{" "}
              dan durasi maksimal {settings.maxRangeDays} hari kalender.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Durasi izin</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-2.5 transition-colors",
                  dateMode === "single" && "border-primary bg-primary/5",
                )}
              >
                <input
                  type="radio"
                  name="dateMode"
                  value="single"
                  checked={dateMode === "single"}
                  onChange={() => setDateMode("single")}
                  className="mt-1 accent-primary"
                />
                <span>
                  <span className="block text-sm font-medium">Satu hari</span>
                  <span className="block text-xs text-muted-foreground">
                    Kegiatan selesai di hari yang sama.
                  </span>
                </span>
              </label>

              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-2.5 transition-colors",
                  dateMode === "range" && "border-primary bg-primary/5",
                )}
              >
                <input
                  type="radio"
                  name="dateMode"
                  value="range"
                  checked={dateMode === "range"}
                  onChange={() => setDateMode("range")}
                  className="mt-1 accent-primary"
                />
                <span>
                  <span className="block text-sm font-medium">
                    Rentang tanggal
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Kegiatan berlangsung lebih dari satu hari.
                  </span>
                </span>
              </label>
            </div>
            <FieldError message={errors?.dateMode?.[0]} />
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                {dateMode === "single" ? "Tanggal izin" : "Tanggal mulai"}
              </Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={state.values?.startDate ?? earliestStart}
                min={earliestStart}
                required
                aria-invalid={Boolean(errors?.startDate?.[0])}
                className="h-10"
              />
              <FieldError message={errors?.startDate?.[0]} />
            </div>

            {dateMode === "range" ? (
              <div className="space-y-2">
                <Label htmlFor="endDate">Tanggal selesai</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  defaultValue={
                    state.values?.endDate ??
                    state.values?.startDate ??
                    earliestStart
                  }
                  min={state.values?.startDate ?? earliestStart}
                  required
                  aria-invalid={Boolean(errors?.endDate?.[0])}
                  className="h-10"
                />
                <FieldError message={errors?.endDate?.[0]} />
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startTime">
                Jam mulai
                {dateMode === "range" ? " (hari pertama)" : ""}
              </Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                defaultValue={
                  state.values?.startTime ?? settings.defaultStartTime
                }
                required
                aria-invalid={Boolean(errors?.startTime?.[0])}
                className="h-10"
              />
              <FieldError message={errors?.startTime?.[0]} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">
                Jam selesai
                {dateMode === "range" ? " (hari terakhir)" : ""}
              </Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                defaultValue={
                  state.values?.endTime ?? settings.defaultEndTime
                }
                required
                aria-invalid={Boolean(errors?.endTime?.[0])}
                className="h-10"
              />
              <FieldError message={errors?.endTime?.[0]} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="size-4 text-primary" />
            Pembina / Pendamping
          </CardTitle>
          <CardDescription>
            Pilih Pembina atau Pendamping yang bertanggung jawab dan akan
            memberikan persetujuan tahap pertama.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="mentorId">Pilih Pembina/Pendamping</Label>
          <select
            id="mentorId"
            name="mentorId"
            defaultValue={mentorDefault}
            required
            aria-invalid={Boolean(errors?.mentorId?.[0])}
            className={selectClassName}
          >
            <option value="" disabled>
              Pilih Pembina/Pendamping
            </option>
            {mentors.map((mentor) => (
              <option key={mentor.id} value={mentor.id}>
                {mentor.fullName}
                {mentor.nip ? ` · NIP ${mentor.nip}` : ""}
              </option>
            ))}
          </select>
          <FieldError message={errors?.mentorId?.[0]} />
          {mentors.length === 0 ? (
            <p className="text-xs text-destructive">
              Belum ada akun Pembina yang aktif. Hubungi administrator asrama.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {state.status === "error" && state.message ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Pengajuan belum dapat dikirim</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" size="lg" className="h-10" asChild>
          <Link href="/dashboard">Batal</Link>
        </Button>
        <SubmitButton disabled={mentors.length === 0 || types.length === 0} />
      </div>
    </form>
  );
}
