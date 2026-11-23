import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  GraduationCap,
  Inbox,
  Search,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildAccountQuery,
  buildAccountWhere,
  parseAccountFilters,
} from "@/lib/admin/account-filters";
import { requireRole } from "@/lib/auth/guards";
import { APP_ROLES, ROLE_LABELS } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";

import { AccountImportForm } from "./import-form";
import { StaffAccountImportForm } from "./staff-import-form";

export const metadata: Metadata = {
  title: "Kelola Akun",
};

const PAGE_SIZE = 20;

type SearchParams = Promise<{
  q?: string | string[];
  role?: string | string[];
  status?: string | string[];
  page?: string | string[];
  created?: string | string[];
}>;

function getString(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

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

export default async function ManageAccountsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const admin = await requireRole("ADMIN");
  const query = await searchParams;

  const filters = parseAccountFilters(query);
  const { q, role, status } = filters;
  const pageValue = Number.parseInt(getString(query.page), 10);
  const page = Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1;

  const where = buildAccountWhere(filters);

  const [total, activeCount, inactiveCount] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.count({ where: { ...where, isActive: true } }),
    prisma.user.count({ where: { ...where, isActive: false } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const showingFrom = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(safePage * PAGE_SIZE, total);

  const accounts = await prisma.user.findMany({
    where,
    orderBy: { fullName: "asc" },
    skip: (safePage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      studentProfile: {
        select: {
          nis: true,
          kelas: true,
          grha: true,
        },
      },
      staffProfile: {
        select: {
          nip: true,
          canBeMentor: true,
        },
      },
    },
  });

  const buildQuery = (
    overrides: Partial<Record<"q" | "role" | "status" | "page", string>> = {},
  ) => buildAccountQuery(filters, overrides);

  const exportHref = `/api/admin/kelola-akun/export${buildAccountQuery(filters)}`;
  const isFiltered = Boolean(q) || role !== "ALL" || status !== "ALL";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Akun"
        description="Buat, perbarui, dan nonaktifkan akun siswa serta tenaga kependidikan."
      >
        <Button size="sm" variant="outline" asChild>
          <a href={exportHref}>
            <FileSpreadsheet />
            Ekspor per Kelas
          </a>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <a
            href={`/api/admin/kelola-akun/export-pendidik${buildAccountQuery(filters)}`}
          >
            <FileSpreadsheet />
            Ekspor Pendidik
          </a>
        </Button>
        <Button
          size="sm"
          variant="outline"
          asChild
          title="Template akun siswa dan tenaga pendidik"
        >
          <a href="/api/admin/kelola-akun/template">
            <Download />
            Template Excel
          </a>
        </Button>
        <Button size="sm" asChild>
          <Link href="/admin/kelola-akun/baru">
            <UserPlus />
            Tambah akun
          </Link>
        </Button>
      </PageHeader>

      {getString(query.created) === "1" ? (
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary shadow-xs">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10">
            <UsersRound className="size-4" />
          </div>
          <div>
            <p className="font-medium">Akun berhasil dibuat</p>
            <p className="text-primary/80">
              Password awal 123456. Pengguna wajib membuat username dan password
              pribadi saat login pertama.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card
          size="sm"
          className="bg-linear-to-br from-primary/[0.05] via-card to-card transition-shadow hover:shadow-sm"
        >
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UsersRound className="size-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Akun terfilter</p>
              <p className="text-lg font-semibold">{total}</p>
            </div>
          </CardContent>
        </Card>
        <Card
          size="sm"
          className="bg-linear-to-br from-primary/[0.05] via-card to-card transition-shadow hover:shadow-sm"
        >
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <GraduationCap className="size-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Aktif</p>
              <p className="text-lg font-semibold">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card
          size="sm"
          className="bg-linear-to-br from-primary/[0.05] via-card to-card transition-shadow hover:shadow-sm"
        >
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nonaktif</p>
              <p className="text-lg font-semibold">{inactiveCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <details className="group rounded-xl bg-card ring-1 ring-foreground/10 transition-shadow hover:shadow-sm">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileSpreadsheet className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Impor akun siswa dari Excel</p>
            <p className="text-xs text-muted-foreground">
              Unduh template, isi satu baris per siswa, lalu unggah kembali.
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
        </summary>
        <div className="space-y-3 border-t px-4 py-4">
          <p className="text-xs text-muted-foreground">
            Isi sheet Akun Siswa pada template Excel. Kolom Nama Lengkap, NIS,
            Grha, dan Kelas wajib ada. Username dibuat otomatis dari nama dan
            password awal 123456; pengguna wajib membuat kredensial pribadi saat
            login pertama. Akun yang sudah ada tidak akan ditimpa.
          </p>
          <AccountImportForm />
        </div>
      </details>

      <details className="group rounded-xl bg-card ring-1 ring-foreground/10 transition-shadow hover:shadow-sm">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UsersRound className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              Impor akun tenaga pendidik dari Excel
            </p>
            <p className="text-xs text-muted-foreground">
              Isi Nama Lengkap dan Nama Peran; NIP opsional.
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
        </summary>
        <div className="space-y-3 border-t px-4 py-4">
          <p className="text-xs text-muted-foreground">
            Isi sheet Akun Pendidik pada template Excel. Kolom Nama Lengkap dan
            Nama Peran wajib ada; NIP boleh dikosongkan atau kolomnya tidak
            disertakan. Nama peran boleh ditulis dengan label
            (misalnya Pegawai) atau kode peran (STAFF_ASRAMA). Username dibuat
            otomatis dari nama dan password awal 123456; akun Pembina otomatis
            dapat menjadi penyetuju izin. Akun yang sudah ada tidak akan
            ditimpa.
          </p>
          <StaffAccountImportForm />
        </div>
      </details>

      <Card>
        <CardHeader className="grid-cols-[auto_1fr] items-start gap-3 border-b">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Search className="size-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-sm">Cari dan filter akun</CardTitle>
            <CardDescription>
              Pencarian mencakup nama, username, NIS, NIP, kelas, dan grha.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form
            method="get"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_170px_150px_auto]"
          >
            <div className="space-y-1.5">
              <Label htmlFor="q" className="text-xs">
                Kata kunci
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="q"
                  name="q"
                  defaultValue={q}
                  placeholder="Nama, NIS, NIP, kelas..."
                  className="h-9 pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role" className="text-xs">
                Peran
              </Label>
              <select
                id="role"
                name="role"
                defaultValue={role}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="ALL">Semua peran</option>
                {APP_ROLES.map((appRole) => (
                  <option key={appRole} value={appRole}>
                    {ROLE_LABELS[appRole]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs">
                Status
              </Label>
              <select
                id="status"
                name="status"
                defaultValue={status}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="ALL">Semua status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button type="submit" className="h-9">
                Terapkan
              </Button>
              {isFiltered ? (
                <Button type="button" variant="ghost" className="h-9" asChild>
                  <Link href="/admin/kelola-akun">Reset</Link>
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {accounts.length === 0 ? (
        <Card className="bg-linear-to-b from-primary/[0.04] to-card">
          <CardContent className="relative flex flex-col items-center justify-center gap-3 overflow-hidden px-6 py-16 text-center">
            <div
              className="pointer-events-none absolute -top-10 left-1/2 size-36 -translate-x-1/2 rounded-full border border-primary/10"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -top-4 left-1/2 size-24 -translate-x-1/2 rounded-full bg-primary/[0.06]"
              aria-hidden="true"
            />
            <div className="relative flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/5">
              <Inbox className="size-6" />
            </div>
            <div className="relative">
              <p className="text-sm font-medium">
                {isFiltered ? "Tidak ada akun yang cocok" : "Belum ada akun"}
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {isFiltered
                  ? "Ubah kata kunci atau filter untuk melihat akun lain."
                  : "Tambahkan akun siswa atau tenaga kependidikan untuk memulai."}
              </p>
            </div>
            {!isFiltered ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/kelola-akun/baru">
                  <UserPlus />
                  Tambah akun pertama
                </Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <UsersRound className="size-3.5 shrink-0 text-primary" />
              Menampilkan {showingFrom}–{showingTo} dari {total} akun
            </span>
            <span>
              Halaman {safePage} dari {totalPages}
            </span>
          </div>

          {accounts.map((account) => {
            const profile = account.studentProfile;
            const staff = account.staffProfile;
            const meta = profile
              ? [profile.nis, profile.kelas, profile.grha]
                  .filter(Boolean)
                  .join(" · ")
              : staff?.nip
                ? `NIP ${staff.nip}`
                : staff
                  ? "Tanpa NIP"
                  : account.role === "ADMIN"
                  ? ""
                  : "Data profil belum lengkap";

            return (
              <Link
                key={account.id}
                href={`/admin/kelola-akun/${account.id}`}
                className={cn(
                  "group flex items-start gap-3 rounded-xl border bg-card p-4 shadow-xs transition-all hover:border-primary/30 hover:bg-accent/30 hover:shadow-sm sm:items-center",
                  !account.isActive && "bg-muted/20",
                )}
              >
                <Avatar className="mt-0.5 sm:mt-0">
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {getInitials(account.fullName)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold">
                      {account.fullName}
                    </p>
                    <Badge variant="secondary" className="text-[10px]">
                      {ROLE_LABELS[account.role]}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        account.isActive
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {account.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                    {account.mustChangePassword ? (
                      <Badge
                        variant="outline"
                        className="border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-300"
                      >
                        Wajib setup akun
                      </Badge>
                    ) : null}
                  </div>

                  <p className="truncate text-xs text-muted-foreground">
                    @{account.username}
                    {meta ? ` · ${meta}` : ""}
                    {account.id === admin.id ? " · Akun Anda" : ""}
                  </p>
                </div>

                <span className="hidden shrink-0 items-center gap-1.5 text-xs font-medium text-primary sm:inline-flex">
                  Kelola
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                asChild={safePage > 1}
              >
                {safePage > 1 ? (
                  <Link href={`/admin/kelola-akun${buildQuery({ page: String(safePage - 1) })}`}>
                    <ChevronLeft />
                    Sebelumnya
                  </Link>
                ) : (
                  <span>
                    <ChevronLeft />
                    Sebelumnya
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                asChild={safePage < totalPages}
              >
                {safePage < totalPages ? (
                  <Link href={`/admin/kelola-akun${buildQuery({ page: String(safePage + 1) })}`}>
                    Berikutnya
                    <ChevronRight />
                  </Link>
                ) : (
                  <span>
                    Berikutnya
                    <ChevronRight />
                  </span>
                )}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
