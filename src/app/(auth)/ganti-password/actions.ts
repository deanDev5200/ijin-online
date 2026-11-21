"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/guards";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { type ActionState } from "@/lib/form-state";
import {
  accountSetupSchema,
  changePasswordSchema,
} from "@/lib/validations/auth";

function toFormState(
  issue: { path?: PropertyKey[] },
  message: string,
): ActionState {
  const field = issue.path?.[0];
  return {
    status: "error",
    message,
    fieldErrors:
      field === undefined ? undefined : { [String(field)]: [message] },
  };
}

export async function changePasswordAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const raw = {
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true, sessionVersion: true },
  });

  if (!account) {
    return { status: "error", message: "Akun tidak ditemukan." };
  }

  if (user.mustChangePassword) {
    const parsed = accountSetupSchema.safeParse({
      ...raw,
      username: formData.get("username"),
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return toFormState(issue, issue?.message ?? "Periksa kembali data Anda.");
    }

    const { username, newPassword, currentPassword } = parsed.data;

    const existing = await prisma.user.findFirst({
      where: {
        username: { equals: username, mode: "insensitive" },
        id: { not: user.id },
      },
      select: { id: true },
    });
    if (existing) {
      return toFormState(
        { path: ["username"] },
        "Username sudah digunakan. Pilih username lain.",
      );
    }

    const validPassword = await verifyPassword(
      currentPassword,
      account.passwordHash,
    );
    if (!validPassword) {
      return toFormState(
        { path: ["currentPassword"] },
        "Password awal tidak sesuai.",
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        username,
        passwordHash: await hashPassword(newPassword),
        mustChangePassword: false,
      },
    });

    // Perbarui klaim sesi agar proxy tidak mengembalikan pengguna ke halaman
    // setup setelah kredensial baru tersimpan.
    await createSession({
      sub: user.id,
      role: user.role,
      sv: account.sessionVersion,
      mcp: false,
    });

    redirect("/dashboard?passwordChanged=1");
  }

  const parsed = changePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return toFormState(issue, issue?.message ?? "Periksa kembali data Anda.");
  }

  const validPassword = await verifyPassword(
    parsed.data.currentPassword,
    account.passwordHash,
  );
  if (!validPassword) {
    return toFormState(
      { path: ["currentPassword"] },
      "Password saat ini tidak sesuai.",
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });

  return { status: "success", message: "Password berhasil diperbarui." };
}
