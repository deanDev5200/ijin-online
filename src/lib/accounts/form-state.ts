import type { ActionState } from "@/lib/form-state";

export type AccountFormValues = {
  role?: string;
  fullName?: string;
  username?: string;
  nis?: string;
  grha?: string;
  kelas?: string;
  nip?: string;
};

export type AccountActionState = ActionState & {
  values?: AccountFormValues;
};

export const INITIAL_ACCOUNT_ACTION_STATE: AccountActionState = {
  status: "idle",
};

export type ImportIssue = {
  row: number;
  message: string;
};

export type ImportAccountsResult = {
  created: number;
  totalRows: number;
  errors: ImportIssue[];
};

export type ImportAccountsState = AccountActionState & {
  result?: ImportAccountsResult;
};

export const INITIAL_IMPORT_ACCOUNTS_STATE: ImportAccountsState = {
  status: "idle",
};
