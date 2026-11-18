import "server-only";

import { prisma } from "@/lib/db";

/**
 * Reads the current time from PostgreSQL so deadline badges are computed from
 * the same clock as stored timestamps and stay pure during render.
 */
export async function getDatabaseNow(): Promise<Date> {
  const rows = await prisma.$queryRaw<Array<{ now: Date }>>`
    SELECT CURRENT_TIMESTAMP AS now
  `;

  return rows[0]?.now ?? new Date(0);
}
