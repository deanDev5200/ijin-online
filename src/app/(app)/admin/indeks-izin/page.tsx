import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Inbox,
  Search,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { RequestListItem } from "@/components/permission/request-list-item";
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
  buildPermissionIndexWhere,
  parsePermissionIndexFilters,
} from "@/lib/admin/permission-index";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { permissionRequestListSelect } from "@/lib/permissions/queries";
import { getPermissionSettings } from "@/lib/permissions/settings";
import { REQUEST_STATUS_LABELS } from "@/lib/permissions/status";
import { getDatabaseNow } from "@/lib/permissions/time";

export const metadata: Metadata = {
  title: "Indeks Izin",
};

const PAGE_SIZE = 20;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getString(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function buildIndexQuery(
  filters: ReturnType<typeof parsePermissionIndexFilters>,
  page?: number,
): string {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.status !== "ALL") params.set("status", filters.status);
  if (filters.typeId !== "ALL") params.set("typeId", filters.typeId);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (page && page > 1) params.set("page", String(page));

  const query = params.toString();

  return query ? `?${query}` : "";
}

export default async function PermissionIndexPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole("ADMIN");
  const query = await searchParams;
  const filters = parsePermissionIndexFilters(query);
  const pageValue = Number.parseInt(getString(query.page), 10);
  const requestedPage =
    Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1;

  const where = buildPermissionIndexWhere(filters);

  const [total, types, settings, now] = await Promise.all([
    prisma.permissionRequest.count({ where }),
    prisma.permissionType.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    }),
    getPermissionSettings(),
    getDatabaseNow(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const showingFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(page * PAGE_SIZE, total);

  const requests = await prisma.permissionRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: permissionRequestListSelect,
  });

  const isFiltered =
    Boolean(filters.q) ||
    filters.status !== "ALL" ||
    filters.typeId !== "ALL" ||
    Boolean(filters.from) ||
    Boolean(filters.to);

  const exportHref = `/api/admin/indeks-izin/export${buildIndexQuery(filters)}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Indeks Izin"
        description="Telusuri seluruh pengajuan izin asrama, periksa detail persetujuan, dan ekspor data untuk laporan."
      >
        <Badge variant="secondary" className="h-7 gap-1.5 px-3">
          <ClipboardList className="size-3.5" />
          {total} pengajuan
        </Badge>
        <Button variant="outline" asChild>
          <a href={exportHref}>
            <Download />
            Ekspor Excel
          </a>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-sm">Cari dan filter izin</CardTitle>
          <CardDescription>
            Pencarian mencakup nama siswa, NIS, kelas, grha, tujuan, dan tempat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form method="get" className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="q" className="text-xs">
                  Kata kunci siswa / pengajuan
                </Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="q"
                    name="q"
                    defaultValue={filters.q}
                    placeholder="Nama siswa, NIS, kelas, grha..."
                    className="h-9 pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs">
                  Status
                </Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={filters.status}
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="ALL">Semua status</option>
                  {Object.entries(REQUEST_STATUS_LABELS).map(
                    ([status, label]) => (
                      <option key={status} value={status}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="typeId" className="text-xs">
                  Jenis izin
                </Label>
                <select
                  id="typeId"
                  name="typeId"
                  defaultValue={filters.typeId}
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="ALL">Semua jenis izin</option>
                  {types.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                      {type.isActive ? "" : " (nonaktif)"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="from" className="text-xs">
                  Tanggal mulai dari
                </Label>
                <Input
                  id="from"
                  name="from"
                  type="date"
                  defaultValue={filters.from}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="to" className="text-xs">
                  Tanggal selesai sampai
                </Label>
                <Input
                  id="to"
                  name="to"
                  type="date"
                  defaultValue={filters.to}
                  className="h-9"
                />
              </div>

              <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
                <Button type="submit" className="h-9">
                  Terapkan filter
                </Button>
                {isFiltered ? (
                  <Button type="button" variant="ghost" className="h-9" asChild>
                    <Link href="/admin/indeks-izin">Reset</Link>
                  </Button>
                ) : null}
                <span className="ml-auto self-center text-xs text-muted-foreground">
                  Batas waktu persetujuan: {settings.approvalDeadlineDays} hari
                </span>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Inbox className="size-6" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {isFiltered
                  ? "Tidak ada izin yang cocok"
                  : "Belum ada pengajuan izin"}
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {isFiltered
                  ? "Ubah kata kunci atau filter tanggal untuk melihat pengajuan lain."
                  : "Pengajuan dari siswa akan muncul di sini beserta status persetujuannya."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
            <span>
              Menampilkan {showingFrom}–{showingTo} dari {total} pengajuan
            </span>
            <span>
              Halaman {page} dari {totalPages}
            </span>
          </div>

          {requests.map((request) => (
            <RequestListItem
              key={request.id}
              request={request}
              href={`/admin/indeks-izin/${request.id}`}
              showRequester
              deadlineDays={settings.approvalDeadlineDays}
              now={now}
            />
          ))}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                asChild={page > 1}
              >
                {page > 1 ? (
                  <Link
                    href={`/admin/indeks-izin${buildIndexQuery(filters, page - 1)}`}
                  >
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
                disabled={page >= totalPages}
                asChild={page < totalPages}
              >
                {page < totalPages ? (
                  <Link
                    href={`/admin/indeks-izin${buildIndexQuery(filters, page + 1)}`}
                  >
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
