import { SignJWT, jwtVerify } from "jose";

import { isAppRole, type AppRole } from "./roles";

export const SESSION_COOKIE_NAME = "ijin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const SESSION_ISSUER = "ijin-online";
const SESSION_AUDIENCE = "ijin-online-app";

export type SessionTokenPayload = {
  sub: string;
  role: AppRole;
  /** Database sessionVersion at the time the token was issued. */
  sv: number;
  /** Whether the user must change their password before using the app. */
  mcp: boolean;
};

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET belum diatur atau terlalu pendek. Isi minimal 32 karakter di .env.",
    );
  }

  return new TextEncoder().encode(secret);
}

export async function signSessionToken(
  payload: SessionTokenPayload,
): Promise<string> {
  return new SignJWT({
    role: payload.role,
    sv: payload.sv,
    mcp: payload.mcp,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
    });

    if (
      typeof payload.sub !== "string" ||
      !isAppRole(payload.role) ||
      typeof payload.sv !== "number" ||
      !Number.isInteger(payload.sv) ||
      typeof payload.mcp !== "boolean"
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      role: payload.role,
      sv: payload.sv,
      mcp: payload.mcp,
    };
  } catch {
    // Invalid, expired, or tampered tokens are treated as unauthenticated.
    return null;
  }
}
