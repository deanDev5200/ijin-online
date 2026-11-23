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

export type AccountClassGroup = {
  kelas: string;
  accounts: ExportAccount[];
};

export type ExportStaffAccount = {
  fullName: string;
  username: string;
  role: AppRole;
  staffProfile: { nip: string | null } | null;
};

const collator = new Intl.Collator("id", {
  numeric: true,
  sensitivity: "base",
});

const SUMMARY_SHEET_NAME = "Ringkasan";
const EXCEL_SHEET_MAX_LENGTH = 31;

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

/** Mengelompokkan hanya akun siswa yang memiliki kelas, urut per kelas lalu nama. */
export function groupAccountsByKelas(
  accounts: readonly ExportAccount[],
): AccountClassGroup[] {
  const grouped = new Map<string, ExportAccount[]>();

  for (const account of accounts) {
    const kelas = account.studentProfile?.kelas.trim();

    if (!kelas) {
      continue;
    }

    const members = grouped.get(kelas) ?? [];
    members.push(account);
    grouped.set(kelas, members);
  }

  return Array.from(grouped, ([kelas, members]) => ({
    kelas,
    accounts: [...members].sort((a, b) =>
      collator.compare(a.fullName, b.fullName),
    ),
  })).sort((a, b) => collator.compare(a.kelas, b.kelas));
}

function uniqueSheetName(base: string, used: Set<string>): string {
  const clean = () =>
    (base.replace(/[\\/:*?[\]]/g, " ").replace(/\s+/g, " ").trim() || "Kelas")
      .slice(0, EXCEL_SHEET_MAX_LENGTH);
  let name = clean();
  let suffix = 2;

  while (used.has(name.toLowerCase())) {
    const tail = ` (${suffix})`;
    name = `${clean().slice(0, EXCEL_SHEET_MAX_LENGTH - tail.length)}${tail}`;
    suffix += 1;
  }

  used.add(name.toLowerCase());
  return name;
}

function addClassSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  accounts: readonly ExportAccount[],
): void {
  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Nama Lengkap", key: "fullName", width: 30 },
    { header: "Kelas", key: "kelas", width: 18 },
    { header: "Username", key: "username", width: 18 },
    { header: "Password Awal", key: "initialPassword", width: 18 },
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

  accounts.forEach((account, index) => {
    sheet.addRow({
      no: index + 1,
      fullName: account.fullName,
      kelas: account.studentProfile?.kelas ?? "",
      username: account.username,
      initialPassword: INITIAL_PASSWORD,
    });
  });

  sheet.getColumn("username").numFmt = "@";
  sheet.getColumn("initialPassword").numFmt = "@";
  sheet.autoFilter = {
    from: "A1",
    to: `E${Math.max(1, accounts.length + 1)}`,
  };
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    row.alignment = { vertical: "middle", wrapText: true };
  });
}

/**
 * Satu file Excel dengan satu worksheet per kelas, didahului sheet Ringkasan.
 * Akun tanpa kelas tidak disertakan.
 */
export async function buildAccountExportWorkbook(
  accounts: readonly ExportAccount[],
  meta: AccountExportMeta,
): Promise<Buffer> {
  const groups = groupAccountsByKelas(accounts);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "E-Dispen";
  workbook.created = new Date();

  const { filters } = meta;
  const summary = workbook.addWorksheet(SUMMARY_SHEET_NAME);
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
  summary.addRow(["Jumlah kelas", groups.length]);
  summary.addRow([
    "Jumlah akun",
    groups.reduce((total, group) => total + group.accounts.length, 0),
  ]);
  summary.addRow([
    "Rincian per kelas",
    groups.length === 0
      ? "-"
      : groups.map((group) => `${group.kelas}: ${group.accounts.length}`).join(", "),
  ]);
  summary.addRow([
    "Catatan",
    `Setiap kelas memiliki sheet tersendiri. Password Awal adalah kata sandi bawaan ${INITIAL_PASSWORD} untuk akun baru atau yang di-reset; kata sandi aktual akun yang sudah diubah tidak dapat diekspor.${
      meta.reachedLimit
        ? ` Ekspor dibatasi ${meta.limit} baris; persempit filter untuk mengambil data lain.`
        : ""
    }`,
  ]);
  summary.getColumn(1).font = { bold: true };

  const usedSheetNames = new Set<string>([SUMMARY_SHEET_NAME.toLowerCase()]);

  if (groups.length === 0) {
    addClassSheet(workbook, uniqueSheetName("Tidak ada data", usedSheetNames), []);
  } else {
    for (const group of groups) {
      addClassSheet(
        workbook,
        uniqueSheetName(group.kelas, usedSheetNames),
        group.accounts,
      );
    }
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

/** Ekspor seluruh tenaga pendidik dalam satu sheet, lengkap dengan kredensial awal. */
export async function buildStaffExportWorkbook(
  accounts: readonly ExportStaffAccount[],
): Promise<Buffer> {
  const staff = [...accounts].sort((a, b) => {
    const byRole = collator.compare(ROLE_LABELS[a.role], ROLE_LABELS[b.role]);

    return byRole !== 0 ? byRole : collator.compare(a.fullName, b.fullName);
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "E-Dispen";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Akun Pendidik", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Nama Lengkap", key: "fullName", width: 30 },
    { header: "Jabatan / Peran", key: "role", width: 24 },
    { header: "NIP", key: "nip", width: 18 },
    { header: "Username", key: "username", width: 18 },
    { header: "Password Awal", key: "initialPassword", width: 18 },
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

  staff.forEach((account, index) => {
    sheet.addRow({
      no: index + 1,
      fullName: account.fullName,
      role: ROLE_LABELS[account.role],
      nip: account.staffProfile?.nip ?? "",
      username: account.username,
      initialPassword: INITIAL_PASSWORD,
    });
  });

  sheet.getColumn("nip").numFmt = "@";
  sheet.getColumn("username").numFmt = "@";
  sheet.getColumn("initialPassword").numFmt = "@";
  sheet.autoFilter = {
    from: "A1",
    to: `F${Math.max(1, staff.length + 1)}`,
  };
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    row.alignment = { vertical: "middle", wrapText: true };
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
