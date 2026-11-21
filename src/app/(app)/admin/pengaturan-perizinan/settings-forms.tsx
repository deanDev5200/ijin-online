"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  ClipboardCheck,
  ListChecks,
  Loader2,
  Plus,
  Save,
  UsersRound,
} from "lucide-react";

import { FormFeedback } from "@/components/form-feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { INITIAL_ACTION_STATE, type ActionState } from "@/lib/form-state";
import {
  APPROVAL_ROLE_LABELS,
  APPROVAL_ROLES,
  DEFAULT_APPROVAL_ROLES,
  DEFAULT_REQUIRED_FIELDS,
  FIELD_LABELS,
  PERMISSION_FIELDS,
  type PermissionTypeConfig,
} from "@/lib/permissions/config";

import {
  createPermissionTypeAction,
  updateMentorSelectionAction,
  updatePermissionSettingsAction,
  updatePermissionTypeAction,
} from "./actions";

const textareaClassName =
  "min-h-20 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

const selectClassName =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const DEFAULT_CREATE_CONFIG: PermissionTypeConfig = {
  approvalRoles: [...DEFAULT_APPROVAL_ROLES],
  requiredFields: [...DEFAULT_REQUIRED_FIELDS],
  fieldLabels: {},
  approvalLabels: {},
  formGuide: null,
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-destructive">{message}</p>;
}

function SubmitButton({
  label,
  pendingLabel,
  icon,
}: {
  label: string;
  pendingLabel: string;
  icon: ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          {pendingLabel}
        </>
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
    </Button>
  );
}

function PermissionTypeConfigFields({
  config,
  idPrefix,
  errors,
}: {
  config: PermissionTypeConfig;
  idPrefix: string;
  errors?: Record<string, string[] | undefined>;
}) {
  return (
    <div className="space-y-5 rounded-xl border bg-muted/20 p-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-4 text-primary" />
          <p className="text-sm font-medium">Urutan persetujuan</p>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Tentukan peran penyetuju secara berurutan. Biarkan kosong untuk
          menghapus tahap.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-2">
              <Label htmlFor={`${idPrefix}-approval-role-${index}`}>
                Tahap {index + 1}
              </Label>
              <select
                id={`${idPrefix}-approval-role-${index}`}
                name={`approvalRole${index + 1}`}
                defaultValue={config.approvalRoles[index] ?? ""}
                className={selectClassName}
              >
                <option value="">Tidak ada</option>
                {APPROVAL_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {APPROVAL_ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <FieldError message={errors?.approvalRoles?.[0]} />
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ListChecks className="size-4 text-primary" />
          <p className="text-sm font-medium">Field formulir yang ditampilkan</p>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Centang field yang wajib diisi siswa pada jenis izin ini.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {PERMISSION_FIELDS.map((field) => (
            <label
              key={field}
              htmlFor={`${idPrefix}-required-${field}`}
              className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs transition-colors hover:bg-accent"
            >
              <input
                id={`${idPrefix}-required-${field}`}
                type="checkbox"
                name="requiredFields"
                value={field}
                defaultChecked={config.requiredFields.includes(field)}
                className="size-4 shrink-0 accent-primary"
              />
              <span className="min-w-0 flex-1">
                {config.fieldLabels[field] ?? FIELD_LABELS[field]}
              </span>
            </label>
          ))}
        </div>
        <FieldError message={errors?.requiredFields?.[0]} />
      </div>

      <Separator />

      <div className="space-y-3">
        <p className="text-sm font-medium">Label field formulir</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {PERMISSION_FIELDS.map((field) => (
            <div key={field} className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-field-label-${field}`}>
                {FIELD_LABELS[field]}
              </Label>
              <Input
                id={`${idPrefix}-field-label-${field}`}
                name={`fieldLabel_${field}`}
                defaultValue={config.fieldLabels[field] ?? ""}
                placeholder={FIELD_LABELS[field]}
                maxLength={120}
                className="h-9"
              />
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <p className="text-sm font-medium">Label tahap persetujuan</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {APPROVAL_ROLES.map((role) => (
            <div key={role} className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-approval-label-${role}`}>
                {APPROVAL_ROLE_LABELS[role]}
              </Label>
              <Input
                id={`${idPrefix}-approval-label-${role}`}
                name={`approvalLabel_${role}`}
                defaultValue={config.approvalLabels[role] ?? ""}
                placeholder={APPROVAL_ROLE_LABELS[role]}
                maxLength={120}
                className="h-9"
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Kosongkan untuk memakai label bawaan peran.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-form-guide`}>Panduan formulir</Label>
        <textarea
          id={`${idPrefix}-form-guide`}
          name="formGuide"
          defaultValue={config.formGuide ?? ""}
          placeholder="Jelaskan isian dan signatory sesuai formulir PDF."
          maxLength={1000}
          className={textareaClassName}
        />
        <p className="text-xs text-muted-foreground">
          Panduan ini ditampilkan kepada siswa saat memilih jenis izin.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="text-[10px]">
          {config.approvalRoles.length} tahap bawaan
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          {config.requiredFields.length} field bawaan
        </Badge>
      </div>
    </div>
  );
}

export function PermissionSettingsForm({
  settings,
}: {
  settings: {
    minLeadDays: number;
    maxRangeDays: number;
    maxStudentsPerRequest: number;
    approvalDeadlineDays: number;
    defaultStartTime: string;
    defaultEndTime: string;
  };
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    updatePermissionSettingsAction,
    INITIAL_ACTION_STATE,
  );
  const errors = state.fieldErrors;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="minLeadDays">Minimal hari sebelum pengajuan</Label>
          <Input
            id="minLeadDays"
            name="minLeadDays"
            type="number"
            min={0}
            max={30}
            defaultValue={settings.minLeadDays}
            required
            className="h-9"
          />
          <p className="text-xs text-muted-foreground">
            0 berarti izin dapat diajukan pada hari yang sama.
          </p>
          <FieldError message={errors?.minLeadDays?.[0]} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxRangeDays">Durasi izin maksimal (hari)</Label>
          <Input
            id="maxRangeDays"
            name="maxRangeDays"
            type="number"
            min={1}
            max={90}
            defaultValue={settings.maxRangeDays}
            required
            className="h-9"
          />
          <FieldError message={errors?.maxRangeDays?.[0]} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxStudentsPerRequest">
            Maksimal siswa per pengajuan
          </Label>
          <Input
            id="maxStudentsPerRequest"
            name="maxStudentsPerRequest"
            type="number"
            min={1}
            max={100}
            defaultValue={settings.maxStudentsPerRequest}
            required
            className="h-9"
          />
          <p className="text-xs text-muted-foreground">
            Termasuk siswa yang mengajukan.
          </p>
          <FieldError message={errors?.maxStudentsPerRequest?.[0]} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="approvalDeadlineDays">
            Batas waktu persetujuan (hari)
          </Label>
          <Input
            id="approvalDeadlineDays"
            name="approvalDeadlineDays"
            type="number"
            min={1}
            max={30}
            defaultValue={settings.approvalDeadlineDays}
            required
            className="h-9"
          />
          <p className="text-xs text-muted-foreground">
            Pengajuan yang melewati batas ini ditandai pada indeks izin.
          </p>
          <FieldError message={errors?.approvalDeadlineDays?.[0]} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultStartTime">Jam mulai bawaan</Label>
          <Input
            id="defaultStartTime"
            name="defaultStartTime"
            type="time"
            defaultValue={settings.defaultStartTime}
            required
            className="h-9"
          />
          <FieldError message={errors?.defaultStartTime?.[0]} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultEndTime">Jam selesai bawaan</Label>
          <Input
            id="defaultEndTime"
            name="defaultEndTime"
            type="time"
            defaultValue={settings.defaultEndTime}
            required
            className="h-9"
          />
          <FieldError message={errors?.defaultEndTime?.[0]} />
        </div>
      </div>

      <FormFeedback state={state} />

      <div className="flex justify-end">
        <SubmitButton
          label="Simpan ketentuan"
          pendingLabel="Menyimpan..."
          icon={<Save />}
        />
      </div>
    </form>
  );
}

export function PermissionTypeCreateForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createPermissionTypeAction,
    INITIAL_ACTION_STATE,
  );
  const errors = state.fieldErrors;

  return (
    <div className="space-y-4">
      <form
        key={state.status === "success" ? state.message : "create-type"}
        action={formAction}
        className="space-y-4"
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_130px_130px]">
          <div className="space-y-2">
            <Label htmlFor="new-type-name">Nama jenis izin</Label>
            <Input
              id="new-type-name"
              name="name"
              placeholder="cth. Izin Pulang Akhir Pekan"
              required
              minLength={3}
              maxLength={80}
              className="h-9"
              aria-invalid={Boolean(errors?.name?.[0])}
            />
            <FieldError message={errors?.name?.[0]} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-type-sort">Urutan</Label>
            <Input
              id="new-type-sort"
              name="sortOrder"
              type="number"
              min={0}
              max={999}
              defaultValue={10}
              required
              className="h-9"
            />
            <FieldError message={errors?.sortOrder?.[0]} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-type-active">Status</Label>
            <select
              id="new-type-active"
              name="isActive"
              defaultValue="true"
              className={selectClassName}
            >
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-type-description">Deskripsi</Label>
          <textarea
            id="new-type-description"
            name="description"
            placeholder="Jelaskan kapan jenis izin ini digunakan."
            maxLength={300}
            className={textareaClassName}
          />
          <FieldError message={errors?.description?.[0]} />
        </div>

        <PermissionTypeConfigFields
          config={DEFAULT_CREATE_CONFIG}
          idPrefix="new-type"
          errors={errors}
        />

        <div className="flex justify-end">
          <SubmitButton
            label="Tambah jenis izin"
            pendingLabel="Menambahkan..."
            icon={<Plus />}
          />
        </div>
      </form>

      <FormFeedback state={state} />
    </div>
  );
}

export function PermissionTypeEditForm({
  type,
}: {
  type: {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    sortOrder: number;
    config: PermissionTypeConfig;
  };
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    updatePermissionTypeAction,
    INITIAL_ACTION_STATE,
  );
  const errors = state.fieldErrors;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="typeId" value={type.id} />

      <div className="grid gap-4 sm:grid-cols-[1fr_130px_130px]">
        <div className="space-y-2">
          <Label htmlFor={`type-name-${type.id}`}>Nama jenis izin</Label>
          <Input
            id={`type-name-${type.id}`}
            name="name"
            defaultValue={type.name}
            required
            minLength={3}
            maxLength={80}
            className="h-9"
            aria-invalid={Boolean(errors?.name?.[0])}
          />
          <FieldError message={errors?.name?.[0]} />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`type-sort-${type.id}`}>Urutan</Label>
          <Input
            id={`type-sort-${type.id}`}
            name="sortOrder"
            type="number"
            min={0}
            max={999}
            defaultValue={type.sortOrder}
            required
            className="h-9"
          />
          <FieldError message={errors?.sortOrder?.[0]} />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`type-active-${type.id}`}>Status</Label>
          <select
            id={`type-active-${type.id}`}
            name="isActive"
            defaultValue={type.isActive ? "true" : "false"}
            className={selectClassName}
          >
            <option value="true">Aktif</option>
            <option value="false">Nonaktif</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`type-description-${type.id}`}>Deskripsi</Label>
        <textarea
          id={`type-description-${type.id}`}
          name="description"
          defaultValue={type.description}
          maxLength={300}
          className={textareaClassName}
        />
        <FieldError message={errors?.description?.[0]} />
      </div>

      <PermissionTypeConfigFields
        config={type.config}
        idPrefix={`type-${type.id}`}
        errors={errors}
      />

      <FormFeedback state={state} />

      <div className="flex justify-end">
        <SubmitButton
          label="Simpan perubahan"
          pendingLabel="Menyimpan..."
          icon={<Save />}
        />
      </div>
    </form>
  );
}

export function MentorSelectionForm({
  mentors,
}: {
  mentors: Array<{
    id: string;
    fullName: string;
    nip: string;
    canBeMentor: boolean;
  }>;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateMentorSelectionAction,
    INITIAL_ACTION_STATE,
  );

  if (mentors.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
        Belum ada akun Pembina yang aktif. Tambahkan akun Pembina terlebih
        dahulu melalui Kelola Akun.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="divide-y rounded-xl border">
        {mentors.map((mentor) => (
          <label
            key={mentor.id}
            className="flex cursor-pointer items-start gap-3 p-3 transition-colors hover:bg-muted/50"
          >
            <input
              type="checkbox"
              name="mentorIds"
              value={mentor.id}
              defaultChecked={mentor.canBeMentor}
              className="mt-0.5 size-4 shrink-0 accent-primary"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {mentor.fullName}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                NIP {mentor.nip}
              </span>
            </span>
          </label>
        ))}
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <UsersRound className="size-3.5" />
        Hanya akun yang dicentang yang muncul pada pilihan Pembina/Pendamping
        saat siswa mengajukan izin.
      </p>

      <FormFeedback state={state} />

      <div className="flex justify-end">
        <SubmitButton
          label="Simpan pilihan Pembina"
          pendingLabel="Menyimpan..."
          icon={<Save />}
        />
      </div>
    </form>
  );
}
