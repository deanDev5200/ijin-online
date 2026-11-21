import ExcelJS from "exceljs";

import {
  buildPermissionIndexWhere,
  parsePermissionIndexFilters,
} from "@/lib/admin/permission-index";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import {
  formatDateRange,
  formatDateTime,
  formatTimeRange,
  getTodayInJakarta,
} from "@/lib/permissions/dates";
import {
  getPermissionTypeConfig,
  hasField,
} from "@/lib/permissions/config";
import { parseDepositItems } from "@/lib/permissions/deposit-items";
import {
  APPROVAL_STATUS_LABELS,
  REQUEST_STATUS_LABELS,
} from "@/lib/permissions/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPORT_LIMIT = 5000;

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN" || user.mustChangePassword) {
    return new Response("Akses ditolak.", { status: 403 });
  }

  const url = new URL(request.url);
  const filters = parsePermissionIndexFilters(
    Object.fromEntries(url.searchParams.entries()),
  );
  const where = buildPermissionIndexWhere(filters);

  const [requests, selectedType] = await Promise.all([
    prisma.permissionRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: EXPORT_LIMIT,
      select: {
        id: true,
        purpose: true,
        place: true,
        startDate: true,
        endDate: true,
        startTime: true,
        endTime: true,
        status: true,
        rejectionReason: true,
        visitorName: true,
        phoneUse: true,
        additionalNotes: true,
        depositItems: true,
        createdAt: true,
        type: {
          select: {
            name: true,
            approvalRoles: true,
            requiredFields: true,
            fieldLabels: true,
            approvalLabels: true,
            formGuide: true,
          },
        },
        requester: {
          select: {
            fullName: true,
          },
        },
        mentor: {
          select: {
            fullName: true,
            staffProfile: {
              select: {
                nip: true,
              },
            },
          },
        },
        students: {
          select: {
            isRequester: true,
            student: {
              select: {
                fullName: true,
                studentProfile: {
                  select: {
                    nis: true,
                    kelas: true,
                    grha: true,
                  },
                },
              },
            },
          },
        },
        approvals: {
          orderBy: { step: "asc" },
          select: {
            step: true,
            role: true,
            status: true,
            note: true,
            actedAt: true,
            approver: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    }),
    filters.typeId !== "ALL"
      ? prisma.permissionType.findUnique({
          where: { id: filters.typeId },
          select: { name: true },
        })
      : null,
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Ijin Online";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Indeks Izin", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Tanggal Pengajuan", key: "createdAt", width: 24 },
    { header: "Jenis Izin", key: "type", width: 26 },
    { header: "Status", key: "status", width: 22 },
    { header: "Pengaju", key: "requester", width: 24 },
    { header: "Siswa Terlibat", key: "students", width: 34 },
    { header: "NIS", key: "nis", width: 18 },
    { header: "Kelas", key: "kelas", width: 16 },
    { header: "Grha", key: "grha", width: 16 },
    { header: "Tujuan Kegiatan", key: "purpose", width: 36 },
    { header: "Tempat", key: "place", width: 26 },
    { header: "Yang Datang", key: "visitorName", width: 26 },
    { header: "Keperluan HP", key: "phoneUse", width: 32 },
    { header: "Catatan Tambahan", key: "additionalNotes", width: 38 },
    { header: "Daftar Titipan", key: "depositItems", width: 48 },
    { header: "Tanggal Izin", key: "dates", width: 30 },
    { header: "Jam", key: "times", width: 16 },
    { header: "Jam pulang", key: "departureTime", width: 16 },
    { header: "Jam kedatangan", key: "returnTime", width: 18 },
    { header: "Pembina/Pendamping", key: "mentor", width: 26 },
    { header: "NIP Pembina", key: "mentorNip", width: 22 },
    { header: "Jejak Persetujuan", key: "approvals", width: 60 },
    { header: "Alasan Penolakan", key: "rejection", width: 36 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" },
    };
    cell.alignment = { vertical: "middle", wrapText: true };
  });

  requests.forEach((requestItem, index) => {
    const students = [...requestItem.students].sort((a, b) => {
      if (a.isRequester !== b.isRequester) {
        return a.isRequester ? -1 : 1;
      }

      return a.student.fullName.localeCompare(b.student.fullName, "id");
    });

    const config = getPermissionTypeConfig(requestItem.type);
    const approvalTrail = requestItem.approvals
      .map((approval) => {
        const roleLabel =
          approval.role === "PEMBINA"
            ? "Pembina/Pendamping"
            : ROLE_LABELS[approval.role];
        const statusLabel = APPROVAL_STATUS_LABELS[approval.status];
        const approver = approval.approver?.fullName ?? "-";
        const actedAt = approval.actedAt
          ? ` (${formatDateTime(approval.actedAt)})`
          : "";

        return `${roleLabel}: ${statusLabel} oleh ${approver}${actedAt}`;
      })
      .join("\n");

    sheet.addRow({
      no: index + 1,
      createdAt: formatDateTime(requestItem.createdAt),
      type: requestItem.type.name,
      status: REQUEST_STATUS_LABELS[requestItem.status],
      requester: requestItem.requester.fullName,
      students: students
        .map(({ student }) => student.fullName)
        .join("; "),
      nis: students
        .map(({ student }) => student.studentProfile?.nis)
        .filter(Boolean)
        .join("; "),
      kelas: Array.from(
        new Set(
          students
            .map(({ student }) => student.studentProfile?.kelas)
            .filter(Boolean),
        ),
      ).join("; "),
      grha: Array.from(
        new Set(
          students
            .map(({ student }) => student.studentProfile?.grha)
            .filter(Boolean),
        ),
      ).join("; "),
      purpose: requestItem.purpose,
      place: requestItem.place,
      visitorName: requestItem.visitorName ?? "",
      phoneUse: requestItem.phoneUse ?? "",
      additionalNotes: requestItem.additionalNotes ?? "",
      depositItems: parseDepositItems(requestItem.depositItems)
        .map(
          (item, index) =>
            `${index + 1}. ${item.name} · ${item.quantity} ${item.unit}${
              item.note ? ` · ${item.note}` : ""
            }`,
        )
        .join("\n"),
      dates: formatDateRange(requestItem.startDate, requestItem.endDate),
      times: formatTimeRange(requestItem.startTime, requestItem.endTime),
      departureTime: hasField(config, "departureTime")
        ? requestItem.startTime
        : "",
      returnTime: hasField(config, "returnTime") ? requestItem.endTime : "",
      mentor: requestItem.mentor?.fullName ?? "",
      mentorNip: requestItem.mentor?.staffProfile?.nip ?? "",
      approvals: approvalTrail,
      rejection: requestItem.rejectionReason ?? "",
    });
  });

  sheet.autoFilter = {
    from: "A1",
    to: `W${Math.max(1, requests.length + 1)}`,
  };

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    row.alignment = { vertical: "top", wrapText: true };
    row.height = 30;
  });

  const summary = workbook.addWorksheet("Ringkasan");
  summary.columns = [{ width: 26 }, { width: 60 }];
  summary.addRow(["Diekspor pada", formatDateTime(new Date())]);
  summary.addRow(["Diekspor oleh", `${user.fullName} (@${user.username})`]);
  summary.addRow(["Kata kunci", filters.q || "-"]);
  summary.addRow([
    "Status",
    filters.status === "ALL"
      ? "Semua status"
      : REQUEST_STATUS_LABELS[filters.status],
  ]);
  summary.addRow(["Jenis izin", selectedType?.name ?? "Semua jenis izin"]);
  summary.addRow(["Tanggal dari", filters.from || "-"]);
  summary.addRow(["Tanggal sampai", filters.to || "-"]);
  summary.addRow(["Jumlah baris", requests.length]);
  summary.addRow([
    "Catatan",
    requests.length >= EXPORT_LIMIT
      ? `Ekspor dibatasi ${EXPORT_LIMIT} baris terbaru. Persempit filter untuk data lain.`
      : "Seluruh data yang cocok dengan filter diekspor.",
  ]);
  summary.getColumn(1).font = { bold: true };

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  const filename = `indeks-izin-${getTodayInJakarta()}.xlsx`;

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "no-store",
    },
  });
}
