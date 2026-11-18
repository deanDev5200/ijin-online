"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Plus, Save, UsersRound } from "lucide-react";

import { FormFeedback } from "@/components/form-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INITIAL_ACTION_STATE, type ActionState } from "@/lib/form-state";

import {
  createPermissionTypeAction,
  updateMentorSelectionAction,
  updatePermissionSettingsAction,
  updatePermissionTypeAction,
} from "./actions";

const textareaClassName =
  "min-h-20 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30";

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
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
