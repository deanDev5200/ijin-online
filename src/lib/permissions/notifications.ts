import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { Role } from "@/generated/prisma/enums";

export type RequestNotification = {
  userId: string;
  title: string;
  message: string;
  requestId: string;
};

export async function createRequestNotifications(
  tx: Prisma.TransactionClient,
  entries: RequestNotification[],
): Promise<void> {
  if (entries.length === 0) {
    return;
  }

  const unique = new Map<string, RequestNotification>();

  for (const entry of entries) {
    unique.set(`${entry.userId}:${entry.requestId}:${entry.title}`, entry);
  }

  await tx.notification.createMany({
    data: [...unique.values()],
  });
}

export async function getActiveUserIdsByRole(
  tx: Prisma.TransactionClient,
  role: Role,
): Promise<string[]> {
  const users = await tx.user.findMany({
    where: { role, isActive: true },
    select: { id: true },
  });

  return users.map((user) => user.id);
}
