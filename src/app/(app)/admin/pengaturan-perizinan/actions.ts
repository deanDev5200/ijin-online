"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import type { ActionState } from "@/lib/form-state";
import {
  mentorSelectionSchema,
  permissionSettingsSchema,
  permissionTypeSchema,
} from "@/lib/validations/account";

function getFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export async function updatePermissionSettingsAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("ADMIN");

  const parsed = permissionSettingsSchema.safeParse({
    minLeadDays: getFormValue(formData, "minLeadDays"),
    maxRangeDays: getFormValue(formData, "maxRangeDays"),
    maxStudentsPerRequest: getFormValue(formData, "maxStudentsPerRequest"),
    approvalDeadlineDays: getFormValue(formData, "approvalDeadlineDays"),
    defaultStartTime: getFormValue(formData, "defaultStartTime"),
    defaultEndTime: getFormValue(formData, "defaultEndTime"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali ketentuan pengajuan.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  await prisma.permissionSetting.upsert({
    where: { id: "default" },
    update: parsed.data,
    create: { id: "default", ...parsed.data },
  });

  revalidatePath("/admin/pengaturan-perizinan");
  revalidatePath("/admin/indeks-izin");
  revalidatePath("/request-izin");

  return {
    status: "success",
    message: "Ketentuan pengajuan berhasil disimpan.",
  };
}

export async function createPermissionTypeAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("ADMIN");

  const parsed = permissionTypeSchema.safeParse({
    name: getFormValue(formData, "name"),
    description: getFormValue(formData, "description"),
    isActive: getFormValue(formData, "isActive") || "true",
    sortOrder: getFormValue(formData, "sortOrder") || "0",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data jenis izin.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const existing = await prisma.permissionType.findUnique({
    where: { name: parsed.data.name },
    select: { id: true },
  });

  if (existing) {
    return {
      status: "error",
      message: "Nama jenis izin sudah digunakan.",
      fieldErrors: { name: ["Nama jenis izin sudah digunakan."] },
    };
  }

  await prisma.permissionType.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      isActive: parsed.data.isActive === "true",
      sortOrder: parsed.data.sortOrder,
    },
  });

  revalidatePath("/admin/pengaturan-perizinan");
  revalidatePath("/request-izin");

  return {
    status: "success",
    message: "Jenis izin baru berhasil ditambahkan.",
  };
}

export async function updatePermissionTypeAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("ADMIN");

  const parsed = permissionTypeSchema.safeParse({
    typeId: getFormValue(formData, "typeId"),
    name: getFormValue(formData, "name"),
    description: getFormValue(formData, "description"),
    isActive: getFormValue(formData, "isActive") || "true",
    sortOrder: getFormValue(formData, "sortOrder") || "0",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data jenis izin.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  if (!parsed.data.typeId) {
    return { status: "error", message: "Jenis izin tidak ditemukan." };
  }

  const type = await prisma.permissionType.findUnique({
    where: { id: parsed.data.typeId },
    select: { id: true, isActive: true },
  });

  if (!type) {
    return { status: "error", message: "Jenis izin tidak ditemukan." };
  }

  const existing = await prisma.permissionType.findFirst({
    where: {
      name: parsed.data.name,
      id: { not: type.id },
    },
    select: { id: true },
  });

  if (existing) {
    return {
      status: "error",
      message: "Nama jenis izin sudah digunakan.",
      fieldErrors: { name: ["Nama jenis izin sudah digunakan."] },
    };
  }

  const nextActive = parsed.data.isActive === "true";

  if (type.isActive && !nextActive) {
    const otherActive = await prisma.permissionType.count({
      where: {
        isActive: true,
        id: { not: type.id },
      },
    });

    if (otherActive === 0) {
      return {
        status: "error",
        message:
          "Minimal satu jenis izin harus aktif agar siswa dapat mengajukan izin.",
      };
    }
  }

  await prisma.permissionType.update({
    where: { id: type.id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      isActive: nextActive,
      sortOrder: parsed.data.sortOrder,
    },
  });

  revalidatePath("/admin/pengaturan-perizinan");
  revalidatePath("/admin/indeks-izin");
  revalidatePath("/request-izin");

  return {
    status: "success",
    message: "Jenis izin berhasil diperbarui.",
  };
}

export async function updateMentorSelectionAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("ADMIN");

  const mentorIds = Array.from(
    new Set(
      formData
        .getAll("mentorIds")
        .filter((value): value is string => typeof value === "string"),
    ),
  );

  const parsed = mentorSelectionSchema.safeParse({ mentorIds });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Pilihan tidak valid.",
    };
  }

  if (parsed.data.mentorIds.length > 0) {
    const validMentors = await prisma.user.count({
      where: {
        id: { in: parsed.data.mentorIds },
        role: "PEMBINA",
        isActive: true,
      },
    });

    if (validMentors !== parsed.data.mentorIds.length) {
      return {
        status: "error",
        message:
          "Beberapa akun Pembina tidak ditemukan atau sudah tidak aktif. Muat ulang halaman.",
      };
    }
  }

  const activeMentors = await prisma.user.findMany({
    where: {
      role: "PEMBINA",
      isActive: true,
    },
    select: { id: true },
  });

  const activeMentorIds = activeMentors.map((mentor) => mentor.id);

  await prisma.$transaction(async (tx) => {
    await tx.staffProfile.updateMany({
      where: {
        userId: { in: activeMentorIds },
      },
      data: { canBeMentor: false },
    });

    await tx.staffProfile.updateMany({
      where: {
        userId: { in: parsed.data.mentorIds },
      },
      data: { canBeMentor: true },
    });
  });

  revalidatePath("/admin/pengaturan-perizinan");
  revalidatePath("/admin/kelola-akun");
  revalidatePath("/request-izin");

  return {
    status: "success",
    message: `Daftar Pembina/Pendamping yang dapat dipilih berhasil diperbarui (${parsed.data.mentorIds.length} akun).`,
  };
}
