import { z } from "zod";

import {
  APPROVAL_ROLES,
  fieldLabel,
  hasField,
  PERMISSION_FIELDS,
  type PermissionTypeConfig,
} from "@/lib/permissions/config";

export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);

    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, "Tanggal tidak valid.");

export const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Gunakan format jam HH:MM.");

export const approvalRolesSchema = z
  .array(z.enum(APPROVAL_ROLES))
  .min(1, "Pilih minimal satu tahap persetujuan.")
  .max(3, "Maksimal tiga tahap persetujuan.")
  .refine((roles) => new Set(roles).size === roles.length, {
    message: "Peran persetujuan tidak boleh berulang.",
  });

export const requiredFieldsSchema = z
  .array(z.enum(PERMISSION_FIELDS))
  .min(1, "Pilih minimal satu field wajib.");

/**
 * The base form is permissive; required fields are decided by the selected
 * permission type so every form follows its configured PDF template.
 */
export function createPermissionSchema(config: PermissionTypeConfig) {
  return z
    .object({
      typeId: z.string().min(1, "Pilih jenis izin."),
      dateMode: z.enum(["single", "range"]),
      purpose: z.string().trim().max(200, "Keterangan maksimal 200 karakter."),
      place: z.string().trim().max(150, "Tempat maksimal 150 karakter."),
      startDate: dateOnlySchema,
      endDate: dateOnlySchema,
      startTime: z.string(),
      endTime: z.string(),
      mentorId: z.string().min(1, "Pilih Pembina/Pendamping."),
      studentIds: z
        .array(z.string().min(1))
        .min(1, "Pilih minimal satu siswa.")
        .max(100, "Maksimal 100 siswa dalam satu pengajuan."),
      visitorName: z
        .string()
        .trim()
        .max(120, "Nama pengunjung maksimal 120 karakter."),
      phoneUse: z
        .string()
        .trim()
        .max(500, "Keterangan penggunaan HP maksimal 500 karakter."),
      additionalNotes: z
        .string()
        .trim()
        .max(1000, "Catatan maksimal 1000 karakter."),
    })
    .superRefine((data, ctx) => {
      if (hasField(config, "purpose") && data.purpose.length < 5) {
        ctx.addIssue({
          code: "custom",
          message: `${fieldLabel(config, "purpose")} minimal 5 karakter.`,
          path: ["purpose"],
        });
      }

      if (hasField(config, "place") && data.place.length < 3) {
        ctx.addIssue({
          code: "custom",
          message: "Tempat minimal 3 karakter.",
          path: ["place"],
        });
      }

      if (hasField(config, "visitorName") && data.visitorName.length < 3) {
        ctx.addIssue({
          code: "custom",
          message: `${fieldLabel(config, "visitorName")} minimal 3 karakter.`,
          path: ["visitorName"],
        });
      }

      if (hasField(config, "phoneUse") && data.phoneUse.length < 5) {
        ctx.addIssue({
          code: "custom",
          message: `${fieldLabel(config, "phoneUse")} minimal 5 karakter.`,
          path: ["phoneUse"],
        });
      }

      if (hasField(config, "additionalNotes") && data.additionalNotes.length < 5) {
        ctx.addIssue({
          code: "custom",
          message: `${fieldLabel(config, "additionalNotes")} minimal 5 karakter.`,
          path: ["additionalNotes"],
        });
      }

      if (hasField(config, "endDate") && data.endDate < data.startDate) {
        ctx.addIssue({
          code: "custom",
          message: `${fieldLabel(config, "endDate")} tidak boleh sebelum ${fieldLabel(config, "startDate")}.`,
          path: ["endDate"],
        });
      }

      if (hasField(config, "time")) {
        const start = timeOfDaySchema.safeParse(data.startTime);
        const end = timeOfDaySchema.safeParse(data.endTime);

        if (!start.success) {
          ctx.addIssue({
            code: "custom",
            message: "Jam mulai menggunakan format HH:MM.",
            path: ["startTime"],
          });
        }

        if (!end.success) {
          ctx.addIssue({
            code: "custom",
            message: "Jam selesai menggunakan format HH:MM.",
            path: ["endTime"],
          });
        }

        if (
          start.success &&
          end.success &&
          data.startDate === data.endDate &&
          end.data <= start.data
        ) {
          ctx.addIssue({
            code: "custom",
            message: "Jam selesai harus setelah jam mulai.",
            path: ["endTime"],
          });
        }
      }
    });
}

export const decidePermissionSchema = z
  .object({
    requestId: z.string().min(1),
    decision: z.enum(["APPROVE", "REJECT"]),
    note: z
      .string()
      .trim()
      .max(500, "Catatan maksimal 500 karakter."),
  })
  .superRefine((data, ctx) => {
    if (data.decision === "REJECT" && data.note.length < 3) {
      ctx.addIssue({
        code: "custom",
        message: "Alasan penolakan wajib diisi minimal 3 karakter.",
        path: ["note"],
      });
    }
  });

export const cancelPermissionSchema = z.object({
  requestId: z.string().min(1),
});
