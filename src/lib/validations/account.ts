import { z } from "zod";

import { passwordSchema, usernameSchema } from "./auth";
import { timeOfDaySchema } from "./permission";

export const ACCOUNT_ROLES = [
  "SISWA",
  "PEMBINA",
  "STAFF_ASRAMA",
  "KEPALA_ASRAMA",
  "ADMIN",
] as const;

export const MANAGEABLE_ROLES = [
  "SISWA",
  "PEMBINA",
  "STAFF_ASRAMA",
  "KEPALA_ASRAMA",
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

export const GRHA_OPTIONS = [
  "Airsanya",
  "Daksina",
  "Genya",
  "Madhya",
  "Nairiti",
  "Pascima",
  "Purwa",
  "Uttara",
  "Wayabhya",
] as const;

export type GrhaOption = (typeof GRHA_OPTIONS)[number];

const GRHA_LOOKUP = new Map<string, GrhaOption>(
  GRHA_OPTIONS.map((grha) => [grha.toLowerCase(), grha]),
);

export const grhaSchema = z
  .string()
  .trim()
  .min(1, "Grha wajib dipilih.")
  .transform((value, ctx) => {
    const matched = GRHA_LOOKUP.get(value.toLowerCase());

    if (!matched) {
      ctx.addIssue({
        code: "custom",
        message: `Grha harus salah satu dari: ${GRHA_OPTIONS.join(", ")}.`,
      });
      return z.NEVER;
    }

    return matched;
  });

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
    } else {
      const nis = nisSchema.safeParse(data.nis);
      if (!nis.success) {
        for (const issue of nis.error.issues) {
          ctx.addIssue({
            code: "custom",
            message: issue.message,
            path: ["nis"],
          });
        }
      }
    }

    if (!data.grha) {
      ctx.addIssue({
        code: "custom",
        message: "Grha wajib dipilih untuk akun siswa.",
        path: ["grha"],
      });
    } else {
      const grha = grhaSchema.safeParse(data.grha);
      if (!grha.success) {
        for (const issue of grha.error.issues) {
          ctx.addIssue({
            code: "custom",
            message: issue.message,
            path: ["grha"],
          });
        }
      }
    }

    if (!data.kelas) {
      ctx.addIssue({
        code: "custom",
        message: "Kelas wajib diisi untuk akun siswa.",
        path: ["kelas"],
      });
    } else {
      const kelas = kelasSchema.safeParse(data.kelas);
      if (!kelas.success) {
        for (const issue of kelas.error.issues) {
          ctx.addIssue({
            code: "custom",
            message: issue.message,
            path: ["kelas"],
          });
        }
      }
    }

    return;
  }

  if (!data.nip) {
    ctx.addIssue({
      code: "custom",
      message: "NIP wajib diisi untuk akun tenaga kependidikan.",
      path: ["nip"],
    });
  } else {
    const nip = nipSchema.safeParse(data.nip);
    if (!nip.success) {
      for (const issue of nip.error.issues) {
        ctx.addIssue({
          code: "custom",
          message: issue.message,
          path: ["nip"],
        });
      }
    }
  }
}

export const createAccountSchema = z
  .object({
    role: manageableRoleSchema,
    fullName: fullNameSchema,
    username: usernameSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
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

    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Konfirmasi password tidak cocok.",
        path: ["confirmPassword"],
      });
    }
  })
  .transform((data) => ({
    ...data,
    grha:
      data.role === "SISWA"
        ? (GRHA_LOOKUP.get(data.grha.toLowerCase()) ?? data.grha)
        : data.grha,
  }));

export const updateAccountSchema = z.object({
  accountId: z.string().min(1),
  fullName: fullNameSchema,
  username: usernameSchema,
  nis: z.string().trim().optional().default(""),
  grha: z.string().trim().optional().default(""),
  kelas: z.string().trim().optional().default(""),
  nip: z.string().trim().optional().default(""),
});

export const resetAccountPasswordSchema = z
  .object({
    accountId: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok.",
    path: ["confirmPassword"],
  });

export const accountStatusSchema = z.object({
  accountId: z.string().min(1),
  isActive: z.enum(["true", "false"]),
});

export const importStudentRowSchema = z.object({
  fullName: fullNameSchema,
  username: usernameSchema,
  nis: nisSchema,
  grha: grhaSchema,
  kelas: kelasSchema,
  password: passwordSchema,
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
