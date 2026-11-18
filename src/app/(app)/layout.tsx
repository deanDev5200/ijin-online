import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell/app-shell";
import { requireAppUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireAppUser();

  const unreadCount = await prisma.notification.count({
    where: {
      userId: user.id,
      isRead: false,
    },
  });

  return (
    <AppShell user={user} unreadCount={unreadCount}>
      {children}
    </AppShell>
  );
}
