"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Trash2, Upload } from "lucide-react";

import { FormFeedback } from "@/components/form-feedback";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INITIAL_ACTION_STATE, type ActionState } from "@/lib/form-state";

import { updateProfilePhotoAction } from "./actions";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function PhotoSubmitButton({
  intent,
  disabled,
  children,
  variant = "default",
}: {
  intent: "save" | "remove";
  disabled?: boolean;
  children: React.ReactNode;
  variant?: "default" | "outline";
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      name="intent"
      value={intent}
      variant={variant}
      className="h-9"
      disabled={pending || disabled}
      formNoValidate={intent === "remove"}
    >
      {pending ? <Loader2 className="animate-spin" /> : null}
      {children}
    </Button>
  );
}

export function ProfilePhotoForm({
  fullName,
  avatarUrl,
}: {
  fullName: string;
  avatarUrl: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, formAction] = useActionState<ActionState, FormData>(
    async (previous, formData) => {
      const result = await updateProfilePhotoAction(previous, formData);

      if (result.status === "success") {
        setPreview(null);
        setFileName(null);
        setClientError(null);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }

      return result;
    },
    INITIAL_ACTION_STATE,
  );

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setPreview(null);
      setFileName(null);
      setClientError(null);
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      event.target.value = "";
      setPreview(null);
      setFileName(null);
      setClientError("Format foto harus JPG, PNG, atau WebP.");
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      event.target.value = "";
      setPreview(null);
      setFileName(null);
      setClientError("Ukuran foto maksimal 2 MB.");
      return;
    }

    setClientError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  const displayedPhoto = preview ?? avatarUrl;

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4" noValidate>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar className="size-20 text-lg ring-2 ring-primary/20">
            {displayedPhoto ? (
              <AvatarImage src={displayedPhoto} alt={`Foto profil ${fullName}`} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="photo">Foto profil siswa</Label>
              {preview ? (
                <Badge variant="secondary" className="text-[10px]">
                  Pratinjau
                </Badge>
              ) : null}
              {displayedPhoto && !preview ? (
                <Badge variant="outline" className="text-[10px]">
                  Tersimpan
                </Badge>
              ) : null}
            </div>
            <Input
              ref={inputRef}
              id="photo"
              name="photo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="h-10 cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              {fileName
                ? `Berkas dipilih: ${fileName}`
                : "Format JPG, PNG, atau WebP · maksimal 2 MB."}
            </p>
          </div>
        </div>

        {clientError ? <p className="text-xs text-destructive">{clientError}</p> : null}

        <div className="flex flex-wrap gap-2">
          <PhotoSubmitButton intent="save" disabled={!preview}>
            <Upload />
            {avatarUrl ? "Ganti foto" : "Tambah foto"}
          </PhotoSubmitButton>
          <PhotoSubmitButton
            intent="remove"
            variant="outline"
            disabled={!displayedPhoto}
          >
            <Trash2 />
            Hapus foto
          </PhotoSubmitButton>
        </div>
      </form>

      <FormFeedback state={state} />
    </div>
  );
}
