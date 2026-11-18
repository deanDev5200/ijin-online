import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/jwt";
import type { SessionTokenPayload } from "@/lib/auth/jwt";
import { canRoleAccessPath } from "@/lib/auth/roles";

async function readSession(
  request: NextRequest,
): Promise<SessionTokenPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

function redirectTo(request: NextRequest, pathname: string): NextResponse {
  return NextResponse.redirect(new URL(pathname, request.url));
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/login") {
    const session = await readSession(request);

    if (session) {
      return redirectTo(
        request,
        session.mcp ? "/ganti-password" : "/dashboard",
      );
    }

    return NextResponse.next();
  }

  const session = await readSession(request);

  if (pathname === "/") {
    if (!session) {
      return redirectTo(request, "/login");
    }

    return redirectTo(
      request,
      session.mcp ? "/ganti-password" : "/dashboard",
    );
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);

    return NextResponse.redirect(loginUrl);
  }

  if (session.mcp && pathname !== "/ganti-password") {
    return redirectTo(request, "/ganti-password");
  }

  if (pathname === "/ganti-password") {
    return NextResponse.next();
  }

  if (!canRoleAccessPath(session.role, pathname)) {
    return redirectTo(request, "/dashboard");
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
