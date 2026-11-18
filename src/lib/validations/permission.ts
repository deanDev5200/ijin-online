import { z } from "zod";

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

export const createPermissionSchema = z
  .object({
    typeId: z.string().min(1, "Pilih jenis izin."),
    dateMode: z.enum(["single", "range"]),
    purpose: z
      .string()
      .trim()
      .min(5, "Tujuan kegiatan minimal 5 karakter.")
      .max(200, "Tujuan kegiatan maksimal 200 karakter."),
    place: z
      .string()
      .trim()
      .min(3, "Tempat kegiatan minimal 3 karakter.")
      .max(150, "Tempat kegiatan maksimal 150 karakter."),
    startDate: dateOnlySchema,
    endDate: dateOnlySchema,
    startTime: timeOfDaySchema,
    endTime: timeOfDaySchema,
    mentorId: z.string().min(1, "Pilih Pembina/Pendamping."),
    studentIds: z
      .array(z.string().min(1))
      .min(1, "Pilih minimal satu siswa.")
      .max(100, "Maksimal 100 siswa dalam satu pengajuan."),
  })
  .superRefine((data, ctx) => {
    if (data.dateMode === "range" && data.endDate < data.startDate) {
      ctx.addIssue({
        code: "custom",
        message: "Tanggal selesai tidak boleh sebelum tanggal mulai.",
        path: ["endDate"],
      });
    }

    if (data.startDate === data.endDate && data.endTime <= data.startTime) {
      ctx.addIssue({
        code: "custom",
        message: "Jam selesai harus setelah jam mulai untuk izin satu hari.",
        path: ["endTime"],
      });
    }
  });

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
