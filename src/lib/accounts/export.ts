import ExcelJS from "exceljs";
import JSZip from "jszip";

import type { AccountFilters } from "@/lib/admin/account-filters";
import { ROLE_LABELS, type AppRole } from "@/lib/auth/roles";
import { formatDateTime, getTodayInJakarta } from "@/lib/permissions/dates";

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

function sanitizeFilename(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();
}

async function buildWorkbook(
  accounts: readonly ExportAccount[],
  meta: AccountExportMeta,
  kelas: string | null,
): Promise<Buffer> {
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

  accounts.forEach((account, index) => {
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
    to: `F${Math.max(1, accounts.length + 1)}`,
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
  summary.addRow(["Kelas", kelas ?? "Semua kelas"]);
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
  summary.addRow(["Urutan", "Nama lengkap (A–Z) di dalam kelas ini."]);
  summary.addRow(["Jumlah baris", accounts.length]);
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

/** Satu workbook untuk semua akun (dipertahankan untuk kebutuhan lain). */
export async function buildAccountExportWorkbook(
  accounts: readonly ExportAccount[],
  meta: AccountExportMeta,
): Promise<Buffer> {
  return buildWorkbook(sortAccountsByKelas(accounts), meta, null);
}

/** Satu berkas ZIP berisi satu .xlsx untuk tiap kelas. */
export async function buildAccountExportZip(
  accounts: readonly ExportAccount[],
  meta: AccountExportMeta,
): Promise<Buffer> {
  const groups = groupAccountsByKelas(accounts);
  const zip = new JSZip();
  const date = getTodayInJakarta();

  for (const group of groups) {
    const buffer = await buildWorkbook(group.accounts, meta, group.kelas);
    zip.file(
      `daftar-akun-${sanitizeFilename(group.kelas)}-${date}.xlsx`,
      buffer,
    );
  }

  if (groups.length === 0) {
    zip.file(
      "Tidak ada data.txt",
      "Tidak ditemukan akun siswa dengan data kelas pada filter yang dipilih.",
    );
  }

  return zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}
