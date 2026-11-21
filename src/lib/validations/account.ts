import { z } from "zod";

import { timeOfDaySchema } from "./permission";

export const ACCOUNT_ROLES = [
  "SISWA",
  "PEMBINA",
  "STAFF_ASRAMA",
  "STAFF_ASRAMA_TAMBAHAN",
  "KEPALA_ASRAMA",
  "WAKASEK_KESISWAAN",
  "ADMIN",
] as const;

export const MANAGEABLE_ROLES = [
  "SISWA",
  "PEMBINA",
  "STAFF_ASRAMA",
  "STAFF_ASRAMA_TAMBAHAN",
  "KEPALA_ASRAMA",
  "WAKASEK_KESISWAAN",
] as const;

export type ManageableRole = (typeof MANAGEABLE_ROLES)[number];

export const manageableRoleSchema = z.enum(MANAGEABLE_ROLES);

export const fullNameSchema = z
  .string()
  .trim()
  .min(3, "Nama lengkap minimal 3 karakter.")
  .max(100, "Nama lengkap maksimal 100 karakter.");

export const nisSchema = z
  .string()
  .trim()
  .min(3, "NIS minimal 3 karakter.")
  .max(30, "NIS maksimal 30 karakter.")
  .regex(
    /^[A-Za-z0-9._-]+$/,
    "NIS hanya boleh berisi huruf, angka, titik, garis bawah, dan tanda hubung.",
  );

export const nipSchema = z
  .string()
  .trim()
  .min(5, "NIP minimal 5 karakter.")
  .max(30, "NIP maksimal 30 karakter.")
  .regex(
    /^[A-Za-z0-9._-]+$/,
    "NIP hanya boleh berisi huruf, angka, titik, garis bawah, dan tanda hubung.",
  );

export const grhaSchema = z
  .string()
  .trim()
  .min(2, "Grha minimal 2 karakter.")
  .max(50, "Grha maksimal 50 karakter.");

export const kelasSchema = z
  .string()
  .trim()
  .min(1, "Kelas wajib diisi.")
  .max(50, "Kelas maksimal 50 karakter.");

function requiredProfileFields(
  data: {
    role: ManageableRole;
    nis: string;
    grha: string;
    kelas: string;
    nip: string;
  },
  ctx: z.RefinementCtx,
) {
  if (data.role === "SISWA") {
    if (!data.nis) {
      ctx.addIssue({
        code: "custom",
        message: "NIS wajib diisi untuk akun siswa.",
        path: ["nis"],
      });
    }

    if (!data.grha) {
      ctx.addIssue({
        code: "custom",
        message: "Grha wajib diisi untuk akun siswa.",
        path: ["grha"],
      });
    }

    if (!data.kelas) {
      ctx.addIssue({
        code: "custom",
        message: "Kelas wajib diisi untuk akun siswa.",
        path: ["kelas"],
      });
    }

    return;
  }

  if (!data.nip) {
    ctx.addIssue({
      code: "custom",
      message: "NIP wajib diisi untuk akun tenaga kependidikan.",
      path: ["nip"],
    });
  }
}

export const createAccountSchema = z
  .object({
    role: manageableRoleSchema,
    fullName: fullNameSchema,
    nis: z.string().trim().optional().default(""),
    grha: z.string().trim().optional().default(""),
    kelas: z.string().trim().optional().default(""),
    nip: z.string().trim().optional().default(""),
  })
  .superRefine((data, ctx) => {
    requiredProfileFields(
      {
        role: data.role,
        nis: data.nis,
        grha: data.grha,
        kelas: data.kelas,
        nip: data.nip,
      },
      ctx,
    );
  });

export const updateAccountSchema = z.object({
  accountId: z.string().min(1),
  fullName: fullNameSchema,
  nis: z.string().trim().optional().default(""),
  grha: z.string().trim().optional().default(""),
  kelas: z.string().trim().optional().default(""),
  nip: z.string().trim().optional().default(""),
});

export const accountStatusSchema = z.object({
  accountId: z.string().min(1),
  isActive: z.enum(["true", "false"]),
});

export const importStudentRowSchema = z.object({
  fullName: fullNameSchema,
  nis: nisSchema,
  grha: grhaSchema,
  kelas: kelasSchema,
});

export const permissionTypeSchema = z.object({
  typeId: z.string().optional(),
  name: z
    .string()
    .trim()
    .min(3, "Nama jenis izin minimal 3 karakter.")
    .max(80, "Nama jenis izin maksimal 80 karakter."),
  description: z
    .string()
    .trim()
    .max(300, "Deskripsi maksimal 300 karakter.")
    .optional()
    .default(""),
  isActive: z.enum(["true", "false"]).optional().default("true"),
  sortOrder: z.coerce
    .number()
    .int("Urutan harus berupa angka bulat.")
    .min(0, "Urutan minimal 0.")
    .max(999, "Urutan maksimal 999."),
});

export const permissionSettingsSchema = z
  .object({
    minLeadDays: z.coerce
      .number()
      .int("Batas hari harus berupa angka bulat.")
      .min(0, "Minimal 0 hari.")
      .max(30, "Maksimal 30 hari."),
    maxRangeDays: z.coerce
      .number()
      .int("Durasi harus berupa angka bulat.")
      .min(1, "Durasi minimal 1 hari.")
      .max(90, "Durasi maksimal 90 hari."),
    maxStudentsPerRequest: z.coerce
      .number()
      .int("Jumlah siswa harus berupa angka bulat.")
      .min(1, "Minimal 1 siswa.")
      .max(100, "Maksimal 100 siswa."),
    approvalDeadlineDays: z.coerce
      .number()
      .int("Batas waktu harus berupa angka bulat.")
      .min(1, "Batas waktu minimal 1 hari.")
      .max(30, "Batas waktu maksimal 30 hari."),
    defaultStartTime: timeOfDaySchema,
    defaultEndTime: timeOfDaySchema,
  })
  .refine((data) => data.defaultEndTime > data.defaultStartTime, {
    message: "Jam selesai harus setelah jam mulai.",
    path: ["defaultEndTime"],
  });

export const permissionIndexFilterSchema = z.object({
  q: z.string().trim().max(100).optional().default(""),
  status: z
    .enum([
      "ALL",
      "PENDING_MENTOR",
      "PENDING_DORM_STAFF",
      "PENDING_DORM_HEAD",
      "APPROVED",
      "REJECTED",
      "CANCELLED",
    ])
    .optional()
    .default("ALL"),
  typeId: z.string().optional().default("ALL"),
  from: z.string().optional().default(""),
  to: z.string().optional().default(""),
});
