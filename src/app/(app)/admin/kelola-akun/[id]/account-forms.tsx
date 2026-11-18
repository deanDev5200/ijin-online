"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  KeyRound,
  Loader2,
  Save,
  ShieldCheck,
  UserRoundX,
} from "lucide-react";

import type { Role } from "@/generated/prisma/enums";
import { FormFeedback } from "@/components/form-feedback";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  INITIAL_ACCOUNT_ACTION_STATE,
  type AccountActionState,
} from "@/lib/accounts/form-state";
import { ROLE_LABELS } from "@/lib/auth/roles";

import {
  resetAccountPasswordAction,
  setAccountActiveAction,
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
  nip: string;
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
            name="username"
            defaultValue={state.values?.username ?? account.username}
            required
            minLength={5}
            maxLength={20}
            autoComplete="off"
            aria-invalid={Boolean(errors?.username?.[0])}
            className="h-10"
          />
          <FieldError message={errors?.username?.[0]} />
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
            defaultValue={state.values?.nip ?? account.nip}
            required
            aria-invalid={Boolean(errors?.nip?.[0])}
            className="h-10"
          />
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

export function ResetPasswordForm({
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
  >(resetAccountPasswordAction, INITIAL_ACCOUNT_ACTION_STATE);
  const errors = state.fieldErrors;

  return (
    <form
      key={state.status === "success" ? state.message : "reset-form"}
      action={formAction}
      className="space-y-4"
      noValidate
    >
      <input type="hidden" name="accountId" value={accountId} />

      {disabled ? (
        <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {disabledReason}
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Password baru</Label>
              <PasswordInput
                id="newPassword"
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
              <Label htmlFor="confirmNewPassword">Ulangi password</Label>
              <PasswordInput
                id="confirmNewPassword"
                name="confirmPassword"
                placeholder="Ulangi password baru"
                required
                minLength={6}
                maxLength={72}
                autoComplete="new-password"
                aria-invalid={Boolean(errors?.confirmPassword?.[0])}
                className="h-10"
              />
              <FieldError message={errors?.confirmPassword?.[0]} />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Password {fullName} akan direset dan pengguna wajib menggantinya saat
            login berikutnya. Sesi aktif pengguna akan diakhiri.
          </p>

          <FormFeedback state={state} />

          <div className="flex justify-end">
            <PendingButton
              label="Reset password"
              pendingLabel="Menyimpan..."
              variant="outline"
              icon={<KeyRound />}
            />
          </div>
        </>
      )}
    </form>
  );
}

export function AccountStatusForm({
  accountId,
  isActive,
  disabled,
  disabledReason,
}: {
  accountId: string;
  isActive: boolean;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [state, formAction] = useActionState<
    AccountActionState,
    FormData
  >(setAccountActiveAction, INITIAL_ACCOUNT_ACTION_STATE);

  return (
    <form
      action={formAction}
      className="space-y-4"
      onSubmit={(event) => {
        if (
          isActive &&
          !window.confirm(
            "Nonaktifkan akun ini? Pengguna tidak dapat masuk, tetapi seluruh riwayat tetap tersimpan.",
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="accountId" value={accountId} />
      <input type="hidden" name="isActive" value={isActive ? "false" : "true"} />

      <div className="flex items-start gap-3 rounded-lg border bg-muted/40 px-3 py-2.5">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          {isActive
            ? "Akun aktif dapat masuk ke aplikasi. Menonaktifkan akun akan mengakhiri sesi aktif tanpa menghapus data."
            : "Akun sedang nonaktif dan tidak dapat masuk. Aktifkan kembali untuk memberi akses tanpa kehilangan riwayat."}
        </p>
      </div>

      {disabled ? (
        <p className="text-xs text-muted-foreground">{disabledReason}</p>
      ) : (
        <FormFeedback state={state} />
      )}

      <div className="flex justify-end">
        {disabled ? (
          <Button type="button" variant="outline" disabled>
            <UserRoundX />
            {isActive ? "Nonaktifkan akun" : "Aktifkan akun"}
          </Button>
        ) : (
          <PendingButton
            label={isActive ? "Nonaktifkan akun" : "Aktifkan akun"}
            pendingLabel="Memproses..."
            variant={isActive ? "destructive" : "default"}
            icon={isActive ? <UserRoundX /> : <ShieldCheck />}
          />
        )}
      </div>
    </form>
  );
}
