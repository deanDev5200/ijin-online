import { z } from "zod";

import {
  APPROVAL_ROLES,
  fieldLabel,
  hasField,
  PERMISSION_FIELDS,
  type PermissionTypeConfig,
} from "@/lib/permissions/config";
import { compactDepositItems } from "@/lib/permissions/deposit-items";

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
  .max(4, "Maksimal empat tahap persetujuan.")
  .refine((roles) => new Set(roles).size === roles.length, {
    message: "Peran persetujuan tidak boleh berulang.",
  })
  .refine((roles) => !roles.includes("WAKASEK_KESISWAAN") || roles.at(-1) === "WAKASEK_KESISWAAN", {
    message: "Wakasek Kesiswaan harus menjadi tahap persetujuan terakhir.",
  });

export const requiredFieldsSchema = z
  .array(z.enum(PERMISSION_FIELDS))
  .min(1, "Pilih minimal satu field wajib.");

export const depositItemSchema = z.object({
  name: z.string().trim().max(120, "Nama barang maksimal 120 karakter."),
  quantity: z.string().trim().max(30, "Jumlah maksimal 30 karakter."),
  unit: z.string().trim().max(30, "Satuan maksimal 30 karakter."),
  note: z.string().trim().max(200, "Keterangan maksimal 200 karakter."),
});

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
      departureTime: z.string(),
      returnTime: z.string(),
      mentorId: z.string(),
      depositItems: z.array(depositItemSchema).max(10, "Maksimal 10 barang."),
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
      if (config.approvalRoles.includes("PEMBINA") && !data.mentorId) {
        ctx.addIssue({
          code: "custom",
          message: "Pilih Pembina/Pendamping.",
          path: ["mentorId"],
        });
      }

      if (hasField(config, "depositItems")) {
        const filledItems = compactDepositItems(data.depositItems);

        if (filledItems.length === 0) {
          ctx.addIssue({
            code: "custom",
            message: "Isi minimal satu barang titipan.",
            path: ["depositItems"],
          });
        }

        data.depositItems.forEach((item, index) => {
          if (!item.name && !item.quantity && !item.unit && !item.note) {
            return;
          }

          if (item.name.length < 2) {
            ctx.addIssue({
              code: "custom",
              message: "Nama barang minimal 2 karakter.",
              path: [`depositItems.${index}.name`],
            });
          }

          if (!item.quantity) {
            ctx.addIssue({
              code: "custom",
              message: "Jumlah barang wajib diisi.",
              path: [`depositItems.${index}.quantity`],
            });
          }
        });
      }

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

      if (hasField(config, "departureTime")) {
        const parsed = timeOfDaySchema.safeParse(data.departureTime);

        if (!parsed.success) {
          ctx.addIssue({
            code: "custom",
            message: `${fieldLabel(config, "departureTime")} menggunakan format HH:MM.`,
            path: ["departureTime"],
          });
        }
      }

      if (hasField(config, "returnTime")) {
        const parsed = timeOfDaySchema.safeParse(data.returnTime);

        if (!parsed.success) {
          ctx.addIssue({
            code: "custom",
            message: `${fieldLabel(config, "returnTime")} menggunakan format HH:MM.`,
            path: ["returnTime"],
          });
        }
      }

      if (
        hasField(config, "departureTime") &&
        hasField(config, "returnTime") &&
        data.startDate === data.endDate &&
        data.returnTime &&
        data.departureTime &&
        data.returnTime <= data.departureTime
      ) {
        ctx.addIssue({
          code: "custom",
          message: `${fieldLabel(config, "returnTime")} harus setelah ${fieldLabel(config, "departureTime")}.`,
          path: ["returnTime"],
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
