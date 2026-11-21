import type { Role } from "../../generated/prisma/enums";

export const APPROVAL_ROLES = [
  "PEMBINA",
  "STAFF_ASRAMA",
  "KEPALA_ASRAMA",
  "WAKASEK_KESISWAAN",
] as const;

export type ApprovalRole = (typeof APPROVAL_ROLES)[number];

export const PERMISSION_FIELDS = [
  "purpose",
  "place",
  "startDate",
  "endDate",
  "time",
  "departureTime",
  "returnTime",
  "visitorName",
  "phoneUse",
  "additionalNotes",
  "depositItems",
] as const;

export type PermissionField = (typeof PERMISSION_FIELDS)[number];

export const DEFAULT_APPROVAL_ROLES: ApprovalRole[] = [
  "PEMBINA",
  "STAFF_ASRAMA",
];

export const DEFAULT_REQUIRED_FIELDS: PermissionField[] = [
  "purpose",
  "startDate",
  "time",
];

export const APPROVAL_ROLE_LABELS: Record<ApprovalRole, string> = {
  PEMBINA: "Guru",
  STAFF_ASRAMA: "Staff Pegawai",
  KEPALA_ASRAMA: "Kepala Asrama",
  WAKASEK_KESISWAAN: "Wakasek Kesiswaan",
};

export const APPROVAL_ROLE_DESCRIPTIONS: Record<ApprovalRole, string> = {
  PEMBINA: "Guru yang berwenang memberikan keputusan pada pengajuan ini.",
  STAFF_ASRAMA:
    "Staff pegawai yang berwenang memberikan keputusan pada pengajuan ini.",
  KEPALA_ASRAMA: "Memberikan keputusan persetujuan pengajuan asrama.",
  WAKASEK_KESISWAAN: "Memberikan keputusan persetujuan dari bagian kesiswaan.",
};

export const FIELD_LABELS: Record<PermissionField, string> = {
  purpose: "Keperluan / tujuan",
  place: "Tempat",
  startDate: "Hari / tanggal",
  endDate: "Tanggal selesai",
  time: "Waktu",
  departureTime: "Jam pulang",
  returnTime: "Jam kedatangan",
  visitorName: "Yang datang",
  phoneUse: "Keperluan penggunaan HP",
  additionalNotes: "Catatan tambahan",
  depositItems: "Daftar barang titipan (1-10)",
};

export type PermissionTypeConfig = {
  approvalRoles: ApprovalRole[];
  requiredFields: PermissionField[];
  fieldLabels: Partial<Record<PermissionField, string>>;
  approvalLabels: Partial<Record<ApprovalRole, string>>;
  formGuide: string | null;
};

export type PermissionTypeConfigRow = {
  approvalRoles: string | null;
  requiredFields: string | null;
  fieldLabels: string | null;
  approvalLabels: string | null;
  formGuide: string | null;
};

function parseJson(value: string | null | undefined): unknown {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function parseApprovalRoles(
  value: string | null | undefined,
): ApprovalRole[] {
  const parsed = parseJson(value);

  if (!Array.isArray(parsed)) {
    return [...DEFAULT_APPROVAL_ROLES];
  }

  const roles = parsed.filter(
    (role): role is ApprovalRole =>
      typeof role === "string" && APPROVAL_ROLES.includes(role as ApprovalRole),
  );

  const uniqueRoles = [...new Set(roles)];

  return uniqueRoles.length > 0 ? uniqueRoles : [...DEFAULT_APPROVAL_ROLES];
}

export function parseRequiredFields(
  value: string | null | undefined,
): PermissionField[] {
  const parsed = parseJson(value);

  if (!Array.isArray(parsed)) {
    return [...DEFAULT_REQUIRED_FIELDS];
  }

  const fields = parsed.filter(
    (field): field is PermissionField =>
      typeof field === "string" &&
      PERMISSION_FIELDS.includes(field as PermissionField),
  );

  return fields.length > 0
    ? [...new Set(fields)]
    : [...DEFAULT_REQUIRED_FIELDS];
}

export function parseLabelMap<T extends string>(
  value: string | null | undefined,
  allowedKeys: readonly T[],
): Partial<Record<T, string>> {
  const parsed = parseJson(value);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }

  const result: Partial<Record<T, string>> = {};

  for (const key of allowedKeys) {
    const entry = (parsed as Record<string, unknown>)[key];

    if (typeof entry === "string" && entry.trim()) {
      result[key] = entry.trim();
    }
  }

  return result;
}

export function getPermissionTypeConfig(
  type: PermissionTypeConfigRow,
): PermissionTypeConfig {
  return {
    approvalRoles: parseApprovalRoles(type.approvalRoles),
    requiredFields: parseRequiredFields(type.requiredFields),
    fieldLabels: parseLabelMap(type.fieldLabels, PERMISSION_FIELDS),
    approvalLabels: parseLabelMap(type.approvalLabels, APPROVAL_ROLES),
    formGuide: type.formGuide?.trim() || null,
  };
}

export function hasField(
  config: PermissionTypeConfig,
  field: PermissionField,
): boolean {
  return config.requiredFields.includes(field);
}

/**
 * Visitors and deposit forms list only the requester, so the additional-student
 * picker is hidden and ignored by the server action for these types.
 */
export function requiresSingleStudent(config: PermissionTypeConfig): boolean {
  return (
    hasField(config, "visitorName") ||
    hasField(config, "depositItems") ||
    hasField(config, "departureTime") ||
    hasField(config, "returnTime")
  );
}

export function fieldLabel(
  config: PermissionTypeConfig,
  field: PermissionField,
): string {
  return config.fieldLabels[field] ?? FIELD_LABELS[field];
}

export function approvalLabelForRole(role: string): string {
  return isApprovalRole(role) ? APPROVAL_ROLE_LABELS[role] : "Penyetuju izin";
}

/** Approver labels are fixed, so admin-managed custom labels are ignored. */
export function approvalLabel(
  _config: PermissionTypeConfig,
  role: ApprovalRole,
): string {
  return approvalLabelForRole(role);
}

export function isApprovalRole(role: string): role is ApprovalRole {
  return APPROVAL_ROLES.includes(role as ApprovalRole);
}

export function serializeConfig(config: PermissionTypeConfig) {
  return {
    approvalRoles: JSON.stringify(config.approvalRoles),
    requiredFields: JSON.stringify(config.requiredFields),
    fieldLabels: JSON.stringify(config.fieldLabels),
    approvalLabels: JSON.stringify({}),
    formGuide: config.formGuide,
  };
}

type PdfPermissionType = {
  name: string;
  description: string;
  sortOrder: number;
  config: PermissionTypeConfig;
};

/**
 * Defaults follow the fields and signatories in Formulir Ijin Asrama.pdf.
 * Administrators can change every value from /admin/pengaturan-perizinan.
 */
export const PDF_PERMISSION_TYPES: PdfPermissionType[] = [
  {
    name: "Dispensasi Kegiatan Asrama",
    description:
      "Dispensasi mengikuti kegiatan akademik atau non-akademik di luar rutinitas asrama.",
    sortOrder: 0,
    config: {
      approvalRoles: [...DEFAULT_APPROVAL_ROLES],
      requiredFields: ["purpose", "startDate", "time", "place"],
      fieldLabels: {
        purpose: "Untuk (nama kegiatan)",
        startDate: "Hari / tanggal",
        time: "Waktu",
        place: "Tempat",
      },
      approvalLabels: {},
      formGuide:
        "Isi daftar siswa, Untuk, Hari/tanggal, Waktu, dan Tempat. Pengajuan dapat diputuskan oleh Guru atau Staff Pegawai; keputusan pertama akan menyelesaikan pengajuan.",
    },
  },
  {
    name: "Kunjungan Keluarga",
    description:
      "Izin menerima kunjungan keluarga untuk keperluan pribadi dan pemulihan psikologis siswa.",
    sortOrder: 10,
    config: {
      approvalRoles: [...DEFAULT_APPROVAL_ROLES],
      requiredFields: ["purpose", "startDate", "visitorName"],
      fieldLabels: {
        visitorName: "Yang datang",
        startDate: "Hari / tanggal",
        purpose: "Keperluan",
      },
      approvalLabels: {},
      formGuide:
        "Isi Nama, Grha, Hari/Tanggal, Yang Datang, dan Keperluan. Pengajuan dapat diputuskan oleh Guru atau Staff Pegawai; keputusan pertama akan menyelesaikan pengajuan.",
    },
  },
  {
    name: "Izin Keluar Asrama",
    description:
      "Izin keluar asrama atau sekolah untuk kegiatan pengembangan diri siswa.",
    sortOrder: 20,
    config: {
      approvalRoles: [...DEFAULT_APPROVAL_ROLES],
      requiredFields: ["purpose", "startDate", "time", "place"],
      fieldLabels: {
        purpose: "Untuk",
        startDate: "Hari / tanggal",
        time: "Waktu",
        place: "Tempat",
      },
      approvalLabels: {},
      formGuide:
        "Isi daftar siswa, Untuk, Hari/tgl, Waktu, dan Tempat. Pengajuan dapat diputuskan oleh Guru atau Staff Pegawai; keputusan pertama akan menyelesaikan pengajuan.",
    },
  },
  {
    name: "Izin Penggunaan HP",
    description:
      "Izin mengambil dan menggunakan HP untuk keperluan yang dinyatakan siswa.",
    sortOrder: 30,
    config: {
      approvalRoles: [...DEFAULT_APPROVAL_ROLES],
      requiredFields: ["phoneUse", "startDate", "time"],
      fieldLabels: {
        phoneUse: "Mengambil HP dan memanfaatkan untuk",
        startDate: "Hari / tanggal",
        time: "Waktu",
      },
      approvalLabels: {},
      formGuide:
        "Isi daftar siswa, keperluan Mengambil HP dan memanfaatkan untuk, Hari/tgl, serta Waktu. Pengajuan dapat diputuskan oleh Guru atau Staff Pegawai; keputusan pertama akan menyelesaikan pengajuan.",
    },
  },
  {
    name: "Izin Pulang",
    description:
      "Izin pulang ke rumah dengan tanggal kepulangan dan tanggal kedatangan kembali.",
    sortOrder: 40,
    config: {
      approvalRoles: [...DEFAULT_APPROVAL_ROLES],
      requiredFields: [
        "purpose",
        "startDate",
        "endDate",
        "departureTime",
        "returnTime",
      ],
      fieldLabels: {
        startDate: "Hari / tanggal kepulangan",
        endDate: "Hari / tanggal kedatangan",
        purpose: "Alasan / keperluan",
        departureTime: "Jam pulang",
        returnTime: "Jam kedatangan",
      },
      approvalLabels: {},
      formGuide:
        "Isi Nama, Kelas, Grha, Hari/Tanggal Kepulangan, Jam Pulang, Hari/Tanggal Kedatangan, Jam Kedatangan, dan Alasan/Keperluan. Pengajuan dapat diajukan paling lambat 1 hari sebelum akan melakukan dispensasi. Pengajuan dapat diputuskan oleh Guru atau Staff Pegawai; keputusan pertama akan menyelesaikan pengajuan.",
    },
  },
  {
    name: "Titipan Siswa",
    description:
      "Titipan makanan, minuman, barang, uang, atau obat untuk siswa di asrama.",
    sortOrder: 50,
    config: {
      approvalRoles: [...DEFAULT_APPROVAL_ROLES],
      requiredFields: ["depositItems"],
      fieldLabels: {
        depositItems: "Daftar barang titipan (1-10)",
      },
      approvalLabels: {},
      formGuide:
        "Isi daftar barang 1-10 dengan nama, jumlah, satuan, dan keterangan. Titipan makanan/minuman maksimal sekali per minggu per siswa per grha; uang dan obat wajib dicantumkan pada keterangan. Pengajuan dapat diputuskan oleh Guru atau Staff Pegawai; keputusan pertama akan menyelesaikan pengajuan.",
    },
  },
];

export function isApprovalRoleList(value: unknown): value is ApprovalRole[] {
  return (
    Array.isArray(value) &&
    value.length >= 1 &&
    value.length <= APPROVAL_ROLES.length &&
    value.every(isApprovalRole) &&
    new Set(value).size === value.length
  );
}

export function isPermissionFieldList(value: unknown): value is PermissionField[] {
  if (!Array.isArray(value) || value.length === 0) {
    return false;
  }

  return value.every(
    (field) =>
      typeof field === "string" &&
      PERMISSION_FIELDS.includes(field as PermissionField),
  );
}

export function pendingStatusForRole(role: Role):
  | "PENDING_MENTOR"
  | "PENDING_DORM_STAFF"
  | "PENDING_DORM_HEAD"
  | "PENDING_WAKASEK"
  | null {
  if (role === "PEMBINA") {
    return "PENDING_MENTOR";
  }

  if (role === "STAFF_ASRAMA") {
    return "PENDING_DORM_STAFF";
  }

  if (role === "KEPALA_ASRAMA") {
    return "PENDING_DORM_HEAD";
  }

  if (role === "WAKASEK_KESISWAAN") {
    return "PENDING_WAKASEK";
  }

  return null;
}
