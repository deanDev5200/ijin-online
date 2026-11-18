"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireStaff } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import type { ActionState } from "@/lib/form-state";
import { PermissionWorkflowError } from "@/lib/permissions/errors";
import {
  createRequestNotifications,
  getActiveUserIdsByRole,
} from "@/lib/permissions/notifications";
import {
  canUserActOnRequest,
  getNextStatusForStep,
  getStageByStatus,
} from "@/lib/permissions/status";
import { decidePermissionSchema } from "@/lib/validations/permission";

function getFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export async function decidePermissionAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireStaff();

  const parsed = decidePermissionSchema.safeParse({
    requestId: getFormValue(formData, "requestId"),
    decision: getFormValue(formData, "decision"),
    note: getFormValue(formData, "note"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali keputusan yang Anda masukkan.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { requestId, decision, note } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const request = await tx.permissionRequest.findUnique({
        where: { id: requestId },
        select: {
          id: true,
          status: true,
          mentorId: true,
          purpose: true,
          requester: {
            select: {
              fullName: true,
            },
          },
          students: {
            select: {
              studentId: true,
            },
          },
        },
      });

      if (!request) {
        throw new PermissionWorkflowError("Pengajuan tidak ditemukan.");
      }

      const stage = getStageByStatus(request.status);

      if (!stage) {
        throw new PermissionWorkflowError(
          "Pengajuan ini sudah selesai diproses.",
        );
      }

      if (!canUserActOnRequest(user, request)) {
        throw new PermissionWorkflowError(
          "Anda tidak berwenang memberikan keputusan pada tahap ini.",
        );
      }

      const isReject = decision === "REJECT";
      const nextStatus = getNextStatusForStep(stage.step);

      if (!nextStatus) {
        throw new PermissionWorkflowError("Tahap persetujuan tidak valid.");
      }

      const claimed = await tx.permissionRequest.updateMany({
        where: {
          id: request.id,
          status: request.status,
        },
        data: isReject
          ? {
              status: "REJECTED",
              rejectionReason: note,
            }
          : {
              status: nextStatus,
            },
      });

      if (claimed.count === 0) {
        throw new PermissionWorkflowError(
          "Pengajuan ini baru saja diproses oleh penyetuju lain. Muat ulang halaman.",
        );
      }

      const stepClaim = await tx.approval.updateMany({
        where: {
          requestId: request.id,
          step: stage.step,
          status: "PENDING",
        },
        data: {
          status: isReject ? "REJECTED" : "APPROVED",
          approverId: user.id,
          note: note.length > 0 ? note : null,
          actedAt: new Date(),
        },
      });

      if (stepClaim.count === 0) {
        throw new PermissionWorkflowError(
          "Tahap persetujuan ini sudah diproses. Muat ulang halaman.",
        );
      }

      if (isReject) {
        await tx.approval.updateMany({
          where: {
            requestId: request.id,
            status: "PENDING",
          },
          data: {
            status: "CANCELLED",
          },
        });
      }

      const nextStage = isReject ? null : getStageByStatus(nextStatus);

      const notification = isReject
        ? {
            title: "Pengajuan izin ditolak",
            message: `Pengajuan "${request.purpose}" ditolak oleh ${stage.title}. Alasan: ${note}`,
          }
        : nextStage
          ? {
              title: "Izin disetujui tahap ini",
              message: `Pengajuan "${request.purpose}" disetujui oleh ${stage.title} dan diteruskan ke ${nextStage.title}.`,
            }
          : {
              title: "Izin disetujui",
              message: `Pengajuan "${request.purpose}" telah disetujui oleh ${stage.title}. Izin dinyatakan berlaku.`,
            };

      const recipientIds = [
        ...request.students.map((student) => student.studentId),
        request.mentorId,
      ].filter((userId) => userId !== user.id);

      const notifications = recipientIds.map((userId) => ({
        userId,
        title: notification.title,
        message: notification.message,
        requestId: request.id,
      }));

      if (!isReject && nextStage) {
        const nextApproverIds = await getActiveUserIdsByRole(
          tx,
          nextStage.role,
        );

        notifications.push(
          ...nextApproverIds
            .filter((userId) => userId !== user.id)
            .map((userId) => ({
              userId,
              title: "Permintaan izin menunggu persetujuan",
              message: `Pengajuan "${request.purpose}" dari ${request.requester.fullName} menunggu persetujuan ${nextStage.title}.`,
              requestId: request.id,
            })),
        );
      }

      await createRequestNotifications(tx, notifications);
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
      message: "Terjadi kesalahan saat menyimpan keputusan.",
    };
  }

  revalidatePath("/permintaan-izin");
  revalidatePath(`/permintaan-izin/${requestId}`);
  revalidatePath("/riwayat-approval");
  revalidatePath("/riwayat-request");
  revalidatePath(`/riwayat-request/${requestId}`);
  revalidatePath("/dashboard");
  revalidatePath("/notifikasi");
  revalidatePath("/", "layout");

  redirect(`/permintaan-izin/${requestId}?updated=1`);
}
