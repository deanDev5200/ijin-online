import {
  Bell,
  ClipboardCheck,
  ClipboardList,
  FileClock,
  FilePlus2,
  History,
  LayoutDashboard,
  Settings2,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import type { AppRole } from "@/lib/auth/roles";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

const dashboardItem: NavItem = {
  href: "/dashboard",
  label: "Dashboard",
  icon: LayoutDashboard,
};

const notificationsItem: NavItem = {
  href: "/notifikasi",
  label: "Notifikasi",
  icon: Bell,
};

const profileItem: NavItem = {
  href: "/profil",
  label: "Profil",
  icon: UserRound,
};

const navigationByRole: Record<AppRole, NavSection[]> = {
  SISWA: [
    {
      title: "Menu Utama",
      items: [
        dashboardItem,
        {
          href: "/request-izin",
          label: "Ajukan Izin",
          icon: FilePlus2,
        },
        {
          href: "/riwayat-request",
          label: "Riwayat Izin",
          icon: History,
        },
      ],
    },
    {
      title: "Akun",
      items: [notificationsItem, profileItem],
    },
  ],
  PEMBINA: [
    {
      title: "Menu Utama",
      items: [
        dashboardItem,
        {
          href: "/permintaan-izin",
          label: "Permintaan Izin",
          icon: ClipboardCheck,
        },
        {
          href: "/riwayat-approval",
          label: "Riwayat Approval",
          icon: FileClock,
        },
      ],
    },
    {
      title: "Akun",
      items: [notificationsItem, profileItem],
    },
  ],
  STAFF_ASRAMA: [
    {
      title: "Menu Utama",
      items: [
        dashboardItem,
        {
          href: "/permintaan-izin",
          label: "Permintaan Izin",
          icon: ClipboardCheck,
        },
        {
          href: "/riwayat-approval",
          label: "Riwayat Approval",
          icon: FileClock,
        },
      ],
    },
    {
      title: "Akun",
      items: [notificationsItem, profileItem],
    },
  ],
  KEPALA_ASRAMA: [
    {
      title: "Menu Utama",
      items: [
        dashboardItem,
        {
          href: "/permintaan-izin",
          label: "Permintaan Izin",
          icon: ClipboardCheck,
        },
        {
          href: "/riwayat-approval",
          label: "Riwayat Approval",
          icon: FileClock,
        },
      ],
    },
    {
      title: "Akun",
      items: [notificationsItem, profileItem],
    },
  ],
  WAKASEK_KESISWAAN: [
    {
      title: "Menu Utama",
      items: [
        dashboardItem,
        {
          href: "/permintaan-izin",
          label: "Permintaan Izin",
          icon: ClipboardCheck,
        },
        {
          href: "/riwayat-approval",
          label: "Riwayat Approval",
          icon: FileClock,
        },
      ],
    },
    {
      title: "Akun",
      items: [notificationsItem, profileItem],
    },
  ],
  ADMIN: [
    {
      title: "Menu Utama",
      items: [
        dashboardItem,
        {
          href: "/admin/indeks-izin",
          label: "Indeks Izin",
          icon: ClipboardList,
        },
      ],
    },
    {
      title: "Administrasi",
      items: [
        {
          href: "/admin/kelola-akun",
          label: "Kelola Akun",
          icon: UsersRound,
        },
        {
          href: "/admin/pengaturan-perizinan",
          label: "Pengaturan Perizinan",
          icon: Settings2,
        },
      ],
    },
    {
      title: "Akun",
      items: [notificationsItem, profileItem],
    },
  ],
};

export function getNavigation(role: AppRole): NavSection[] {
  return navigationByRole[role];
}

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getPageTitle(role: AppRole, pathname: string): string {
  const items = navigationByRole[role].flatMap((section) => section.items);

  const matches = items
    .filter((item) => isNavItemActive(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length);

  return matches[0]?.label ?? "Dashboard";
}
