import ExcelJS from "exceljs";

import type { AccountFilters } from "@/lib/admin/account-filters";
import { ROLE_LABELS, type AppRole } from "@/lib/auth/roles";
import { formatDateTime } from "@/lib/permissions/dates";

import { INITIAL_PASSWORD } from "./username";

export type ExportAccount = {
  fullName: string;
  username: string;
  role: AppRole;
  studentProfile: { kelas: string } | null;
};

export type AccountExportMeta = {
  exportedBy: string;
  filters: AccountFilters;
  limit: number;
  reachedLimit: boolean;
};

const collator = new Intl.Collator("id", {
  numeric: true,
  sensitivity: "base",
});

function compareByKelas(a: ExportAccount, b: ExportAccount): number {
  const kelasA = a.studentProfile?.kelas.trim() ?? "";
  const kelasB = b.studentProfile?.kelas.trim() ?? "";

  if (kelasA && kelasB) {
    const byKelas = collator.compare(kelasA, kelasB);

    if (byKelas !== 0) {
      return byKelas;
    }
  } else if (kelasA !== kelasB) {
    // Akun tanpa kelas (staff/admin) diletakkan setelah akun siswa.
    return kelasA ? -1 : 1;
  }

  return collator.compare(a.fullName, b.fullName);
}

export function sortAccountsByKelas(
  accounts: readonly ExportAccount[],
): ExportAccount[] {
  return [...accounts].sort(compareByKelas);
}

export async function buildAccountExportWorkbook(
  accounts: readonly ExportAccount[],
  meta: AccountExportMeta,
): Promise<Buffer> {
  const sortedAccounts = sortAccountsByKelas(accounts);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Ijin Online";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Daftar Akun", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Nama Lengkap", key: "fullName", width: 30 },
    { header: "Username", key: "username", width: 18 },
    { header: "Password Awal", key: "initialPassword", width: 18 },
    { header: "Kelas", key: "kelas", width: 18 },
    { header: "Peran", key: "role", width: 22 },
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

  sortedAccounts.forEach((account, index) => {
    sheet.addRow({
      no: index + 1,
      fullName: account.fullName,
      username: account.username,
      initialPassword: INITIAL_PASSWORD,
      kelas: account.studentProfile?.kelas.trim() || "-",
      role: ROLE_LABELS[account.role],
    });
  });

  sheet.getColumn("username").numFmt = "@";
  sheet.getColumn("initialPassword").numFmt = "@";
  sheet.autoFilter = {
    from: "A1",
    to: `F${Math.max(1, sortedAccounts.length + 1)}`,
  };
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    row.alignment = { vertical: "middle", wrapText: true };
  });

  const { filters } = meta;
  const summary = workbook.addWorksheet("Ringkasan");
  summary.columns = [{ width: 26 }, { width: 68 }];
  summary.addRow(["Diekspor pada", formatDateTime(new Date())]);
  summary.addRow(["Diekspor oleh", meta.exportedBy]);
  summary.addRow(["Kata kunci", filters.q || "-"]);
  summary.addRow([
    "Peran",
    filters.role === "ALL" ? "Semua peran" : ROLE_LABELS[filters.role],
  ]);
  summary.addRow([
    "Status",
    filters.status === "ALL"
      ? "Semua status"
      : filters.status === "active"
        ? "Aktif"
        : "Nonaktif",
  ]);
  summary.addRow([
    "Urutan",
    "Kelas (urutan alami A–Z/angka), lalu nama lengkap. Akun tanpa kelas berada di bagian bawah.",
  ]);
  summary.addRow(["Jumlah baris", sortedAccounts.length]);
  summary.addRow([
    "Catatan",
    `Password Awal adalah kata sandi bawaan ${INITIAL_PASSWORD} untuk akun baru atau yang di-reset. Kata sandi aktual akun yang sudah diubah tidak dapat diekspor.${
      meta.reachedLimit
        ? ` Ekspor dibatasi ${meta.limit} baris; persempit filter untuk mengambil data lain.`
        : ""
    }`,
  ]);
  summary.getColumn(1).font = { bold: true };

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
