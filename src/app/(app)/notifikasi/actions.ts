"use server";

import { revalidatePath } from "next/cache";

import { requireAppUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";

export async function markAllNotificationsReadAction(): Promise<void> {
  const user = await requireAppUser();

  await prisma.notification.updateMany({
    where: {
      userId: user.id,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  revalidatePath("/notifikasi");
  revalidatePath("/", "layout");
}
