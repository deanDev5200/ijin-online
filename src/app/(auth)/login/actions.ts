"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db";
import type { ActionState } from "@/lib/form-state";
import {
  DUMMY_PASSWORD_HASH,
  verifyPassword,
} from "@/lib/auth/password";
import {
  clearLoginAttempts,
  consumeLoginAttempt,
  getClientIp,
} from "@/lib/auth/rate-limit";
import { canRoleAccessPath, type AppRole } from "@/lib/auth/roles";
import { createSession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validations/auth";

function getSafeNextPath(value: string | undefined, role: AppRole): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  let url: URL;

  try {
    url = new URL(value, "http://internal.local");
  } catch {
    return "/dashboard";
  }

  if (url.origin !== "http://internal.local") {
    return "/dashboard";
  }

  const pathname = url.pathname;

  if (pathname === "/login" || pathname === "/ganti-password") {
    return "/dashboard";
  }

  if (!canRoleAccessPath(role, pathname)) {
    return "/dashboard";
  }

  return `${pathname}${url.search}`;
}

export async function loginAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const rawUsername = formData.get("username");
  const rawNext = formData.get("next");

  const usernameValue = typeof rawUsername === "string" ? rawUsername : "";

  const parsed = loginSchema.safeParse({
    username: usernameValue,
    password: formData.get("password") ?? "",
    next: typeof rawNext === "string" ? rawNext : undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data yang Anda masukkan.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values: { username: usernameValue },
    };
  }

  const { username, password, next } = parsed.data;

  const requestHeaders = await headers();
  const attemptKey = `${getClientIp(requestHeaders)}:${username}`;
  const attempt = consumeLoginAttempt(attemptKey);

  if (!attempt.allowed) {
    const minutes = Math.max(1, Math.ceil(attempt.retryAfterSeconds / 60));

    return {
      status: "error",
      message: `Terlalu banyak percobaan masuk. Coba lagi dalam ${minutes} menit.`,
      values: { username },
    };
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      role: true,
      passwordHash: true,
      isActive: true,
      sessionVersion: true,
      mustChangePassword: true,
    },
  });

  const passwordValid = await verifyPassword(
    password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );

  if (!user || !passwordValid) {
    return {
      status: "error",
      message: "Username atau password salah.",
      values: { username },
    };
  }

  if (!user.isActive) {
    return {
      status: "error",
      message: "Akun Anda tidak aktif. Hubungi administrator.",
      values: { username },
    };
  }

  clearLoginAttempts(attemptKey);

  await createSession({
    sub: user.id,
    role: user.role,
    sv: user.sessionVersion,
    mcp: user.mustChangePassword,
  });

  redirect(
    user.mustChangePassword
      ? "/ganti-password"
      : getSafeNextPath(next, user.role),
  );
}
