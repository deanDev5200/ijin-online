import "server-only";

import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

/**
 * A real bcrypt hash used when a username does not exist, so failed logins
 * take roughly the same time as existing accounts.
 */
export const DUMMY_PASSWORD_HASH =
  "$2b$12$pUsiMLS6qunYj219QPNRK.1ZM/5JIHtVWqbHBJwIsnbQ/NSGYuj9u";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
