"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  KeyRound,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";

import type { Role } from "@/generated/prisma/enums";
import { FormFeedback } from "@/components/form-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  INITIAL_ACCOUNT_ACTION_STATE,
  type AccountActionState,
} from "@/lib/accounts/form-state";
import { INITIAL_PASSWORD } from "@/lib/accounts/username";
import { ROLE_LABELS } from "@/lib/auth/roles";

import {
  deleteAccountAction,
  resetAccountCredentialsAction,
  updateAccountAction,
} from "../actions";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-destructive">{message}</p>;
}

function PendingButton({
  label,
  pendingLabel,
  variant = "default",
  icon,
}: {
  label: string;
  pendingLabel: string;
  variant?: "default" | "outline" | "destructive";
  icon: ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} disabled={pending}>
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

type AccountDetails = {
  id: string;
  role: Role;
  fullName: string;
  username: string;
  nis: string;
  nip: string | null;
  grha: string;
  kelas: string;
};

export function AccountDetailsForm({ account }: { account: AccountDetails }) {
  const [state, formAction] = useActionState<
    AccountActionState,
    FormData
  >(updateAccountAction, INITIAL_ACCOUNT_ACTION_STATE);
  const errors = state.fieldErrors;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="accountId" value={account.id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nama lengkap</Label>
          <Input
            id="fullName"
            name="fullName"
            defaultValue={state.values?.fullName ?? account.fullName}
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
            value={account.username}
            readOnly
            disabled
            aria-describedby="username-hint"
            className="h-10 bg-muted/40"
          />
          <p id="username-hint" className="text-xs text-muted-foreground">
            Username dapat dikembalikan ke awal melalui kartu Reset kredensial.
          </p>
        </div>
      </div>

      {account.role === "SISWA" ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="nis">NIS</Label>
            <Input
              id="nis"
              name="nis"
              defaultValue={state.values?.nis ?? account.nis}
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
              defaultValue={state.values?.kelas ?? account.kelas}
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
              defaultValue={state.values?.grha ?? account.grha}
              required
              aria-invalid={Boolean(errors?.grha?.[0])}
              className="h-10"
            />
            <FieldError message={errors?.grha?.[0]} />
          </div>
        </div>
      ) : account.role === "ADMIN" ? (
        <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Akun administrator tidak memiliki NIS atau NIP. Peran akun tidak dapat
          diubah dari halaman ini.
        </p>
      ) : (
        <div className="space-y-2 sm:max-w-sm">
          <Label htmlFor="nip">NIP</Label>
          <Input
            id="nip"
            name="nip"
            defaultValue={state.values?.nip ?? account.nip ?? ""}
            aria-invalid={Boolean(errors?.nip?.[0])}
            className="h-10"
          />
          <p className="text-xs text-muted-foreground">
            Boleh dikosongkan untuk akun yang diimpor tanpa NIP.
          </p>
          <FieldError message={errors?.nip?.[0]} />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Peran akun: <span className="font-medium">{ROLE_LABELS[account.role]}</span>.
        Peran tidak dapat diubah setelah akun dibuat.
      </p>

      <FormFeedback state={state} />

      <div className="flex justify-end">
        <PendingButton label="Simpan perubahan" pendingLabel="Menyimpan..." icon={<Save />} />
      </div>
    </form>
  );
}

export function ResetCredentialsForm({
  accountId,
  fullName,
  isSelf,
}: {
  accountId: string;
  fullName: string;
  isSelf?: boolean;
}) {
  const [state, formAction] = useActionState<
    AccountActionState,
    FormData
  >(resetAccountCredentialsAction, INITIAL_ACCOUNT_ACTION_STATE);

  return (
    <form
      key={state.status === "success" ? state.message : "reset-form"}
      action={formAction}
      className="space-y-4"
      noValidate
    >
      <input type="hidden" name="accountId" value={accountId} />

      <div className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-3 text-sm">
        <KeyRound className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="space-y-1 text-muted-foreground">
          <p>
            Username dibuat ulang dari nama lengkap dan password direset ke{" "}
            <span className="font-mono font-semibold text-foreground">
              {INITIAL_PASSWORD}
            </span>
            .
          </p>
          <p className="text-xs leading-relaxed">
            {isSelf
              ? "Ini adalah akun Anda. Setelah reset, sesi ini akan berakhir dan Anda harus login ulang dengan username baru serta password 123456, lalu membuat kredensial pribadi."
              : `Pengguna ${fullName} wajib membuat username dan password pribadi saat login berikutnya. Sesi aktif akan diakhiri.`}
          </p>
        </div>
      </div>

      <FormFeedback state={state} />

      <div className="flex justify-end">
        <PendingButton
          label="Reset kredensial"
          pendingLabel="Menyimpan..."
          variant="outline"
          icon={<KeyRound />}
        />
      </div>
    </form>
  );
}

export function DeleteAccountForm({
  accountId,
  fullName,
  disabled,
  disabledReason,
}: {
  accountId: string;
  fullName: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [state, formAction] = useActionState<
    AccountActionState,
    FormData
  >(deleteAccountAction, INITIAL_ACCOUNT_ACTION_STATE);

  return (
    <form
      action={formAction}
      className="space-y-4"
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Hapus akun ${fullName}? Tindakan ini tidak dapat dibatalkan. Akun, profil, pengajuan yang dibuatnya, dan notifikasi terkait akan terhapus permanen.`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="accountId" value={accountId} />

      <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5">
        <Trash2 className="mt-0.5 size-4 shrink-0 text-destructive" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Menghapus akun akan menghapus profil, notifikasi, dan seluruh
          pengajuan yang dibuat akun ini secara permanen. Akun juga akan dilepaskan
          dari pengajuan orang lain yang turut melibatkannya. Tindakan ini tidak
          dapat dibatalkan.
        </p>
      </div>

      {disabled ? (
        <p className="text-xs text-muted-foreground">{disabledReason}</p>
      ) : (
        <FormFeedback state={state} />
      )}

      <div className="flex justify-end">
        {disabled ? (
          <Button type="button" variant="destructive" disabled>
            <Trash2 />
            Hapus akun
          </Button>
        ) : (
          <PendingButton
            label="Hapus akun"
            pendingLabel="Menghapus..."
            variant="destructive"
            icon={<Trash2 />}
          />
        )}
      </div>
    </form>
  );
}
