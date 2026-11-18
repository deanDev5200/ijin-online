"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAppUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import type { ActionState } from "@/lib/form-state";
import { usernameSchema } from "@/lib/validations/auth";

const updateUsernameSchema = z.object({
  username: usernameSchema,
});

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function updateUsernameAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAppUser();

  const parsed = updateUsernameSchema.safeParse({
    username: formData.get("username") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const existing = await prisma.user.findFirst({
    where: {
      username: parsed.data.username,
      id: { not: user.id },
    },
    select: { id: true },
  });

  if (existing) {
    return {
      status: "error",
      fieldErrors: { username: ["Username sudah digunakan."] },
    };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { username: parsed.data.username },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        status: "error",
        fieldErrors: { username: ["Username sudah digunakan."] },
      };
    }

    throw error;
  }

  revalidatePath("/profil");
  revalidatePath("/", "layout");

  return {
    status: "success",
    message: "Username berhasil diperbarui.",
  };
}
