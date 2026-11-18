"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle, Check, Loader2, X } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { INITIAL_ACTION_STATE } from "@/lib/form-state";

import { decidePermissionAction } from "./actions";

const textareaClassName =
  "min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

function ActionButtons() {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button type="submit" name="decision" value="APPROVE" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Check />}
        Setujui
      </Button>
      <Button
        type="submit"
        name="decision"
        value="REJECT"
        variant="outline"
        className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
        disabled={pending}
      >
        {pending ? <Loader2 className="animate-spin" /> : <X />}
        Tolak
      </Button>
    </div>
  );
}

export function ApprovalForm({ requestId }: { requestId: string }) {
  const [state, formAction] = useActionState(
    decidePermissionAction,
    INITIAL_ACTION_STATE,
  );

  const noteError = state.fieldErrors?.note?.[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Keputusan Anda</CardTitle>
        <CardDescription>
          Setujui untuk meneruskan pengajuan ke tahap berikutnya, atau tolak
          dengan menyertakan alasan yang jelas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="requestId" value={requestId} />

          <div className="space-y-2">
            <Label htmlFor="note">
              Catatan{" "}
              <span className="font-normal text-muted-foreground">
                (wajib saat menolak)
              </span>
            </Label>
            <textarea
              id="note"
              name="note"
              maxLength={500}
              placeholder="Tambahkan catatan untuk pengaju atau penyetuju berikutnya..."
              aria-invalid={Boolean(noteError)}
              className={textareaClassName}
            />
            <p className="text-xs text-muted-foreground">
              Maksimal 500 karakter. Keputusan yang sudah disimpan tidak dapat
              diubah.
            </p>
            {noteError ? (
              <p className="text-xs text-destructive">{noteError}</p>
            ) : null}
          </div>

          {state.status === "error" && state.message ? (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertTitle>Keputusan belum tersimpan</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <ActionButtons />
        </form>
      </CardContent>
    </Card>
  );
}
