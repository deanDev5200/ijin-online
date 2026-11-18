import "server-only";

type AttemptBucket = {
  count: number;
  resetAt: number;
};

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_BUCKETS = 5_000;

const loginAttempts = new Map<string, AttemptBucket>();

function pruneExpiredBuckets(now: number): void {
  if (loginAttempts.size < MAX_BUCKETS) {
    return;
  }

  for (const [key, bucket] of loginAttempts) {
    if (bucket.resetAt <= now) {
      loginAttempts.delete(key);
    }
  }
}

export type LoginAttemptResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function consumeLoginAttempt(key: string): LoginAttemptResult {
  const now = Date.now();
  pruneExpiredBuckets(now);

  const existing = loginAttempts.get(key);

  if (!existing || existing.resetAt <= now) {
    loginAttempts.set(key, {
      count: 1,
      resetAt: now + LOGIN_WINDOW_MS,
    });

    return {
      allowed: true,
      remaining: LOGIN_LIMIT - 1,
      retryAfterSeconds: 0,
    };
  }

  if (existing.count >= LOGIN_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existing.resetAt - now) / 1000),
      ),
    };
  }

  existing.count += 1;

  return {
    allowed: true,
    remaining: LOGIN_LIMIT - existing.count,
    retryAfterSeconds: 0,
  };
}

export function clearLoginAttempts(key: string): void {
  loginAttempts.delete(key);
}

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return headers.get("x-real-ip") ?? "unknown";
}
