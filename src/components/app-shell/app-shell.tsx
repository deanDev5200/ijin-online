"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  GraduationCap,
  KeyRound,
  LogOut,
  Menu,
  UserRound,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { logoutAction } from "@/lib/auth/actions";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/user-types";
import { cn } from "@/lib/utils";

import {
  getNavigation,
  getPageTitle,
  isNavItemActive,
  type NavItem,
} from "./nav-items";

const schoolName = process.env.NEXT_PUBLIC_SCHOOL_NAME ?? "Sekolah Asrama";
const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "E-Dispen";

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function SidebarLink({
  item,
  active,
  unreadCount,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  unreadCount: number;
  onNavigate?: () => void;
}) {
  const showUnread = item.href === "/notifikasi" && unreadCount > 0;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
        active
          ? "bg-linear-to-r from-primary/20 to-primary/5 text-primary shadow-[0_10px_24px_-20px_rgba(37,99,235,0.9)] ring-1 ring-primary/25 before:absolute before:top-1/2 before:left-0 before:h-6 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-primary"
          : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
      )}
    >
      <item.icon
        className={cn(
          "size-4 shrink-0",
          active
            ? "text-primary"
            : "text-muted-foreground group-hover:text-sidebar-accent-foreground",
        )}
      />
      <span className="flex-1 truncate">{item.label}</span>
      {showUnread ? (
        <span
          className={cn(
            "flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
            active
              ? "bg-white/20 text-primary-foreground"
              : "bg-primary/10 text-primary",
          )}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}

function SidebarContent({
  user,
  unreadCount,
  onNavigate,
}: {
  user: SessionUser;
  unreadCount: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const sections = getNavigation(user.role);

  return (
    <div className="flex h-full flex-col bg-linear-to-b from-sidebar via-sidebar to-primary/10">
      <div className="flex h-16 items-center gap-3 border-b border-primary/15 bg-linear-to-r from-primary/10 to-transparent px-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-primary to-chart-2 text-primary-foreground shadow-md shadow-primary/30 ring-1 ring-white/20">
          <GraduationCap className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            {schoolName}
          </p>
          <p className="truncate text-sm font-semibold">{appName}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="flex items-center gap-2 px-3 pb-2 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground/80 uppercase">
              <span
                className="h-px w-3 rounded-full bg-primary/60"
                aria-hidden="true"
              />
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <SidebarLink
                    item={item}
                    active={isNavItemActive(pathname, item.href)}
                    unreadCount={unreadCount}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-xl bg-linear-to-br from-primary/15 to-sidebar-accent/70 p-3 ring-1 ring-primary/15">
          <Avatar>
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.fullName}</p>
            <p className="truncate text-xs text-primary">
              {ROLE_LABELS[user.role]}
            </p>
          </div>
          <span className="size-2 shrink-0 rounded-full bg-primary/80 ring-4 ring-primary/10" />
        </div>
        <p className="px-1 pt-3 text-[11px] text-muted-foreground">
          {appName} · Dikembangkan oleh Dhika Sumarta
        </p>
      </div>
    </div>
  );
}

export function AppShell({
  user,
  unreadCount,
  children,
}: {
  user: SessionUser;
  unreadCount: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, startLogout] = useTransition();
  const pageTitle = getPageTitle(user.role, pathname);
  const initials = getInitials(user.fullName);
  const notificationLabel = unreadCount
    ? `Notifikasi, ${unreadCount} belum dibaca`
    : "Notifikasi";

  return (
    <div className="min-h-svh bg-linear-to-br from-primary/[0.07] via-background to-primary/[0.09]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-primary/15 lg:block">
        <SidebarContent user={user} unreadCount={unreadCount} />
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-primary/15 bg-linear-to-r from-primary/[0.12] via-background/90 to-background/75 px-3 shadow-[0_1px_0_rgba(37,99,235,0.08)] backdrop-blur-xl sm:gap-3 sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Buka menu navigasi"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigasi utama</SheetTitle>
              <SheetDescription className="sr-only">
                Menu navigasi aplikasi sesuai peran Anda.
              </SheetDescription>
              <SidebarContent
                user={user}
                unreadCount={unreadCount}
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <p className="hidden text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase sm:block">
              {schoolName}
            </p>
            <h1 className="flex items-center gap-2 truncate text-base font-semibold">
              <span
                className="size-1.5 shrink-0 rounded-full bg-primary ring-3 ring-primary/15"
                aria-hidden="true"
              />
              {pageTitle}
            </h1>
          </div>

          <Button
            variant="ghost"
            size="icon"
            asChild
            className="relative"
            aria-label={notificationLabel}
          >
            <Link href="/notifikasi">
              <Bell className="size-5" />
              {unreadCount > 0 ? (
                <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-semibold text-white ring-2 ring-background">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 gap-2 px-2">
                <Avatar size="sm">
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-36 truncate text-sm font-medium sm:inline">
                  {user.fullName}
                </span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="truncate text-sm font-medium">
                  {user.fullName}
                </span>
                <span className="truncate text-xs font-normal text-muted-foreground">
                  @{user.username} · {ROLE_LABELS[user.role]}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profil">
                  <UserRound />
                  Profil saya
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/ganti-password">
                  <KeyRound />
                  Ganti password
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={isLoggingOut}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onSelect={(event) => {
                  event.preventDefault();
                  startLogout(() => {
                    void logoutAction();
                  });
                }}
              >
                <LogOut />
                {isLoggingOut ? "Mengeluarkan..." : "Keluar"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="app-page-enter p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
