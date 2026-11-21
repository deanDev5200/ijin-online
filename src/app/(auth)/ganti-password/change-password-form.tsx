"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { INITIAL_ACTION_STATE } from "@/lib/form-state";

import { changePasswordAction } from "./actions";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-destructive">{message}</p>;
}

function SubmitButton({ forced }: { forced: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      className="h-10 w-full"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          Menyimpan...
        </>
      ) : (
        <>
          <KeyRound />
          {forced ? "Simpan & lanjutkan" : "Simpan password baru"}
        </>
      )}
    </Button>
  );
}

export function ChangePasswordForm({
  forced,
  currentUsername,
}: {
  forced: boolean;
  currentUsername: string;
}) {
  const [state, formAction] = useActionState(
    changePasswordAction,
    INITIAL_ACTION_STATE,
  );

  const errors = state.fieldErrors;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {forced ? (
        <div className="space-y-2">
          <Label htmlFor="username">Username baru</Label>
          <Input
            id="username"
            name="username"
            autoComplete="username"
            placeholder="Minimal 6 karakter"
            required
            minLength={6}
            maxLength={20}
            autoFocus
            aria-invalid={Boolean(errors?.username?.[0])}
            className="h-10"
          />
          <p className="text-xs text-muted-foreground">
            Username sementara Anda saat ini:{" "}
            <span className="font-medium">{currentUsername}</span>. Silakan
            ganti dengan username pribadi Anda.
          </p>
          <FieldError message={errors?.username?.[0]} />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="currentPassword">
          {forced ? "Password awal" : "Password saat ini"}
        </Label>
        <PasswordInput
          id="currentPassword"
          name="currentPassword"
          autoComplete="current-password"
          placeholder={
            forced ? "Masukkan password awal (123456)" : "Masukkan password saat ini"
          }
          required
          maxLength={72}
          autoFocus={!forced}
          aria-invalid={Boolean(errors?.currentPassword?.[0])}
          className="h-10"
        />
        <FieldError message={errors?.currentPassword?.[0]} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">Password baru</Label>
        <PasswordInput
          id="newPassword"
          name="newPassword"
          autoComplete="new-password"
          placeholder="Minimal 6 karakter"
          required
          minLength={6}
          maxLength={72}
          aria-invalid={Boolean(errors?.newPassword?.[0])}
          className="h-10"
        />
        <p className="text-xs text-muted-foreground">
          Gunakan kombinasi huruf dan angka yang mudah Anda ingat, tetapi sulit
          ditebak orang lain.
        </p>
        <FieldError message={errors?.newPassword?.[0]} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Konfirmasi password baru</Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Ulangi password baru"
          required
          minLength={6}
          maxLength={72}
          aria-invalid={Boolean(errors?.confirmPassword?.[0])}
          className="h-10"
        />
        <FieldError message={errors?.confirmPassword?.[0]} />
      </div>

      {state.status === "error" && state.message ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.message}
        </div>
      ) : null}

      {state.status === "success" && state.message ? (
        <div
          role="status"
          className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary"
        >
          {state.message}
        </div>
      ) : null}

      <SubmitButton forced={forced} />
    </form>
  );
}
