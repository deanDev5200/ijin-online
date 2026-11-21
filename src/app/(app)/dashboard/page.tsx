import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  FileClock,
  FilePlus2,
  FileText,
  History,
  Settings2,
  ShieldCheck,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { DashboardPermissionTypes } from "@/components/dashboard-permission-types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAppUser } from "@/lib/auth/guards";
import { ROLE_LABELS, type AppRole } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/user-types";
import { prisma } from "@/lib/db";
import { getActivePermissionTypes } from "@/lib/permissions/settings";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
};

const PENDING_STATUSES = [
  "PENDING_MENTOR",
  "PENDING_DORM_STAFF",
  "PENDING_DORM_HEAD",
  "PENDING_WAKASEK",
] as const;

type Stat = {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
};

type QuickAction = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 11) {
    return "Selamat pagi";
  }

  if (hour < 15) {
    return "Selamat siang";
  }

  if (hour < 18) {
    return "Selamat sore";
  }

  return "Selamat malam";
}

function pendingStatusForRole(role: AppRole) {
  if (role === "PEMBINA") {
    return "PENDING_MENTOR" as const;
  }

  if (role === "STAFF_ASRAMA") {
    return "PENDING_DORM_STAFF" as const;
  }

  if (role === "WAKASEK_KESISWAAN") {
    return "PENDING_WAKASEK" as const;
  }

  return "PENDING_DORM_HEAD" as const;
}

async function getStats(user: SessionUser): Promise<Stat[]> {
  if (user.role === "SISWA") {
    const studentScope = {
      students: { some: { studentId: user.id } },
    };

    const [total, waiting, approved] = await Promise.all([
      prisma.permissionRequest.count({ where: studentScope }),
      prisma.permissionRequest.count({
        where: {
          ...studentScope,
          status: { in: [...PENDING_STATUSES] },
        },
      }),
      prisma.permissionRequest.count({
        where: {
          ...studentScope,
          status: "APPROVED",
        },
      }),
    ]);

    return [
      {
        label: "Total Pengajuan",
        value: total,
        hint: "Izin yang melibatkan Anda",
        icon: FileText,
      },
      {
        label: "Menunggu",
        value: waiting,
        hint: "Sedang dalam proses persetujuan",
        icon: Clock3,
      },
      {
        label: "Disetujui",
        value: approved,
        hint: "Izin yang telah disetujui",
        icon: CheckCircle2,
      },
    ];
  }

  if (user.role === "ADMIN") {
    const [total, waiting, activeUsers] = await Promise.all([
      prisma.permissionRequest.count(),
      prisma.permissionRequest.count({
        where: { status: { in: [...PENDING_STATUSES] } },
      }),
      prisma.user.count({ where: { isActive: true } }),
    ]);

    return [
      {
        label: "Total Izin",
        value: total,
        hint: "Seluruh pengajuan di sistem",
        icon: ClipboardList,
      },
      {
        label: "Menunggu",
        value: waiting,
        hint: "Belum selesai diproses",
        icon: Clock3,
      },
      {
        label: "Akun Aktif",
        value: activeUsers,
        hint: "Siswa, pembina, dan staff",
        icon: UsersRound,
      },
    ];
  }

  const stageStatus = pendingStatusForRole(user.role);

  const [waiting, approved, rejected] = await Promise.all([
    prisma.permissionRequest.count({
      where: { status: stageStatus },
    }),
    prisma.approval.count({
      where: { approverId: user.id, status: "APPROVED" },
    }),
    prisma.approval.count({
      where: { approverId: user.id, status: "REJECTED" },
    }),
  ]);

  return [
    {
      label: "Menunggu Persetujuan Anda",
      value: waiting,
      hint: "Perlu ditinjau dan diputuskan",
      icon: Clock3,
    },
    {
      label: "Disetujui",
      value: approved,
      hint: "Keputusan yang Anda berikan",
      icon: CheckCircle2,
    },
    {
      label: "Ditolak",
      value: rejected,
      hint: "Keputusan yang Anda berikan",
      icon: FileClock,
    },
  ];
}

function getQuickActions(role: AppRole): QuickAction[] {
  if (role === "SISWA") {
    return [
      {
        href: "/request-izin",
        label: "Ajukan Izin",
        description: "Buat dispensasi kegiatan asrama",
        icon: FilePlus2,
      },
      {
        href: "/riwayat-request",
        label: "Riwayat Izin",
        description: "Lihat pengajuan dan statusnya",
        icon: History,
      },
      {
        href: "/notifikasi",
        label: "Notifikasi",
        description: "Pemberitahuan terbaru",
        icon: Bell,
      },
      {
        href: "/profil",
        label: "Profil",
        description: "Informasi akun Anda",
        icon: UserRound,
      },
    ];
  }

  if (role === "ADMIN") {
    return [
      {
        href: "/admin/indeks-izin",
        label: "Indeks Izin",
        description: "Rekap seluruh izin siswa",
        icon: ClipboardList,
      },
      {
        href: "/admin/kelola-akun",
        label: "Kelola Akun",
        description: "Buat dan kelola akun pengguna",
        icon: UsersRound,
      },
      {
        href: "/admin/pengaturan-perizinan",
        label: "Pengaturan",
        description: "Atur jenis izin dan penyetujunya",
        icon: Settings2,
      },
      {
        href: "/notifikasi",
        label: "Notifikasi",
        description: "Pemberitahuan terbaru",
        icon: Bell,
      },
    ];
  }

  return [
    {
      href: "/permintaan-izin",
      label: "Permintaan Izin",
      description: "Tinjau pengajuan yang menunggu",
      icon: ClipboardCheck,
    },
    {
      href: "/riwayat-approval",
      label: "Riwayat Approval",
      description: "Lihat keputusan yang pernah Anda berikan",
      icon: FileClock,
    },
    {
      href: "/notifikasi",
      label: "Notifikasi",
      description: "Pemberitahuan terbaru",
      icon: Bell,
    },
    {
      href: "/profil",
      label: "Profil",
      description: "Informasi akun Anda",
      icon: UserRound,
    },
  ];
}

function AccountField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ passwordChanged?: string }>;
}) {
  const user = await requireAppUser();
  const params = await searchParams;
  const [stats, permissionTypes] = await Promise.all([
    getStats(user),
    getActivePermissionTypes(),
  ]);
  const quickActions = getQuickActions(user.role);
  const firstName = user.fullName.split(" ")[0] || user.fullName;
  const isStudent = user.role === "SISWA";

  const subtitle = isStudent
    ? "gunakanlah dispensasi sebaik mungkin, dan semoga mendapatkan hasil yang maksimal"
    : user.role === "ADMIN"
      ? "Kelola akun dan pantau seluruh perizinan asrama."
      : "Tinjau permintaan izin yang menunggu keputusan Anda.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            {getGreeting()}, {firstName}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Ringkasan Perizinan Terpadu
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        </div>
        <Badge variant="outline" className="w-fit gap-1.5 py-1">
          <ShieldCheck className="size-3.5 text-primary" />
          Akun aktif · {ROLE_LABELS[user.role]}
        </Badge>
      </div>

      {params.passwordChanged === "1" ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <p>
            Username dan password berhasil disimpan. Gunakan kredensial baru
            Anda pada login berikutnya.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.hint}
                  </p>
                </div>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <stat.icon className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aksi cepat</CardTitle>
            <CardDescription>
              Pintasan ke halaman yang paling sering Anda gunakan.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((action, index) => (
              <Link
                key={action.href}
                href={action.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl border p-3 transition-all hover:border-primary/30 hover:bg-accent",
                  index === 0
                    ? "border-primary/20 bg-linear-to-br from-primary/10 to-background"
                    : "bg-background",
                )}
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg text-primary",
                    index === 0 ? "bg-primary text-primary-foreground" : "bg-primary/10",
                  )}
                >
                  <action.icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{action.label}</p>
                    {index === 0 && isStudent ? (
                      <Badge variant="secondary" className="text-[10px]">
                        Utama
                      </Badge>
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {action.description}
                  </p>
                </div>
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Jenis izin & persetujuan</CardTitle>
            <CardDescription>
              Setiap jenis izin memiliki satu penyetuju yang ditentukan admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <DashboardPermissionTypes types={permissionTypes} />
            {isStudent ? (
              <Link
                href="/request-izin"
                className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
              >
                Lihat isian lengkap pada formulir pengajuan
                <ArrowUpRight className="size-3.5" />
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data akun</CardTitle>
          <CardDescription>
            Informasi ini dikelola oleh administrator asrama.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AccountField label="Nama lengkap" value={user.fullName} />
          {isStudent ? (
            <>
              <AccountField label="NIS" value={user.nis} />
              <AccountField label="Kelas" value={user.kelas} />
              <AccountField label="Grha" value={user.grha} />
            </>
          ) : (
            <>
              <AccountField label="NIP" value={user.nip} />
              <AccountField label="Peran" value={ROLE_LABELS[user.role]} />
              <AccountField label="Username" value={user.username} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
