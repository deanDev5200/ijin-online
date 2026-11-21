"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import {
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  Info,
  Loader2,
  LockKeyhole,
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
import {
  fieldLabel,
  hasField,
  requiresSingleStudent,
  type PermissionTypeConfig,
} from "@/lib/permissions/config";
import { addDaysToDateOnly } from "@/lib/permissions/dates";
import {
  INITIAL_PERMISSION_REQUEST_FORM_STATE,
  type PermissionRequestFormState,
} from "@/lib/permissions/form-state";

import { createPermissionRequestAction } from "./actions";
import { DepositItemsField } from "./deposit-items-field";
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

type PermissionTypeOption = {
  id: string;
  name: string;
  description: string | null;
  config: PermissionTypeConfig;
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

const EMPTY_CONFIG: PermissionTypeConfig = {
  approvalRoles: [],
  requiredFields: [],
  fieldLabels: {},
  approvalLabels: {},
  formGuide: null,
};

export function PermissionRequestForm({
  requester,
  students,
  types,
  settings,
  today,
}: {
  requester: Requester;
  students: SelectableStudent[];
  types: PermissionTypeOption[];
  settings: RequestRules;
  today: string;
}) {
  const [state, formAction] = useActionState<
    PermissionRequestFormState,
    FormData
  >(createPermissionRequestAction, INITIAL_PERMISSION_REQUEST_FORM_STATE);

  const initialTypeId =
    state.values?.typeId ??
    (types.length === 1 ? types[0]?.id ?? "" : "");
  const [typeId, setTypeId] = useState(initialTypeId);

  const errors = state.fieldErrors;
  const requesterMeta = [requester.nis, requester.kelas, requester.grha]
    .filter(Boolean)
    .join(" · ");
  const earliestStart = addDaysToDateOnly(today, settings.minLeadDays);
  const maxOtherStudents = Math.max(0, settings.maxStudentsPerRequest - 1);
  const selectedType = types.find((type) => type.id === typeId) ?? types[0];
  const config = selectedType?.config ?? EMPTY_CONFIG;

  const needsPurpose = hasField(config, "purpose");
  const needsPlace = hasField(config, "place");
  const needsStartDate = hasField(config, "startDate");
  const needsEndDate = hasField(config, "endDate");
  const needsTime = hasField(config, "time");
  const needsDepartureTime = hasField(config, "departureTime");
  const needsReturnTime = hasField(config, "returnTime");
  const needsVisitorName = hasField(config, "visitorName");
  const needsPhoneUse = hasField(config, "phoneUse");
  const needsAdditionalNotes = hasField(config, "additionalNotes");
  const needsDepositItems = hasField(config, "depositItems");
  const singleStudent = requiresSingleStudent(config);
  const showStartDate =
    needsStartDate || needsEndDate || needsDepartureTime || needsReturnTime;
  const hasFormFields =
    needsPurpose ||
    needsPlace ||
    needsVisitorName ||
    needsPhoneUse ||
    needsAdditionalNotes ||
    needsDepositItems;

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <Card className="bg-linear-to-br from-primary/5 via-background to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="size-4 text-primary" />
            Jenis izin
          </CardTitle>
          <CardDescription>
            Pilih jenis izin yang sesuai. Kolom formulir akan menyesuaikan
            jenis yang dipilih. Pengajuan dapat diputuskan oleh penyetuju yang
            ditentukan admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <input type="hidden" name="typeId" value={typeId || types[0]?.id} />
              <div className="rounded-xl border border-primary/20 bg-background/80 p-4">
                <p className="text-sm font-semibold">{selectedType?.name}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {selectedType?.description ??
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
                value={typeId}
                onChange={(event) => setTypeId(event.target.value)}
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

          {config.formGuide ? (
            <div className="flex items-start gap-2 rounded-xl border bg-background/80 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <span>{config.formGuide}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className={singleStudent ? "bg-linear-to-br from-primary/5 to-card" : undefined}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {singleStudent ? (
              <UserRound className="size-4 text-primary" />
            ) : (
              <UsersRound className="size-4 text-primary" />
            )}
            {singleStudent ? "Data siswa" : "Siswa yang terlibat"}
          </CardTitle>
          <CardDescription>
            {singleStudent
              ? "Pengajuan ini hanya untuk Anda sebagai siswa pengaju."
              : "Anda otomatis tercantum sebagai siswa pertama. Tambahkan siswa lain yang mengikuti kegiatan yang sama."}
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

          {singleStudent ? null : (
            <>
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
            </>
          )}
        </CardContent>
      </Card>

      {hasFormFields ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="size-4 text-primary" />
              Isian sesuai formulir
            </CardTitle>
            <CardDescription>
              Kolom berikut mengikuti ketentuan{" "}
              <span className="font-medium text-foreground">
                {selectedType?.name}
              </span>
              .
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {needsPurpose ? (
              <div className="space-y-2">
                <Label htmlFor="purpose">{fieldLabel(config, "purpose")}</Label>
                <textarea
                  id="purpose"
                  name="purpose"
                  defaultValue={state.values?.purpose ?? ""}
                  placeholder={fieldLabel(config, "purpose")}
                  minLength={5}
                  maxLength={200}
                  aria-invalid={Boolean(errors?.purpose?.[0])}
                  className={textareaClassName}
                />
                <p className="text-xs text-muted-foreground">
                  Maksimal 200 karakter. Isikan sesuai formulir jenis izin ini.
                </p>
                <FieldError message={errors?.purpose?.[0]} />
              </div>
            ) : null}

            {needsPlace ? (
              <div className="space-y-2">
                <Label htmlFor="place">{fieldLabel(config, "place")}</Label>
                <Input
                  id="place"
                  name="place"
                  type="text"
                  defaultValue={state.values?.place ?? ""}
                  placeholder={fieldLabel(config, "place")}
                  minLength={3}
                  maxLength={150}
                  aria-invalid={Boolean(errors?.place?.[0])}
                  className="h-10"
                />
                <FieldError message={errors?.place?.[0]} />
              </div>
            ) : null}

            {needsVisitorName ? (
              <div className="space-y-2">
                <Label htmlFor="visitorName">
                  {fieldLabel(config, "visitorName")}
                </Label>
                <Input
                  id="visitorName"
                  name="visitorName"
                  type="text"
                  defaultValue={state.values?.visitorName ?? ""}
                  placeholder="cth. Ibu Sari, orang tua siswa"
                  minLength={3}
                  maxLength={120}
                  aria-invalid={Boolean(errors?.visitorName?.[0])}
                  className="h-10"
                />
                <FieldError message={errors?.visitorName?.[0]} />
              </div>
            ) : null}

            {needsPhoneUse ? (
              <div className="space-y-2">
                <Label htmlFor="phoneUse">
                  {fieldLabel(config, "phoneUse")}
                </Label>
                <textarea
                  id="phoneUse"
                  name="phoneUse"
                  defaultValue={state.values?.phoneUse ?? ""}
                  placeholder="cth. Menghubungi orang tua setelah kegiatan"
                  minLength={5}
                  maxLength={500}
                  aria-invalid={Boolean(errors?.phoneUse?.[0])}
                  className={textareaClassName}
                />
                <FieldError message={errors?.phoneUse?.[0]} />
              </div>
            ) : null}

            {needsAdditionalNotes ? (
              <div className="space-y-2">
                <Label htmlFor="additionalNotes">
                  {fieldLabel(config, "additionalNotes")}
                </Label>
                <textarea
                  id="additionalNotes"
                  name="additionalNotes"
                  defaultValue={state.values?.additionalNotes ?? ""}
                  placeholder="cth. 2 kg apel · buah · untuk seluruh siswa Grha 3"
                  minLength={5}
                  maxLength={1000}
                  aria-invalid={Boolean(errors?.additionalNotes?.[0])}
                  className={textareaClassName}
                />
                <FieldError message={errors?.additionalNotes?.[0]} />
              </div>
            ) : null}

            {needsDepositItems ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label>{fieldLabel(config, "depositItems")}</Label>
                  <Badge variant="secondary" className="text-[10px]">
                    1–10 barang
                  </Badge>
                </div>
                <DepositItemsField initialItems={state.values?.depositItems} />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Isi baris yang digunakan saja. Setiap baris yang diisi wajib
                  memiliki nama dan jumlah barang.
                </p>
                <FieldError message={errors?.depositItems?.[0]} />
                {Array.from({ length: 10 }, (_, index) => (
                  <FieldError
                    key={index}
                    message={errors?.[`depositItems.${index}.name`]?.[0]}
                  />
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {showStartDate || needsTime ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-4 text-primary" />
              Jadwal izin
            </CardTitle>
            <CardDescription>
              {needsDepartureTime || needsReturnTime
                ? "Tentukan tanggal dan jam kepulangan serta kedatangan sesuai formulir."
                : needsEndDate
                  ? "Tentukan tanggal mulai dan tanggal selesai sesuai formulir."
                  : "Tentukan tanggal dan waktu berlakunya izin."}
            </CardDescription>
            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <p>
                pengajuan dapat diajukan paling lambat 1 hari sebelum akan
                melakukan dispensasi
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="hidden"
              name="dateMode"
              value={needsEndDate ? "range" : "single"}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {showStartDate ? (
                <div className="space-y-2">
                  <Label htmlFor="startDate">
                    {fieldLabel(config, "startDate")}
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
              ) : (
                <input type="hidden" name="startDate" value={today} />
              )}

              {needsEndDate ? (
                <div className="space-y-2">
                  <Label htmlFor="endDate">
                    {fieldLabel(config, "endDate")}
                  </Label>
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

            {needsTime ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Jam mulai</Label>
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
                  <Label htmlFor="endTime">Jam selesai</Label>
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
            ) : null}

            {needsDepartureTime || needsReturnTime ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {needsDepartureTime ? (
                  <div className="space-y-2">
                    <Label htmlFor="departureTime">
                      {fieldLabel(config, "departureTime")}
                    </Label>
                    <Input
                      id="departureTime"
                      name="departureTime"
                      type="time"
                      defaultValue={
                        state.values?.departureTime ?? settings.defaultStartTime
                      }
                      required
                      aria-invalid={Boolean(errors?.departureTime?.[0])}
                      className="h-10"
                    />
                    <FieldError message={errors?.departureTime?.[0]} />
                  </div>
                ) : null}

                {needsReturnTime ? (
                  <div className="space-y-2">
                    <Label htmlFor="returnTime">
                      {fieldLabel(config, "returnTime")}
                    </Label>
                    <Input
                      id="returnTime"
                      name="returnTime"
                      type="time"
                      defaultValue={
                        state.values?.returnTime ?? settings.defaultEndTime
                      }
                      required
                      aria-invalid={Boolean(errors?.returnTime?.[0])}
                      className="h-10"
                    />
                    <FieldError message={errors?.returnTime?.[0]} />
                  </div>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <>
          <input type="hidden" name="dateMode" value="single" />
          <input type="hidden" name="startDate" value={today} />
        </>
      )}

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
        <SubmitButton disabled={types.length === 0} />
      </div>
    </form>
  );
}
