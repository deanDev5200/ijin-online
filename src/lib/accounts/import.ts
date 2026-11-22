import "server-only";

import ExcelJS from "exceljs";

import type { ImportIssue } from "@/lib/accounts/form-state";
import { STAFF_ROLE_OPTIONS, type StaffRole } from "@/lib/auth/roles";
import {
  importStaffRowSchema,
  importStudentRowSchema,
} from "@/lib/validations/account";

export const IMPORT_MAX_ROWS = 200;

export const STUDENT_IMPORT_HEADERS = [
  "Nama Lengkap",
  "NIS",
  "Grha",
  "Kelas",
] as const;

const HEADER_LABELS: Record<string, string> = {
  fullName: "Nama Lengkap",
  nis: "NIS",
  grha: "Grha",
  kelas: "Kelas",
};

export class StudentImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StudentImportError";
  }
}

export type ParsedStudentRow = {
  rowNumber: number;
  fullName: string;
  nis: string;
  grha: string;
  kelas: string;
};

export type StudentImportParseResult = {
  rows: ParsedStudentRow[];
  errors: ImportIssue[];
  totalRows: number;
};

export const STAFF_IMPORT_HEADERS = [
  "Nama Lengkap",
  "Nama Peran",
  "NIP",
] as const;

const STAFF_HEADER_LABELS: Record<string, string> = {
  fullName: "Nama Lengkap",
  role: "Nama Peran",
  nip: "NIP",
};

export class StaffImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StaffImportError";
  }
}

export type ParsedStaffRow = {
  rowNumber: number;
  fullName: string;
  role: StaffRole;
  nip: string;
};

export type StaffImportParseResult = {
  rows: ParsedStaffRow[];
  errors: ImportIssue[];
  totalRows: number;
};

function getCellText(cell: ExcelJS.Cell): string {
  const value = cell.value;

  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText
        .map((part) => part.text)
        .join("")
        .trim();
    }

    if ("text" in value && typeof value.text === "string") {
      return value.text.trim();
    }
  }

  return String(cell.text ?? value).trim();
}

function findSheet(
  workbook: ExcelJS.Workbook,
  preferredName: string,
): ExcelJS.Worksheet | undefined {
  return workbook.getWorksheet(preferredName) ?? workbook.worksheets[0];
}

export async function parseStudentImportWorkbook(
  buffer: ArrayBuffer,
): Promise<StudentImportParseResult> {
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw new StudentImportError(
      "Berkas tidak dapat dibaca. Pastikan berkas berformat Excel (.xlsx) yang valid.",
    );
  }

  const sheet = findSheet(workbook, "Akun Siswa");

  if (!sheet) {
    throw new StudentImportError("Berkas Excel tidak memiliki lembar kerja.");
  }

  const headerRow = sheet.getRow(1);
  const headerIndex = new Map<string, number>();

  for (let column = 1; column <= headerRow.cellCount; column += 1) {
    const name = getCellText(headerRow.getCell(column)).toLowerCase();

    if (name) {
      headerIndex.set(name, column);
    }
  }

  if (!headerIndex.has("grha")) {
    throw new StudentImportError(
      "Kolom \"Grha\" wajib ada pada baris pertama. Impor tidak dapat diselesaikan tanpa kolom tersebut.",
    );
  }

  const missingHeaders = STUDENT_IMPORT_HEADERS.filter(
    (header) => !headerIndex.has(header.toLowerCase()),
  );

  if (missingHeaders.length > 0) {
    throw new StudentImportError(
      `Kolom berikut tidak ditemukan pada baris pertama: ${missingHeaders.join(", ")}. Gunakan template resmi aplikasi.`,
    );
  }

  const getColumn = (header: (typeof STUDENT_IMPORT_HEADERS)[number]) =>
    headerIndex.get(header.toLowerCase()) ?? 0;

  const rows: ParsedStudentRow[] = [];
  const errors: ImportIssue[] = [];
  const seenNis = new Map<string, number>();
  let totalRows = 0;

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const raw = {
      fullName: getCellText(row.getCell(getColumn("Nama Lengkap"))),
      nis: getCellText(row.getCell(getColumn("NIS"))),
      grha: getCellText(row.getCell(getColumn("Grha"))),
      kelas: getCellText(row.getCell(getColumn("Kelas"))),
    };

    if (Object.values(raw).every((value) => value.length === 0)) {
      continue;
    }

    totalRows += 1;

    if (totalRows > IMPORT_MAX_ROWS) {
      throw new StudentImportError(
        `Berkas berisi lebih dari ${IMPORT_MAX_ROWS} baris data. Pecah impor menjadi beberapa berkas.`,
      );
    }

    const parsed = importStudentRowSchema.safeParse(raw);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const messages = Object.entries(fieldErrors).flatMap(
        ([field, fieldMessages]) =>
          (fieldMessages ?? []).map(
            (message) => `${HEADER_LABELS[field] ?? field}: ${message}`,
          ),
      );

      errors.push({
        row: rowNumber,
        message: messages.join(" ") || "Data baris tidak valid.",
      });
      continue;
    }

    const data = parsed.data;
    const existingNisRow = seenNis.get(data.nis.toLowerCase());

    if (existingNisRow) {
      errors.push({
        row: rowNumber,
        message: `NIS "${data.nis}" duplikat dengan baris ${existingNisRow}.`,
      });
      continue;
    }

    seenNis.set(data.nis.toLowerCase(), rowNumber);
    rows.push({ rowNumber, ...data });
  }

  return { rows, errors, totalRows };
}

export async function parseStaffImportWorkbook(
  buffer: ArrayBuffer,
): Promise<StaffImportParseResult> {
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw new StaffImportError(
      "Berkas tidak dapat dibaca. Pastikan berkas berformat Excel (.xlsx) yang valid.",
    );
  }

  const sheet = findSheet(workbook, "Akun Pendidik");

  if (!sheet) {
    throw new StaffImportError("Berkas Excel tidak memiliki lembar kerja.");
  }

  const headerRow = sheet.getRow(1);
  const headerIndex = new Map<string, number>();

  for (let column = 1; column <= headerRow.cellCount; column += 1) {
    const name = getCellText(headerRow.getCell(column)).toLowerCase();

    if (name) {
      headerIndex.set(name, column);
    }
  }

  const missingHeaders = STAFF_IMPORT_HEADERS.filter(
    (header) => !headerIndex.has(header.toLowerCase()),
  );

  if (missingHeaders.length > 0) {
    throw new StaffImportError(
      `Kolom berikut tidak ditemukan pada baris pertama: ${missingHeaders.join(", ")}. Gunakan template resmi aplikasi.`,
    );
  }

  const getColumn = (header: (typeof STAFF_IMPORT_HEADERS)[number]) =>
    headerIndex.get(header.toLowerCase()) ?? 0;

  const rows: ParsedStaffRow[] = [];
  const errors: ImportIssue[] = [];
  const seenNip = new Map<string, number>();
  let totalRows = 0;

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const raw = {
      fullName: getCellText(row.getCell(getColumn("Nama Lengkap"))),
      role: getCellText(row.getCell(getColumn("Nama Peran"))),
      nip: getCellText(row.getCell(getColumn("NIP"))),
    };

    if (Object.values(raw).every((value) => value.length === 0)) {
      continue;
    }

    totalRows += 1;

    if (totalRows > IMPORT_MAX_ROWS) {
      throw new StaffImportError(
        `Berkas berisi lebih dari ${IMPORT_MAX_ROWS} baris data. Pecah impor menjadi beberapa berkas.`,
      );
    }

    const parsed = importStaffRowSchema.safeParse(raw);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const messages = Object.entries(fieldErrors).flatMap(
        ([field, fieldMessages]) =>
          (fieldMessages ?? []).map(
            (message) => `${STAFF_HEADER_LABELS[field] ?? field}: ${message}`,
          ),
      );

      errors.push({
        row: rowNumber,
        message: messages.join(" ") || "Data baris tidak valid.",
      });
      continue;
    }

    const data = parsed.data;
    const existingNipRow = seenNip.get(data.nip.toLowerCase());

    if (existingNipRow) {
      errors.push({
        row: rowNumber,
        message: `NIP "${data.nip}" duplikat dengan baris ${existingNipRow}.`,
      });
      continue;
    }

    seenNip.set(data.nip.toLowerCase(), rowNumber);
    rows.push({ rowNumber, ...data });
  }

  return { rows, errors, totalRows };
}

export async function buildStudentImportTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "E-Dispen";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Akun Siswa", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Nama Lengkap", key: "fullName", width: 30 },
    { header: "NIS", key: "nis", width: 16 },
    { header: "Grha", key: "grha", width: 18 },
    { header: "Kelas", key: "kelas", width: 18 },
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
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF1D4ED8" } },
    };
  });

  sheet.getColumn("nis").numFmt = "@";

  for (let rowNumber = 2; rowNumber <= IMPORT_MAX_ROWS + 1; rowNumber += 1) {
    sheet.getCell(`A${rowNumber}`).dataValidation = {
      type: "textLength",
      operator: "between",
      formulae: [3, 100],
      allowBlank: true,
      showErrorMessage: true,
      errorTitle: "Nama lengkap tidak valid",
      error: "Nama lengkap harus 3-100 karakter.",
    };
  }

  const guide = workbook.addWorksheet("Petunjuk");
  guide.columns = [{ width: 24 }, { width: 80 }];
  guide.addRow(["Kolom", "Keterangan"]);
  guide.getRow(1).font = { bold: true };

  const guideRows: Array<[string, string]> = [
    ["Nama Lengkap", "Wajib. Nama lengkap siswa, 3-100 karakter."],
    ["NIS", "Wajib. Nomor Induk Siswa, harus unik. Gunakan format teks agar angka nol di depan tidak hilang."],
    ["Grha", "Wajib. Nama grha/asrama, 2-50 karakter. Kolom ini harus ada agar impor bisa dilakukan."],
    ["Kelas", "Wajib. Kelas siswa, maksimal 50 karakter."],
    ["Username", "Dibuat otomatis dari kata terakhir nama lengkap (huruf kecil, maksimal 6 karakter). Tidak perlu diisi."],
    ["Password", "Password awal otomatis 123456. Pengguna wajib membuat username dan password pribadi saat login pertama."],
    ["Contoh baris", "Ahmad Fauzi | 24001 | Grha A | X IPA 1"],
  ];

  for (const [label, description] of guideRows) {
    guide.addRow([label, description]);
  }

  guide.eachRow((row, rowNumber) => {
    row.alignment = { vertical: "top", wrapText: true };
    if (rowNumber === 1) {
      row.font = { bold: true };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return Buffer.from(buffer);
}

export async function buildStaffImportTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "E-Dispen";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Akun Pendidik", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Nama Lengkap", key: "fullName", width: 30 },
    { header: "Nama Peran", key: "role", width: 24 },
    { header: "NIP", key: "nip", width: 18 },
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
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF1D4ED8" } },
    };
  });

  sheet.getColumn("nip").numFmt = "@";

  const roleOptions = STAFF_ROLE_OPTIONS.map((option) => option.label).join(",");

  for (let rowNumber = 2; rowNumber <= IMPORT_MAX_ROWS + 1; rowNumber += 1) {
    sheet.getCell(`A${rowNumber}`).dataValidation = {
      type: "textLength",
      operator: "between",
      formulae: [3, 100],
      allowBlank: true,
      showErrorMessage: true,
      errorTitle: "Nama lengkap tidak valid",
      error: "Nama lengkap harus 3-100 karakter.",
    };
    sheet.getCell(`B${rowNumber}`).dataValidation = {
      type: "list",
      formulae: [`"${roleOptions}"`],
      allowBlank: true,
      showErrorMessage: true,
      errorTitle: "Nama peran tidak valid",
      error: `Pilih salah satu: ${STAFF_ROLE_OPTIONS.map(
        (option) => option.label,
      ).join(", ")}.`,
    };
  }

  const guide = workbook.addWorksheet("Petunjuk");
  guide.columns = [{ width: 24 }, { width: 80 }];
  guide.addRow(["Kolom", "Keterangan"]);
  guide.getRow(1).font = { bold: true };

  const guideRows: Array<[string, string]> = [
    ["Nama Lengkap", "Wajib. Nama lengkap tenaga pendidik, 3-100 karakter."],
    [
      "Nama Peran",
      `Wajib. Pilih salah satu: ${STAFF_ROLE_OPTIONS.map(
        (option) => option.label,
      ).join(", ")}. Nilai peran seperti ${STAFF_ROLE_OPTIONS.map(
        (option) => option.value,
      ).join(", ")} juga diterima.`,
    ],
    ["NIP", "Wajib. Nomor Induk Pegawai, harus unik. Gunakan format teks agar angka nol di depan tidak hilang."],
    ["Username", "Dibuat otomatis dari kata terakhir nama lengkap (huruf kecil, maksimal 6 karakter). Tidak perlu diisi."],
    ["Password", "Password awal otomatis 123456. Pengguna wajib membuat username dan password pribadi saat login pertama."],
    ["Contoh baris", "Siti Rahmawati | Pembina | 19870101"],
  ];

  for (const [label, description] of guideRows) {
    guide.addRow([label, description]);
  }

  guide.eachRow((row, rowNumber) => {
    row.alignment = { vertical: "top", wrapText: true };
    if (rowNumber === 1) {
      row.font = { bold: true };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return Buffer.from(buffer);
}
