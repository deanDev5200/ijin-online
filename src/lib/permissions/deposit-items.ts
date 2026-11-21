export const MAX_DEPOSIT_ITEMS = 10;

export type DepositItem = {
  name: string;
  quantity: string;
  unit: string;
  note: string;
};

export const EMPTY_DEPOSIT_ITEMS: DepositItem[] = Array.from(
  { length: MAX_DEPOSIT_ITEMS },
  () => ({ name: "", quantity: "", unit: "", note: "" }),
);

function readString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Reads the fixed 1-10 item rows from a submitted Titipan form. */
export function readDepositItemsFormData(formData: FormData): DepositItem[] {
  return Array.from({ length: MAX_DEPOSIT_ITEMS }, (_, index) => ({
    name: readString(formData.get(`depositItems[${index}].name`)),
    quantity: readString(formData.get(`depositItems[${index}].quantity`)),
    unit: readString(formData.get(`depositItems[${index}].unit`)),
    note: readString(formData.get(`depositItems[${index}].note`)),
  }));
}

/** Fills missing rows so restored form state always renders ten inputs. */
export function normalizeDepositItems(
  items: DepositItem[] | null | undefined,
): DepositItem[] {
  const source = Array.isArray(items) ? items : [];

  return EMPTY_DEPOSIT_ITEMS.map((empty, index) => ({
    name: source[index]?.name ?? empty.name,
    quantity: source[index]?.quantity ?? empty.quantity,
    unit: source[index]?.unit ?? empty.unit,
    note: source[index]?.note ?? empty.note,
  }));
}

export function parseDepositItems(value: string | null): DepositItem[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((entry): entry is Record<string, unknown> =>
        Boolean(entry && typeof entry === "object"),
      )
      .map((entry) => ({
        name: typeof entry.name === "string" ? entry.name : "",
        quantity: typeof entry.quantity === "string" ? entry.quantity : "",
        unit: typeof entry.unit === "string" ? entry.unit : "",
        note: typeof entry.note === "string" ? entry.note : "",
      }))
      .slice(0, MAX_DEPOSIT_ITEMS);
  } catch {
    return [];
  }
}

export function compactDepositItems(items: DepositItem[]): DepositItem[] {
  return items.filter(
    (item) =>
      item.name ||
      item.quantity ||
      item.unit ||
      item.note,
  );
}

export function serializeDepositItems(items: DepositItem[]): string | null {
  const compact = compactDepositItems(items);

  return compact.length > 0 ? JSON.stringify(compact) : null;
}
