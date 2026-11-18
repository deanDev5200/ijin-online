"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth/guards";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import type { ActionState } from "@/lib/form-state";
import { changePasswordSchema } from "@/lib/validations/auth";
import { prisma } from "@/lib/db";

export async function changePasswordAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword") ?? "",
    newPassword: formData.get("newPassword") ?? "",
    confirmPassword: formData.get("confirmPassword") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data yang Anda masukkan.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (!account) {
    return {
      status: "error",
      message: "Akun tidak ditemukan. Silakan masuk kembali.",
    };
  }

  const currentPasswordValid = await verifyPassword(
    parsed.data.currentPassword,
    account.passwordHash,
  );

  if (!currentPasswordValid) {
    return {
      status: "error",
      fieldErrors: {
        currentPassword: ["Password saat ini salah."],
      },
    };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      mustChangePassword: false,
      sessionVersion: { increment: 1 },
    },
    select: {
      id: true,
      role: true,
      sessionVersion: true,
      mustChangePassword: true,
    },
  });

  await createSession({
    sub: updated.id,
    role: updated.role,
    sv: updated.sessionVersion,
    mcp: updated.mustChangePassword,
  });

  redirect("/dashboard?passwordChanged=1");
}
