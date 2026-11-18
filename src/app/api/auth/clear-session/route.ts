import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/jwt";

/**
 * Clears a stale or invalid session cookie before sending the user back to the
 * login page. The proxy skips /api routes, so this cannot loop even when the
 * JWT itself is still valid but the account has been deactivated or deleted.
 */
export function GET(request: Request): NextResponse {
  const response = NextResponse.redirect(new URL("/login", request.url));

  response.cookies.delete(SESSION_COOKIE_NAME);

  return response;
}
