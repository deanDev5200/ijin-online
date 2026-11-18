"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth/guards";
import { STAFF_ROLES } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import {
  addDaysToDateOnly,
  countDaysInclusive,
  formatDateRange,
  formatDateOnly,
  getTodayInJakarta,
  toDateOnly,
} from "@/lib/permissions/dates";
import {
  type PermissionRequestFormState,
  type PermissionRequestFormValues,
} from "@/lib/permissions/form-state";
import { createRequestNotifications } from "@/lib/permissions/notifications";
import { getPermissionSettings } from "@/lib/permissions/settings";
import { createPermissionSchema } from "@/lib/validations/permission";

function getFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export async function createPermissionRequestAction(
  _previousState: PermissionRequestFormState,
  formData: FormData,
): Promise<PermissionRequestFormState> {
  const user = await requireRole("SISWA");

  const rawStudentIds = formData
    .getAll("studentIds")
    .filter((value): value is string => typeof value === "string");

  const studentIds = Array.from(new Set([user.id, ...rawStudentIds]));
  const dateModeValue = getFormValue(formData, "dateMode");
  const dateMode = dateModeValue === "range" ? "range" : "single";
  const startDateValue = getFormValue(formData, "startDate");
  const endDateValue =
    dateMode === "range" ? getFormValue(formData, "endDate") : startDateValue;

  const values: PermissionRequestFormValues = {
    typeId: getFormValue(formData, "typeId"),
    purpose: getFormValue(formData, "purpose"),
    place: getFormValue(formData, "place"),
    dateMode,
    startDate: startDateValue,
    endDate: endDateValue,
    startTime: getFormValue(formData, "startTime"),
    endTime: getFormValue(formData, "endTime"),
    mentorId: getFormValue(formData, "mentorId"),
    studentIds,
  };

  const parsed = createPermissionSchema.safeParse(values);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data yang Anda masukkan.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  const data = parsed.data;
  const settings = await getPermissionSettings();
  const today = getTodayInJakarta();
  const earliestStart = addDaysToDateOnly(today, settings.minLeadDays);

  if (data.startDate < earliestStart) {
    return {
      status: "error",
      message: "Tanggal izin belum memenuhi ketentuan pengajuan.",
      fieldErrors: {
        startDate: [
          settings.minLeadDays === 0
            ? "Tanggal izin tidak boleh sebelum hari ini."
            : `Izin harus diajukan minimal ${settings.minLeadDays} hari sebelum tanggal mulai (paling cepat ${formatDateOnly(toDateOnly(earliestStart))}).`,
        ],
      },
      values,
    };
  }

  if (countDaysInclusive(data.startDate, data.endDate) > settings.maxRangeDays) {
    return {
      status: "error",
      message: "Durasi izin melebihi batas yang ditetapkan.",
      fieldErrors: {
        endDate: [
          `Durasi izin maksimal ${settings.maxRangeDays} hari kalender.`,
        ],
      },
      values,
    };
  }

  if (data.studentIds.length > settings.maxStudentsPerRequest) {
    return {
      status: "error",
      message: "Jumlah siswa melebihi batas yang ditetapkan.",
      fieldErrors: {
        studentIds: [
          `Maksimal ${settings.maxStudentsPerRequest} siswa dalam satu pengajuan.`,
        ],
      },
      values,
    };
  }

  const type = await prisma.permissionType.findFirst({
    where: {
      id: data.typeId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!type) {
    return {
      status: "error",
      message: "Jenis izin yang dipilih tidak tersedia.",
      fieldErrors: {
        typeId: ["Pilih jenis izin yang aktif."],
      },
      values,
    };
  }

  const mentor = await prisma.user.findFirst({
    where: {
      id: data.mentorId,
      role: { in: [...STAFF_ROLES] },
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
    },
  });

  if (!mentor) {
    return {
      status: "error",
      message: "Pembina/Pendamping yang dipilih tidak tersedia.",
      fieldErrors: {
        mentorId: ["Pilih Pembina/Pendamping yang aktif."],
      },
      values,
    };
  }

  const students = await prisma.user.findMany({
    where: {
      id: { in: data.studentIds },
      role: "SISWA",
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
    },
  });

  if (students.length !== data.studentIds.length) {
    return {
      status: "error",
      message: "Beberapa siswa yang dipilih tidak valid atau tidak aktif.",
      fieldErrors: {
        studentIds: ["Periksa kembali siswa yang dipilih."],
      },
      values,
    };
  }

  const startDate = toDateOnly(data.startDate);
  const endDate =
    data.dateMode === "range" ? toDateOnly(data.endDate) : startDate;
  const dateLabel = formatDateRange(startDate, endDate);

  const request = await prisma.$transaction(async (tx) => {
    const created = await tx.permissionRequest.create({
      data: {
        typeId: type.id,
        requesterId: user.id,
        mentorId: mentor.id,
        purpose: data.purpose,
        place: data.place,
        startDate,
        endDate,
        startTime: data.startTime,
        endTime: data.endTime,
        status: "PENDING_MENTOR",
        students: {
          create: data.studentIds.map((studentId) => ({
            studentId,
            isRequester: studentId === user.id,
          })),
        },
        approvals: {
          create: [
            {
              step: 1,
              role: "PEMBINA",
              approverId: mentor.id,
              status: "PENDING",
            },
            {
              step: 2,
              role: "STAFF_ASRAMA",
              status: "PENDING",
            },
            {
              step: 3,
              role: "KEPALA_ASRAMA",
              status: "PENDING",
            },
          ],
        },
      },
      select: {
        id: true,
      },
    });

    await createRequestNotifications(tx, [
      {
        userId: mentor.id,
        title: "Permintaan izin baru",
        message: `${user.fullName} mengajukan ${type.name.toLowerCase()} untuk "${data.purpose}" pada ${dateLabel}. Mohon tinjau pengajuan ini.`,
        requestId: created.id,
      },
      {
        userId: user.id,
        title: "Pengajuan izin terkirim",
        message: `Pengajuan "${data.purpose}" berhasil dikirim dan menunggu persetujuan ${mentor.fullName}.`,
        requestId: created.id,
      },
      ...students
        .filter((student) => student.id !== user.id)
        .map((student) => ({
          userId: student.id,
          title: "Anda tercantum dalam pengajuan izin",
          message: `${user.fullName} mencantumkan Anda dalam pengajuan "${data.purpose}" pada ${dateLabel}.`,
          requestId: created.id,
        })),
    ]);

    return created;
  });

  revalidatePath("/riwayat-request");
  revalidatePath("/dashboard");
  revalidatePath("/notifikasi");
  revalidatePath("/", "layout");

  redirect(`/riwayat-request/${request.id}?created=1`);
}
