import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/db";

import { verifySessionToken } from "./jwt";
import { isAppRole } from "./roles";
import { readSessionToken } from "./session";
import type { SessionUser } from "./user-types";

export type { SessionUser } from "./user-types";

/**
 * Resolves the signed-in user from the session cookie and validates the token
 * against the database (active state and sessionVersion).
 *
 * Wrapped in React `cache` so the layout, page, and guards share one lookup per
 * request.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = await readSessionToken();

  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);

  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      sessionVersion: true,
      studentProfile: {
        select: {
          nis: true,
          grha: true,
          kelas: true,
        },
      },
      staffProfile: {
        select: {
          nip: true,
        },
      },
    },
  });

  if (!user || !user.isActive || user.sessionVersion !== payload.sv) {
    return null;
  }

  if (!isAppRole(user.role)) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    nis: user.studentProfile?.nis ?? null,
    nip: user.staffProfile?.nip ?? null,
    grha: user.studentProfile?.grha ?? null,
    kelas: user.studentProfile?.kelas ?? null,
  };
});
