"use client";

import {
  normalizeDepositItems,
  type DepositItem,
} from "@/lib/permissions/deposit-items";
import { Input } from "@/components/ui/input";

const inputClassName = "h-9 px-2.5 text-sm";

export function DepositItemsField({
  initialItems,
}: {
  initialItems?: DepositItem[] | null;
}) {
  const items = normalizeDepositItems(initialItems);

  return (
    <div className="overflow-x-auto rounded-xl border bg-linear-to-br from-primary/[0.06] to-card">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr className="border-b bg-primary/5 text-left text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            <th className="w-12 px-3 py-2.5 text-center">No</th>
            <th className="px-3 py-2.5">Nama barang</th>
            <th className="w-28 px-3 py-2.5">Jumlah</th>
            <th className="w-32 px-3 py-2.5">Satuan</th>
            <th className="px-3 py-2.5">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="border-b last:border-0">
              <td className="px-3 py-2 text-center text-xs font-semibold text-primary">
                {index + 1}
              </td>
              <td className="px-3 py-2">
                <Input
                  aria-label={`Nama barang ${index + 1}`}
                  name={`depositItems[${index}].name`}
                  defaultValue={item.name}
                  placeholder="Contoh: Kue, obat, uang"
                  className={inputClassName}
                />
              </td>
              <td className="px-3 py-2">
                <Input
                  aria-label={`Jumlah barang ${index + 1}`}
                  name={`depositItems[${index}].quantity`}
                  defaultValue={item.quantity}
                  placeholder="1"
                  className={inputClassName}
                />
              </td>
              <td className="px-3 py-2">
                <Input
                  aria-label={`Satuan barang ${index + 1}`}
                  name={`depositItems[${index}].unit`}
                  defaultValue={item.unit}
                  placeholder="pcs"
                  className={inputClassName}
                />
              </td>
              <td className="px-3 py-2">
                <Input
                  aria-label={`Keterangan barang ${index + 1}`}
                  name={`depositItems[${index}].note`}
                  defaultValue={item.note}
                  placeholder="Opsional"
                  className={inputClassName}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
