export type PermissionRequestFormValues = {
  typeId: string;
  purpose: string;
  place: string;
  dateMode: "single" | "range";
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  mentorId: string;
  studentIds: string[];
};

export type PermissionRequestFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Partial<PermissionRequestFormValues>;
};

export const INITIAL_PERMISSION_REQUEST_FORM_STATE: PermissionRequestFormState =
  {
    status: "idle",
  };
