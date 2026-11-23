import { buildAccountExportWorkbook } from "@/lib/accounts/export";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { getTodayInJakarta } from "@/lib/permissions/dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPORT_LIMIT = 5000;

export async function GET() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN" || user.mustChangePassword) {
    return new Response("Akses ditolak.", { status: 403 });
  }

  // Ekspor selalu memakai seluruh akun siswa yang sudah terdaftar,
  // tanpa dipengaruhi filter yang sedang aktif di halaman Kelola Akun.
  const accounts = await prisma.user.findMany({
    where: { studentProfile: { isNot: null } },
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
  const buffer = await buildAccountExportWorkbook(students, {
    exportedBy: `${user.fullName} (@${user.username})`,
    filters: { q: "", role: "ALL", status: "ALL" },
    limit: EXPORT_LIMIT,
    reachedLimit: accounts.length >= EXPORT_LIMIT,
  });
  const filename = `daftar-akun-${getTodayInJakarta()}.xlsx`;

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "no-store",
    },
  });
}
