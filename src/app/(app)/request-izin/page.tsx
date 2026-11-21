import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { requireRole } from "@/lib/auth/guards";
import { getTodayInJakarta } from "@/lib/permissions/dates";
import { prisma } from "@/lib/db";
import {
  getActivePermissionTypes,
  getPermissionSettings,
} from "@/lib/permissions/settings";

import { PermissionRequestForm } from "./request-form";

export const metadata: Metadata = {
  title: "Ajukan Izin",
};

export default async function RequestPermissionPage() {
  const user = await requireRole("SISWA");

  const [studentUsers, types, settings] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: "SISWA",
        isActive: true,
        id: { not: user.id },
      },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        studentProfile: {
          select: {
            nis: true,
            kelas: true,
            grha: true,
          },
        },
      },
    }),
    getActivePermissionTypes(),
    getPermissionSettings(),
  ]);

  const students = studentUsers.map((student) => ({
    id: student.id,
    fullName: student.fullName,
    nis: student.studentProfile?.nis ?? null,
    kelas: student.studentProfile?.kelas ?? null,
    grha: student.studentProfile?.grha ?? null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ajukan Izin"
        description="Buat pengajuan sesuai formulir jenis izin. Kolom isian menyesuaikan jenis izin yang Anda pilih, lalu pengajuan tinggal menunggu penyetuju."
      />

      <PermissionRequestForm
        requester={{
          id: user.id,
          fullName: user.fullName,
          nis: user.nis,
          kelas: user.kelas,
          grha: user.grha,
        }}
        students={students}
        types={types}
        settings={{
          minLeadDays: settings.minLeadDays,
          maxRangeDays: settings.maxRangeDays,
          maxStudentsPerRequest: settings.maxStudentsPerRequest,
          defaultStartTime: settings.defaultStartTime,
          defaultEndTime: settings.defaultEndTime,
        }}
        today={getTodayInJakarta()}
      />
    </div>
  );
}
