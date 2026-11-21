"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth/guards";
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
  approvalLabel,
  getPermissionTypeConfig,
  hasField,
  pendingStatusForRole,
  requiresSingleStudent,
} from "@/lib/permissions/config";
import {
  readDepositItemsFormData,
  serializeDepositItems,
} from "@/lib/permissions/deposit-items";
import {
  type PermissionRequestFormState,
  type PermissionRequestFormValues,
} from "@/lib/permissions/form-state";
import {
  createRequestNotifications,
  getActiveUserIdsByRole,
} from "@/lib/permissions/notifications";
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

  const typeId = getFormValue(formData, "typeId");

  const type = await prisma.permissionType.findFirst({
    where: {
      id: typeId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      approvalRoles: true,
      requiredFields: true,
      fieldLabels: true,
      approvalLabels: true,
      formGuide: true,
    },
  });

  if (!type) {
    return {
      status: "error",
      message: "Jenis izin yang dipilih tidak tersedia.",
      fieldErrors: {
        typeId: ["Pilih jenis izin yang aktif."],
      },
    };
  }

  const config = getPermissionTypeConfig(type);
  const studentIds = requiresSingleStudent(config)
    ? [user.id]
    : Array.from(new Set([user.id, ...rawStudentIds]));
  const depositItems = readDepositItemsFormData(formData);
  const today = getTodayInJakarta();
  const needsRange = hasField(config, "endDate");
  const startDateValue =
    getFormValue(formData, "startDate") || (hasField(config, "startDate") ? "" : today);
  const endDateValue = needsRange
    ? getFormValue(formData, "endDate") || startDateValue
    : startDateValue;

  const values: PermissionRequestFormValues = {
    typeId: type.id,
    purpose: hasField(config, "purpose")
      ? getFormValue(formData, "purpose")
      : `Pengajuan ${type.name}`,
    place: hasField(config, "place") ? getFormValue(formData, "place") : "",
    dateMode: needsRange ? "range" : "single",
    startDate: startDateValue,
    endDate: endDateValue,
    startTime: hasField(config, "time") ? getFormValue(formData, "startTime") : "",
    endTime: hasField(config, "time") ? getFormValue(formData, "endTime") : "",
    departureTime: hasField(config, "departureTime")
      ? getFormValue(formData, "departureTime")
      : "",
    returnTime: hasField(config, "returnTime")
      ? getFormValue(formData, "returnTime")
      : "",
    studentIds,
    depositItems,
    visitorName: hasField(config, "visitorName")
      ? getFormValue(formData, "visitorName")
      : "",
    phoneUse: hasField(config, "phoneUse")
      ? getFormValue(formData, "phoneUse")
      : "",
    additionalNotes: hasField(config, "additionalNotes")
      ? getFormValue(formData, "additionalNotes")
      : "",
  };

  const parsed = createPermissionSchema(config).safeParse(values);

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
  const endDate = needsRange ? toDateOnly(data.endDate) : startDate;
  const dateLabel = formatDateRange(startDate, endDate);
  // Izin Pulang stores its departure/arrival clocks in the shared time columns.
  const storedStartTime = hasField(config, "departureTime")
    ? data.departureTime
    : data.startTime;
  const storedEndTime = hasField(config, "returnTime")
    ? data.returnTime
    : data.endTime;
  const primaryRole = config.approvalRoles[0];
  const initialStatus = primaryRole
    ? pendingStatusForRole(primaryRole) ?? "PENDING_MENTOR"
    : "PENDING_MENTOR";

  const request = await prisma.$transaction(async (tx) => {
    const created = await tx.permissionRequest.create({
      data: {
        typeId: type.id,
        requesterId: user.id,
        mentorId: null,
        purpose: data.purpose,
        place: data.place,
        startDate,
        endDate,
        startTime: storedStartTime,
        endTime: storedEndTime,
        visitorName: data.visitorName || null,
        phoneUse: data.phoneUse || null,
        additionalNotes: data.additionalNotes || null,
        depositItems: hasField(config, "depositItems")
          ? serializeDepositItems(data.depositItems)
          : null,
        status: initialStatus,
        students: {
          create: data.studentIds.map((studentId) => ({
            studentId,
            isRequester: studentId === user.id,
          })),
        },
        approvals: {
          create: config.approvalRoles.map((role, index) => ({
            step: index + 1,
            role,
            label: approvalLabel(config, role),
            approverId: null,
            status: "PENDING",
          })),
        },
      },
      select: {
        id: true,
      },
    });

    const approverLabel =
      config.approvalRoles
        .map((role) => approvalLabel(config, role))
        .join(", ") || "penyetuju";
    const approverRoleLists = await Promise.all(
      config.approvalRoles.map((role) => getActiveUserIdsByRole(tx, role)),
    );
    const approverIds = [...new Set(approverRoleLists.flat())];

    await createRequestNotifications(tx, [
      ...approverIds
        .filter((userId) => userId !== user.id)
        .map((userId) => ({
          userId,
          title: "Permintaan izin baru",
          message: `${user.fullName} mengajukan ${type.name.toLowerCase()} untuk "${data.purpose}" pada ${dateLabel}. Mohon tinjau pengajuan ini.`,
          requestId: created.id,
        })),
      {
        userId: user.id,
        title: "Pengajuan izin terkirim",
        message: `Pengajuan "${data.purpose}" berhasil dikirim dan menunggu keputusan dari ${approverLabel}.`,
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
