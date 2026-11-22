import { buildStaffImportTemplate } from "@/lib/accounts/import";
import { getCurrentUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN" || user.mustChangePassword) {
    return new Response("Akses ditolak.", { status: 403 });
  }

  const buffer = await buildStaffImportTemplate();
  const filename = "template-impor-akun-pendidik.xlsx";

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
