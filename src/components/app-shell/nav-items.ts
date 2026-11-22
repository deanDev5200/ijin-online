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

const accountSection: NavSection = {
  title: "Akun",
  items: [notificationsItem, profileItem],
};

const approvalItems: NavItem[] = [
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
];

const staffSections: NavSection[] = [
  { title: "Ringkasan", items: [dashboardItem] },
  { title: "Persetujuan", items: approvalItems },
  accountSection,
];

const navigationByRole: Record<AppRole, NavSection[]> = {
  SISWA: [
    { title: "Ringkasan", items: [dashboardItem] },
    {
      title: "Pengajuan",
      items: [
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
    accountSection,
  ],
  PEMBINA: staffSections,
  STAFF_ASRAMA: staffSections,
  STAFF_ASRAMA_TAMBAHAN: staffSections,
  KEPALA_ASRAMA: staffSections,
  WAKASEK_KESISWAAN: staffSections,
  GURU: staffSections,
  WAKASEK_AKADEMIK: staffSections,
  KEPALA_SEKOLAH: staffSections,
  ADMIN: [
    { title: "Ringkasan", items: [dashboardItem] },
    {
      title: "Manajemen",
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
      title: "Laporan",
      items: [
        {
          href: "/admin/indeks-izin",
          label: "Indeks Izin",
          icon: ClipboardList,
        },
      ],
    },
    accountSection,
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
