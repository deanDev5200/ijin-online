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
