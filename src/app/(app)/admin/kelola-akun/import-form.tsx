"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";

import { FormFeedback } from "@/components/form-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  INITIAL_IMPORT_ACCOUNTS_STATE,
  type ImportAccountsState,
} from "@/lib/accounts/form-state";

import { importAccountsAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          Mengimpor...
        </>
      ) : (
        <>
          <Upload />
          Impor akun
        </>
      )}
    </Button>
  );
}

export function AccountImportForm() {
  const [state, formAction] = useActionState<
    ImportAccountsState,
    FormData
  >(importAccountsAction, INITIAL_IMPORT_ACCOUNTS_STATE);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="account-file">Berkas Excel (.xlsx)</Label>
        <Input
          id="account-file"
          name="file"
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          required
          className="h-10 cursor-pointer file:mr-2 file:rounded-md file:bg-muted file:px-2 file:py-1 file:text-xs"
        />
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileSpreadsheet className="size-3.5" />
          Gunakan sheet Akun Siswa pada template resmi. Maksimal 200 baris dan 5
          MB per berkas.
        </p>
      </div>

      <FormFeedback state={state} />

      {state.result ? (
        <div className="space-y-3 rounded-xl border bg-muted/30 p-3">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
            <span>
              Baris data:{" "}
              <strong className="text-foreground">{state.result.totalRows}</strong>
            </span>
            <span>
              Akun dibuat:{" "}
              <strong className="text-foreground">{state.result.created}</strong>
            </span>
            <span>
              Baris bermasalah:{" "}
              <strong className="text-foreground">
                {state.result.errors.length}
              </strong>
            </span>
          </div>

          {state.result.errors.length > 0 ? (
            <div className="max-h-52 space-y-1.5 overflow-y-auto text-xs">
              {state.result.errors.map((error, index) => (
                <p
                  key={`${error.row}-${index}`}
                  className="rounded-md border border-destructive/20 bg-destructive/5 px-2 py-1.5 text-destructive"
                >
                  <span className="font-semibold">Baris {error.row}:</span>{" "}
                  {error.message}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
