"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAppUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import type { ActionState } from "@/lib/form-state";

const updateNameSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Nama lengkap minimal 3 karakter.")
    .max(100, "Nama lengkap maksimal 100 karakter."),
});

export async function updateFullNameAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAppUser();

  const parsed = updateNameSchema.safeParse({
    fullName: formData.get("fullName") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { fullName: parsed.data.fullName },
  });

  revalidatePath("/profil");
  revalidatePath("/", "layout");

  return {
    status: "success",
    message: "Nama lengkap berhasil diperbarui.",
  };
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Students may upload, replace, or remove their own profile photo. The image
 * is stored as a data URL in the database, never in the session token.
 */
export async function updateProfilePhotoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAppUser();

  if (user.role !== "SISWA") {
    return {
      status: "error",
      message: "Foto profil hanya tersedia untuk akun siswa.",
    };
  }

  const intent = formData.get("intent");

  if (intent === "remove") {
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: null },
    });

    revalidatePath("/profil");
    revalidatePath("/", "layout");

    return {
      status: "success",
      message: "Foto profil berhasil dihapus.",
    };
  }

  const photo = formData.get("photo");

  if (!(photo instanceof File) || photo.size === 0) {
    return {
      status: "error",
      message: "Pilih foto profil terlebih dahulu.",
    };
  }

  if (photo.size > MAX_AVATAR_BYTES) {
    return {
      status: "error",
      message: "Ukuran foto maksimal 2 MB.",
    };
  }

  if (!AVATAR_MIME_TYPES.has(photo.type)) {
    return {
      status: "error",
      message: "Format foto harus JPG, PNG, atau WebP.",
    };
  }

  const bytes = Buffer.from(await photo.arrayBuffer());
  const avatarUrl = `data:${photo.type};base64,${bytes.toString("base64")}`;

  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl },
  });

  revalidatePath("/profil");
  revalidatePath("/", "layout");

  return {
    status: "success",
    message: "Foto profil berhasil disimpan.",
  };
}
