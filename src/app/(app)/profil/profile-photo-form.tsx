"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Crop, Loader2, RotateCcw, Trash2, Upload } from "lucide-react";

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
const OUTPUT_SIZE = 512;

type CropPosition = { x: number; y: number };

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

function drawCrop(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  zoom: number,
  position: CropPosition,
): void {
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  const baseScale = Math.max(
    OUTPUT_SIZE / image.naturalWidth,
    OUTPUT_SIZE / image.naturalHeight,
  );
  const scale = baseScale * zoom;
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const maxOffsetX = Math.max(0, (drawWidth - OUTPUT_SIZE) / 2);
  const maxOffsetY = Math.max(0, (drawHeight - OUTPUT_SIZE) / 2);
  const offsetX = (position.x / 100) * maxOffsetX;
  const offsetY = (position.y / 100) * maxOffsetY;

  context.drawImage(
    image,
    (OUTPUT_SIZE - drawWidth) / 2 + offsetX,
    (OUTPUT_SIZE - drawHeight) / 2 + offsetY,
    drawWidth,
    drawHeight,
  );
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
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [sourceName, setSourceName] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState<CropPosition>({ x: 0, y: 0 });
  const [clientError, setClientError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !sourceImage) {
      return;
    }

    drawCrop(canvas, sourceImage, zoom, position);
  }, [sourceImage, zoom, position]);

  async function createCroppedFile(): Promise<File | null> {
    const canvas = canvasRef.current;

    if (!canvas || !sourceImage) {
      return null;
    }

    drawCrop(canvas, sourceImage, zoom, position);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.9);
    });

    if (!blob) {
      return null;
    }

    return new File([blob], "foto-profil.jpg", { type: "image/jpeg" });
  }

  function clearEditor() {
    setSourceImage(null);
    setSourceName(null);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setClientError(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }

  const [state, formAction] = useActionState<ActionState, FormData>(
    async (previous, formData) => {
      if (formData.get("intent") === "save") {
        const croppedFile = await createCroppedFile();

        if (!croppedFile) {
          return {
            status: "error",
            message: "Potongan foto tidak dapat disiapkan. Coba pilih foto lain.",
          };
        }

        formData.set("photo", croppedFile);
      }

      const result = await updateProfilePhotoAction(previous, formData);

      if (result.status === "success") {
        clearEditor();
      }

      return result;
    },
    INITIAL_ACTION_STATE,
  );

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      clearEditor();
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      event.target.value = "";
      clearEditor();
      setClientError("Format foto harus JPG, PNG, atau WebP.");
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      event.target.value = "";
      clearEditor();
      setClientError("Ukuran foto maksimal 2 MB.");
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;

    const image = new Image();

    image.onload = () => {
      setSourceImage(image);
      setSourceName(file.name);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setClientError(null);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      objectUrlRef.current = null;
      event.target.value = "";
      clearEditor();
      setClientError("Foto tidak dapat dibaca. Coba berkas lain.");
    };

    image.src = objectUrl;
  }

  const displayedPhoto = sourceImage ? null : avatarUrl;

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4" noValidate>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {sourceImage ? (
            <canvas
              ref={canvasRef}
              width={OUTPUT_SIZE}
              height={OUTPUT_SIZE}
              aria-label="Pratinjau potongan foto profil"
              className="size-24 shrink-0 rounded-full object-cover ring-2 ring-primary/20"
            />
          ) : (
            <Avatar className="size-24 shrink-0 text-lg ring-2 ring-primary/20">
              {displayedPhoto ? (
                <AvatarImage src={displayedPhoto} alt={`Foto profil ${fullName}`} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
          )}

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="photo">Foto profil siswa</Label>
              {sourceImage ? (
                <Badge variant="secondary" className="text-[10px]">
                  Pratinjau potongan
                </Badge>
              ) : null}
              {displayedPhoto && !sourceImage ? (
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
              {sourceName
                ? `Berkas dipilih: ${sourceName}`
                : "Format JPG, PNG, atau WebP · maksimal 2 MB."}
            </p>
          </div>
        </div>

        {sourceImage ? (
          <div className="space-y-4 rounded-xl border bg-muted/20 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Crop className="size-4 text-primary" />
                Atur potongan foto
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => {
                  setZoom(1);
                  setPosition({ x: 0, y: 0 });
                }}
              >
                <RotateCcw />
                Reset
              </Button>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Geser posisi dan perbesar foto hingga bagian yang diinginkan
              berada di dalam lingkaran. Foto akan disimpan berbentuk kotak
              512 × 512.
            </p>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <Label htmlFor="photo-zoom">Perbesar</Label>
                <span className="font-medium text-muted-foreground">
                  {zoom.toFixed(1)}x
                </span>
              </div>
              <Input
                id="photo-zoom"
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="h-2 cursor-pointer accent-primary"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <Label htmlFor="photo-position-x">Posisi horizontal</Label>
                <span className="font-medium text-muted-foreground">
                  {position.x}%
                </span>
              </div>
              <Input
                id="photo-position-x"
                type="range"
                min={-100}
                max={100}
                step={1}
                value={position.x}
                onChange={(event) =>
                  setPosition((current) => ({
                    ...current,
                    x: Number(event.target.value),
                  }))
                }
                className="h-2 cursor-pointer accent-primary"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <Label htmlFor="photo-position-y">Posisi vertikal</Label>
                <span className="font-medium text-muted-foreground">
                  {position.y}%
                </span>
              </div>
              <Input
                id="photo-position-y"
                type="range"
                min={-100}
                max={100}
                step={1}
                value={position.y}
                onChange={(event) =>
                  setPosition((current) => ({
                    ...current,
                    y: Number(event.target.value),
                  }))
                }
                className="h-2 cursor-pointer accent-primary"
              />
            </div>
          </div>
        ) : null}

        {clientError ? <p className="text-xs text-destructive">{clientError}</p> : null}

        <div className="flex flex-wrap gap-2">
          <PhotoSubmitButton intent="save" disabled={!sourceImage}>
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
