export const APP_ROLES = [
  "SISWA",
  "PEMBINA",
  "STAFF_ASRAMA",
  "STAFF_ASRAMA_TAMBAHAN",
  "KEPALA_ASRAMA",
  "WAKASEK_KESISWAAN",
  "ADMIN",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const STAFF_ROLES = [
  "PEMBINA",
  "STAFF_ASRAMA",
  "STAFF_ASRAMA_TAMBAHAN",
  "KEPALA_ASRAMA",
  "WAKASEK_KESISWAAN",
] as const satisfies readonly AppRole[];

export type StaffRole = (typeof STAFF_ROLES)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  SISWA: "Siswa",
  PEMBINA: "Pembina",
  STAFF_ASRAMA: "Staff Pegawai",
  STAFF_ASRAMA_TAMBAHAN: "Staff Asrama",
  KEPALA_ASRAMA: "Kepala Asrama",
  WAKASEK_KESISWAAN: "Wakasek Kesiswaan",
  ADMIN: "Administrator",
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  SISWA: "Mengajukan dan memantau izin asrama",
  PEMBINA: "Dapat ditentukan sebagai penyetuju izin",
  STAFF_ASRAMA: "Dapat ditentukan sebagai penyetuju izin",
  STAFF_ASRAMA_TAMBAHAN: "Dapat ditentukan sebagai penyetuju izin",
  KEPALA_ASRAMA: "Dapat ditentukan sebagai penyetuju izin",
  WAKASEK_KESISWAAN: "Dapat ditentukan sebagai penyetuju izin",
  ADMIN: "Mengelola akun dan pengaturan perizinan",
};

export function isAppRole(value: unknown): value is AppRole {
  return (
    typeof value === "string" &&
    (APP_ROLES as readonly string[]).includes(value)
  );
}

export function isStaffRole(role: AppRole): role is StaffRole {
  return (STAFF_ROLES as readonly AppRole[]).includes(role);
}

/** Pilihan peran tenaga pendidik untuk template dan impor Excel. */
export const STAFF_ROLE_OPTIONS = STAFF_ROLES.map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}));

/** Menerima label ("Pembina") maupun nilai peran ("PEMBINA"). */
export function staffRoleFromLabel(value: string): StaffRole | null {
  const normalized = value.trim().toLowerCase();

  return (
    STAFF_ROLES.find(
      (role) =>
        ROLE_LABELS[role].toLowerCase() === normalized ||
        role.toLowerCase() === normalized,
    ) ?? null
  );
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

const STUDENT_ONLY_PREFIXES = ["/request-izin", "/riwayat-request"];
const STAFF_ONLY_PREFIXES = ["/permintaan-izin", "/riwayat-approval"];
const ADMIN_ONLY_PREFIXES = ["/admin"];

/**
 * Optimistic route policy used by the proxy. Server components and server
 * actions still enforce authorization against the database.
 */
export function canRoleAccessPath(role: AppRole, pathname: string): boolean {
  if (ADMIN_ONLY_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return role === "ADMIN";
  }

  if (STUDENT_ONLY_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return role === "SISWA";
  }

  if (STAFF_ONLY_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return isStaffRole(role);
  }

  return true;
}
