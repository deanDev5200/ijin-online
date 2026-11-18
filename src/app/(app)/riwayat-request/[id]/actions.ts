"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import type { ActionState } from "@/lib/form-state";
import { PermissionWorkflowError } from "@/lib/permissions/errors";
import {
  createRequestNotifications,
  getActiveUserIdsByRole,
} from "@/lib/permissions/notifications";
import { getStageByStatus, isPendingStatus } from "@/lib/permissions/status";
import { cancelPermissionSchema } from "@/lib/validations/permission";

export async function cancelPermissionRequestAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("SISWA");
  const rawRequestId = formData.get("requestId");

  const parsed = cancelPermissionSchema.safeParse({
    requestId: typeof rawRequestId === "string" ? rawRequestId : "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Pengajuan tidak valid.",
    };
  }

  const requestId = parsed.data.requestId;

  try {
    await prisma.$transaction(async (tx) => {
      const request = await tx.permissionRequest.findUnique({
        where: { id: requestId },
        select: {
          id: true,
          requesterId: true,
          mentorId: true,
          purpose: true,
          status: true,
          students: {
            select: {
              studentId: true,
            },
          },
        },
      });

      if (!request || request.requesterId !== user.id) {
        throw new PermissionWorkflowError("Pengajuan tidak ditemukan.");
      }

      if (!isPendingStatus(request.status)) {
        throw new PermissionWorkflowError(
          "Pengajuan ini sudah diproses dan tidak dapat dibatalkan.",
        );
      }

      const claimed = await tx.permissionRequest.updateMany({
        where: {
          id: request.id,
          requesterId: user.id,
          status: request.status,
        },
        data: {
          status: "CANCELLED",
        },
      });

      if (claimed.count === 0) {
        throw new PermissionWorkflowError(
          "Pengajuan ini baru saja diproses. Muat ulang halaman.",
        );
      }

      await tx.approval.updateMany({
        where: {
          requestId: request.id,
          status: "PENDING",
        },
        data: {
          status: "CANCELLED",
        },
      });

      const stage = getStageByStatus(request.status);
      const stageUserIds =
        stage && stage.step > 1
          ? await getActiveUserIdsByRole(tx, stage.role)
          : [];
      const message = `${user.fullName} membatalkan pengajuan "${request.purpose}".`;

      await createRequestNotifications(tx, [
        {
          userId: request.mentorId,
          title: "Pengajuan izin dibatalkan",
          message,
          requestId: request.id,
        },
        ...stageUserIds
          .filter((userId) => userId !== request.mentorId)
          .map((userId) => ({
            userId,
            title: "Pengajuan izin dibatalkan",
            message,
            requestId: request.id,
          })),
        ...request.students
          .filter((student) => student.studentId !== user.id)
          .map((student) => ({
            userId: student.studentId,
            title: "Pengajuan izin dibatalkan",
            message,
            requestId: request.id,
          })),
      ]);
    });
  } catch (error) {
    if (error instanceof PermissionWorkflowError) {
      return {
        status: "error",
        message: error.message,
      };
    }

    console.error(error);

    return {
      status: "error",
      message: "Terjadi kesalahan saat membatalkan pengajuan.",
    };
  }

  revalidatePath("/riwayat-request");
  revalidatePath(`/riwayat-request/${requestId}`);
  revalidatePath("/dashboard");
  revalidatePath("/notifikasi");
  revalidatePath("/", "layout");

  redirect(`/riwayat-request/${requestId}?updated=1`);
}
