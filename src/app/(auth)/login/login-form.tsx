"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, LogIn, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { INITIAL_ACTION_STATE } from "@/lib/form-state";

import { loginAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      className="h-10 w-full rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/30 active:translate-y-0"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          Memeriksa...
        </>
      ) : (
        <>
          <LogIn />
          Masuk
        </>
      )}
    </Button>
  );
}

export function LoginForm({
  next,
  showDemo,
}: {
  next?: string;
  showDemo: boolean;
}) {
  const [state, formAction] = useActionState(
    loginAction,
    INITIAL_ACTION_STATE,
  );

  const usernameError = state.fieldErrors?.username?.[0];
  const passwordError = state.fieldErrors?.password?.[0];

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4" noValidate>
        {next ? <input type="hidden" name="next" value={next} /> : null}

        <div className="space-y-1.5">
          <Label htmlFor="username" className="font-medium">
            Username
          </Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="cth. widya"
              defaultValue={state.values?.username ?? ""}
              required
              minLength={3}
              maxLength={20}
              aria-invalid={Boolean(usernameError)}
              className="h-10 rounded-xl bg-primary/[0.03] pl-10 hover:border-primary/30 focus-visible:border-primary/60 focus-visible:ring-4 focus-visible:ring-primary/20"
            />
          </div>
          {usernameError ? (
            <p className="text-xs text-destructive">{usernameError}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password" className="font-medium">
              Password
            </Label>
            <span className="text-xs text-muted-foreground">
              Minimal 6 karakter
            </span>
          </div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Masukkan password"
            required
            maxLength={72}
            aria-invalid={Boolean(passwordError)}
            className="h-10 rounded-xl bg-primary/[0.03] pr-11 hover:border-primary/30 focus-visible:border-primary/60 focus-visible:ring-4 focus-visible:ring-primary/20"
          />
          {passwordError ? (
            <p className="text-xs text-destructive">{passwordError}</p>
          ) : null}
        </div>

        {state.status === "error" && state.message ? (
          <div
            role="alert"
            className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            {state.message}
          </div>
        ) : null}

        <SubmitButton />
      </form>

      {showDemo ? (
        <div className="rounded-2xl border border-dashed border-primary/30 bg-linear-to-br from-primary/[0.07] to-transparent p-3">
          <p className="text-xs font-semibold text-foreground">Akun demo</p>
          <dl className="mt-2 grid gap-1 text-xs text-muted-foreground">
            <div className="flex justify-between gap-3">
              <dt>Siswa</dt>
              <dd className="font-mono text-foreground">fauzi / 123456</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Pembina</dt>
              <dd className="font-mono text-foreground">wuland / 123456</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Admin</dt>
              <dd className="font-mono text-foreground">admin / 123456</dd>
            </div>
            <p className="pt-1 text-[11px] leading-relaxed">
              Setelah login, Anda wajib membuat username dan password pribadi.
            </p>
          </dl>
        </div>
      ) : null}
    </div>
  );
}
