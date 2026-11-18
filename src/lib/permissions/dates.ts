const dateOnlyFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export function formatDateOnly(date: Date): string {
  return dateOnlyFormatter.format(date);
}

export function formatDateRange(startDate: Date, endDate: Date): string {
  const start = startDate.toISOString().slice(0, 10);
  const end = endDate.toISOString().slice(0, 10);

  if (start === end) {
    return formatDateOnly(startDate);
  }

  return `${formatDateOnly(startDate)} – ${formatDateOnly(endDate)}`;
}

export function formatDateTime(date: Date): string {
  return `${dateTimeFormatter.format(date)} WIB`;
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime} – ${endTime}`;
}

/**
 * Builds a UTC midnight date for a `@db.Date` column so the calendar date is
 * never shifted by the server timezone.
 */
export function toDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Today's date in the school's timezone (WIB), formatted as YYYY-MM-DD. */
export function getTodayInJakarta(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const getPart = (type: "year" | "month" | "day") =>
    parts.find((part) => part.type === type)?.value ?? "01";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}

/** Adds calendar days to a YYYY-MM-DD value without timezone drift. */
export function addDaysToDateOnly(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

/** Number of inclusive calendar days between two YYYY-MM-DD values. */
export function countDaysInclusive(start: string, end: string): number {
  const startDate = new Date(`${start}T00:00:00.000Z`);
  const endDate = new Date(`${end}T00:00:00.000Z`);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 0;
  }

  return Math.floor((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1;
}
