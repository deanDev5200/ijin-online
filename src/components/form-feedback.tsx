import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ActionState } from "@/lib/form-state";

export function FormFeedback({ state }: { state: ActionState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  if (state.status === "success") {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
        <p className="font-medium">{state.message}</p>
      </div>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle />
      <AlertTitle>Tindakan belum dapat diproses</AlertTitle>
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  );
}
