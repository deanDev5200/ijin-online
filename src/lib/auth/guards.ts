import "server-only";

import { redirect } from "next/navigation";

import { getCurrentUser } from "./current-user";
import { isStaffRole, type AppRole } from "./roles";
import type { SessionUser } from "./user-types";

/**
 * Requires a valid session. Users with a pending forced password change are
 * still allowed through so they can reach /ganti-password.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    // A valid-looking JWT can outlive its account (deleted/deactivated user or
    // rotated sessionVersion). Clear the cookie through a route handler so the
    // proxy does not bounce the request between /login and /dashboard.
    redirect("/api/auth/clear-session");
  }

  return user;
}

/** Requires a signed-in user who has completed the forced password change. */
export async function requireAppUser(): Promise<SessionUser> {
  const user = await requireUser();

  if (user.mustChangePassword) {
    redirect("/ganti-password");
  }

  return user;
}

/** Requires one of the given roles, otherwise sends the user to the dashboard. */
export async function requireRole(
  ...roles: AppRole[]
): Promise<SessionUser> {
  const user = await requireAppUser();

  if (!roles.includes(user.role)) {
    redirect("/dashboard");
  }

  return user;
}

/** Requires any of the staff roles: Pembina, Staff Asrama, or Kepala Asrama. */
export async function requireStaff(): Promise<SessionUser> {
  const user = await requireAppUser();

  if (!isStaffRole(user.role)) {
    redirect("/dashboard");
  }

  return user;
}

/** For /login: signed-in users should not see the login form again. */
export async function requireGuest(): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    return;
  }

  redirect(user.mustChangePassword ? "/ganti-password" : "/dashboard");
}
