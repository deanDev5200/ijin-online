import "server-only";

import ExcelJS from "exceljs";

import type { ImportIssue } from "@/lib/accounts/form-state";
import { importStudentRowSchema } from "@/lib/validations/account";

export const IMPORT_MAX_ROWS = 200;

export const STUDENT_IMPORT_HEADERS = [
  "Nama Lengkap",
  "Username",
  "NIS",
  "Grha",
  "Kelas",
  "Password",
] as const;

const HEADER_LABELS: Record<string, string> = {
  fullName: "Nama Lengkap",
  username: "Username",
  nis: "NIS",
  grha: "Grha",
  kelas: "Kelas",
  password: "Password",
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
  username: string;
  nis: string;
  grha: string;
  kelas: string;
  password: string;
};

export type StudentImportParseResult = {
  rows: ParsedStudentRow[];
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

function findSheet(workbook: ExcelJS.Workbook): ExcelJS.Worksheet {
  return workbook.getWorksheet("Akun Siswa") ?? workbook.worksheets[0];
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

  const sheet = findSheet(workbook);

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
  const seenUsernames = new Map<string, number>();
  const seenNis = new Map<string, number>();
  let totalRows = 0;

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const raw = {
      fullName: getCellText(row.getCell(getColumn("Nama Lengkap"))),
      username: getCellText(row.getCell(getColumn("Username"))),
      nis: getCellText(row.getCell(getColumn("NIS"))),
      grha: getCellText(row.getCell(getColumn("Grha"))),
      kelas: getCellText(row.getCell(getColumn("Kelas"))),
      password: getCellText(row.getCell(getColumn("Password"))),
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
            (message) =>
              `${HEADER_LABELS[field] ?? field}: ${message}`,
          ),
      );

      errors.push({
        row: rowNumber,
        message: messages.join(" ") || "Data baris tidak valid.",
      });
      continue;
    }

    const data = parsed.data;
    const usernameKey = data.username.toLowerCase();
    const existingUsernameRow = seenUsernames.get(usernameKey);
    const existingNisRow = seenNis.get(data.nis.toLowerCase());

    if (existingUsernameRow) {
      errors.push({
        row: rowNumber,
        message: `Username "${data.username}" duplikat dengan baris ${existingUsernameRow}.`,
      });
      continue;
    }

    if (existingNisRow) {
      errors.push({
        row: rowNumber,
        message: `NIS "${data.nis}" duplikat dengan baris ${existingNisRow}.`,
      });
      continue;
    }

    seenUsernames.set(usernameKey, rowNumber);
    seenNis.set(data.nis.toLowerCase(), rowNumber);
    rows.push({ rowNumber, ...data });
  }

  return { rows, errors, totalRows };
}

export async function buildStudentImportTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Ijin Online";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Akun Siswa", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Nama Lengkap", key: "fullName", width: 30 },
    { header: "Username", key: "username", width: 20 },
    { header: "NIS", key: "nis", width: 16 },
    { header: "Grha", key: "grha", width: 18 },
    { header: "Kelas", key: "kelas", width: 18 },
    { header: "Password", key: "password", width: 20 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F766E" },
    };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF0F766E" } },
    };
  });

  sheet.getColumn("nis").numFmt = "@";
  sheet.getColumn("username").numFmt = "@";

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
    sheet.getCell(`F${rowNumber}`).dataValidation = {
      type: "textLength",
      operator: "between",
      formulae: [6, 72],
      allowBlank: true,
      showErrorMessage: true,
      errorTitle: "Password tidak valid",
      error: "Password harus 6-72 karakter.",
    };
  }

  const guide = workbook.addWorksheet("Petunjuk");
  guide.columns = [{ width: 24 }, { width: 80 }];
  guide.addRow(["Kolom", "Keterangan"]);
  guide.getRow(1).font = { bold: true };

  const guideRows: Array<[string, string]> = [
    ["Nama Lengkap", "Wajib. Nama lengkap siswa, 3-100 karakter."],
    ["Username", "Wajib. 5-20 karakter, hanya huruf, angka, titik, dan garis bawah. Otomatis menjadi huruf kecil."],
    ["NIS", "Wajib. Nomor Induk Siswa, harus unik. Gunakan format teks agar angka nol di depan tidak hilang."],
    ["Grha", "Wajib. Nama grha/asrama, 2-50 karakter."],
    ["Kelas", "Wajib. Kelas siswa, maksimal 50 karakter."],
    ["Password", "Wajib. Password awal 6-72 karakter. Pengguna wajib mengganti password saat login pertama."],
    ["Contoh baris", "Ahmad Fauzi | ahmad.fauzi | 24001 | Grha A | X IPA 1 | demo123"],
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
