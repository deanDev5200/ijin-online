"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INITIAL_ACTION_STATE } from "@/lib/form-state";

import { updateUsernameAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="h-9" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          Menyimpan...
        </>
      ) : (
        <>
          <Save />
          Simpan username
        </>
      )}
    </Button>
  );
}

export function ProfileUsernameForm({ username }: { username: string }) {
  const [state, formAction] = useActionState(
    updateUsernameAction,
    INITIAL_ACTION_STATE,
  );

  const usernameError = state.fieldErrors?.username?.[0];

  return (
    <form action={formAction} className="space-y-2.5" noValidate>
      <Label htmlFor="username">Username</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          key={username}
          id="username"
          name="username"
          defaultValue={username}
          autoComplete="username"
          required
          minLength={5}
          maxLength={20}
          aria-invalid={Boolean(usernameError)}
          className="h-9 sm:max-w-sm"
        />
        <SubmitButton />
      </div>
      <p className="text-xs text-muted-foreground">
        5-20 karakter, huruf kecil, angka, titik, atau garis bawah.
      </p>
      {usernameError ? (
        <p className="text-xs text-destructive">{usernameError}</p>
      ) : null}
      {state.status === "success" && state.message ? (
        <p className="text-xs text-primary">{state.message}</p>
      ) : null}
      {state.status === "error" && state.message ? (
        <p className="text-xs text-destructive">{state.message}</p>
      ) : null}
    </form>
  );
}
