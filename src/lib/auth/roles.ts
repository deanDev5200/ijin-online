export const APP_ROLES = [
  "SISWA",
  "PEMBINA",
  "STAFF_ASRAMA",
  "KEPALA_ASRAMA",
  "ADMIN",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const STAFF_ROLES = [
  "PEMBINA",
  "STAFF_ASRAMA",
  "KEPALA_ASRAMA",
] as const satisfies readonly AppRole[];

export type StaffRole = (typeof STAFF_ROLES)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  SISWA: "Siswa",
  PEMBINA: "Pembina",
  STAFF_ASRAMA: "Staff Asrama",
  KEPALA_ASRAMA: "Kepala Asrama",
  ADMIN: "Administrator",
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  SISWA: "Mengajukan dan memantau izin asrama",
  PEMBINA: "Menyetujui izin tahap pertama",
  STAFF_ASRAMA: "Menyetujui izin tahap kedua",
  KEPALA_ASRAMA: "Menyetujui izin tahap akhir",
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
