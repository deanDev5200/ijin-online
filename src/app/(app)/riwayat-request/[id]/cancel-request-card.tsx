"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { INITIAL_ACTION_STATE } from "@/lib/form-state";

import { cancelPermissionRequestAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      size="sm"
      className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          Membatalkan...
        </>
      ) : (
        <>
          <XCircle />
          Batalkan pengajuan
        </>
      )}
    </Button>
  );
}

export function CancelRequestCard({ requestId }: { requestId: string }) {
  const [state, formAction] = useActionState(
    cancelPermissionRequestAction,
    INITIAL_ACTION_STATE,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Batalkan pengajuan</CardTitle>
        <CardDescription>
          Gunakan tindakan ini jika kegiatan batal atau pengajuan tidak lagi
          diperlukan. Pengajuan hanya dapat dibatalkan selama belum selesai
          diproses.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <form
          action={formAction}
          onSubmit={(event) => {
            if (
              !window.confirm(
                "Batalkan pengajuan izin ini? Tindakan ini tidak dapat dibatalkan.",
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="requestId" value={requestId} />
          <SubmitButton />
        </form>

        {state.status === "error" && state.message ? (
          <p className="text-xs text-destructive">{state.message}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
