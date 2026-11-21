"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import type { ActionState } from "@/lib/form-state";
import {
  APPROVAL_ROLES,
  DEFAULT_APPROVAL_ROLES,
  DEFAULT_REQUIRED_FIELDS,
  PERMISSION_FIELDS,
  serializeConfig,
  type PermissionTypeConfig,
} from "@/lib/permissions/config";
import {
  permissionSettingsSchema,
  permissionTypeSchema,
} from "@/lib/validations/account";
import {
  approvalRolesSchema,
  requiredFieldsSchema,
} from "@/lib/validations/permission";

function getFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

type ConfigParseResult =
  | { ok: true; config: PermissionTypeConfig }
  | { ok: false; state: ActionState };

function parseTypeConfig(formData: FormData): ConfigParseResult {
  const roles = [getFormValue(formData, "approvalRole").trim()].filter(Boolean);
  const fields = formData
    .getAll("requiredFields")
    .filter((value): value is string => typeof value === "string" && Boolean(value.trim()));

  const rolesResult = approvalRolesSchema.safeParse(
    roles.length > 0 ? roles : DEFAULT_APPROVAL_ROLES,
  );
  const fieldsResult = requiredFieldsSchema.safeParse(
    fields.length > 0 ? fields : DEFAULT_REQUIRED_FIELDS,
  );

  if (!rolesResult.success || !fieldsResult.success) {
    return {
      ok: false,
      state: {
        status: "error",
        message: "Periksa kembali konfigurasi formulir dan persetujuan.",
        fieldErrors: {
          ...(rolesResult.success
            ? {}
            : {
                approvalRoles:
                  z.flattenError(rolesResult.error).formErrors ?? [],
              }),
          ...(fieldsResult.success
            ? {}
            : {
                requiredFields:
                  z.flattenError(fieldsResult.error).formErrors ?? [],
              }),
        },
      },
    };
  }

  const fieldLabels: Partial<Record<(typeof PERMISSION_FIELDS)[number], string>> = {};

  for (const field of PERMISSION_FIELDS) {
    const label = getFormValue(formData, `fieldLabel_${field}`).trim();

    if (label) {
      fieldLabels[field] = label;
    }
  }

  const approvalLabels: Partial<Record<(typeof APPROVAL_ROLES)[number], string>> = {};

  for (const role of APPROVAL_ROLES) {
    const label = getFormValue(formData, `approvalLabel_${role}`).trim();

    if (label) {
      approvalLabels[role] = label;
    }
  }

  return {
    ok: true,
    config: {
      approvalRoles: rolesResult.data,
      requiredFields: fieldsResult.data,
      fieldLabels,
      approvalLabels,
      formGuide: getFormValue(formData, "formGuide").trim() || null,
    },
  };
}

function revalidatePermissionPages() {
  revalidatePath("/admin/pengaturan-perizinan");
  revalidatePath("/admin/indeks-izin");
  revalidatePath("/request-izin");
  revalidatePath("/dashboard");
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

  revalidatePermissionPages();

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
  const configResult = parseTypeConfig(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data jenis izin.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  if (!configResult.ok) {
    return configResult.state;
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
      ...serializeConfig(configResult.config),
    },
  });

  revalidatePermissionPages();

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
  const configResult = parseTypeConfig(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data jenis izin.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  if (!configResult.ok) {
    return configResult.state;
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
      ...serializeConfig(configResult.config),
    },
  });

  revalidatePermissionPages();

  return {
    status: "success",
    message: "Jenis izin berhasil diperbarui.",
  };
}
