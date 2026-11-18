import type { AppRole } from "./roles";

export type SessionUser = {
  id: string;
  username: string;
  fullName: string;
  role: AppRole;
  mustChangePassword: boolean;
  nis: string | null;
  nip: string | null;
  grha: string | null;
  kelas: string | null;
};
