import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BellOff, CheckCheck } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAppUser } from "@/lib/auth/guards";
import { isStaffRole, type AppRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";

import { markAllNotificationsReadAction } from "./actions";

export const metadata: Metadata = {
  title: "Notifikasi",
};

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

function getNotificationHref(
  role: AppRole,
  requestId: string | null,
): string | null {
  if (!requestId) {
    return null;
  }

  if (role === "SISWA") {
    return `/riwayat-request/${requestId}`;
  }

  if (isStaffRole(role)) {
    return `/permintaan-izin/${requestId}`;
  }

  return null;
}

export default async function NotificationsPage() {
  const user = await requireAppUser();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      message: true,
      isRead: true,
      requestId: true,
      createdAt: true,
    },
  });

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifikasi"
        description="Pemberitahuan terbaru tentang pengajuan izin dan aktivitas akun Anda."
      >
        {unreadCount > 0 ? (
          <form action={markAllNotificationsReadAction}>
            <Button type="submit" variant="outline" size="sm">
              <CheckCheck />
              Tandai semua dibaca
            </Button>
          </form>
        ) : null}
        {unreadCount > 0 ? (
          <Badge variant="secondary">{unreadCount} belum dibaca</Badge>
        ) : null}
      </PageHeader>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <BellOff className="size-6" />
            </div>
            <div>
              <p className="text-sm font-medium">Belum ada notifikasi</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Pemberitahuan tentang pengajuan izin Anda akan muncul di sini.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">Kotak masuk</CardTitle>
              <CardDescription>
                Menampilkan {notifications.length} notifikasi terbaru.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {notifications.map((notification) => {
                const href = getNotificationHref(
                  user.role,
                  notification.requestId,
                );

                return (
                  <li
                    key={notification.id}
                    className={cn(
                      "flex gap-3 px-4 py-4 sm:px-6",
                      !notification.isRead && "bg-primary/[0.035]",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        notification.isRead
                          ? "bg-border"
                          : "bg-primary ring-4 ring-primary/10",
                      )}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">
                          {notification.title}
                        </p>
                        {!notification.isRead ? (
                          <Badge variant="secondary" className="text-[10px]">
                            Baru
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {notification.message}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="text-xs text-muted-foreground/80">
                          {dateFormatter.format(notification.createdAt)}
                        </p>
                        {href ? (
                          <Link
                            href={href}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            Buka pengajuan
                            <ArrowRight className="size-3" />
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
