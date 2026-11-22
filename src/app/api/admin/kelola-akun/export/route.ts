import { buildAccountExportZip } from "@/lib/accounts/export";
import {
  buildAccountWhere,
  parseAccountFilters,
} from "@/lib/admin/account-filters";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { getTodayInJakarta } from "@/lib/permissions/dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPORT_LIMIT = 5000;

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN" || user.mustChangePassword) {
    return new Response("Akses ditolak.", { status: 403 });
  }

  const url = new URL(request.url);
  const filters = parseAccountFilters(
    Object.fromEntries(url.searchParams.entries()),
  );

  const accounts = await prisma.user.findMany({
    where: {
      ...buildAccountWhere(filters),
      studentProfile: { isNot: null },
    },
    orderBy: { fullName: "asc" },
    take: EXPORT_LIMIT,
    select: {
      fullName: true,
      username: true,
      role: true,
      studentProfile: {
        select: {
          kelas: true,
        },
      },
    },
  });

  const students = accounts.filter((account) =>
    Boolean(account.studentProfile?.kelas.trim()),
  );
  const buffer = await buildAccountExportZip(students, {
    exportedBy: `${user.fullName} (@${user.username})`,
    filters,
    limit: EXPORT_LIMIT,
    reachedLimit: accounts.length >= EXPORT_LIMIT,
  });
  const filename = `daftar-akun-per-kelas-${getTodayInJakarta()}.zip`;

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "no-store",
    },
  });
}
