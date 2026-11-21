"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ListChecks } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  approvalLabel,
  type PermissionTypeConfig,
} from "@/lib/permissions/config";
import { cn } from "@/lib/utils";

export type DashboardPermissionType = {
  id: string;
  name: string;
  description: string | null;
  config: PermissionTypeConfig;
};

export function DashboardPermissionTypes({
  types,
}: {
  types: DashboardPermissionType[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
        className="h-10 w-full justify-between border-primary/20 bg-primary/5 px-3 text-sm font-medium text-primary hover:bg-primary/10"
      >
        <span className="flex items-center gap-2">
          <ListChecks className="size-4" />
          {isOpen ? "Sembunyikan jenis izin" : "Lihat jenis izin yang tersedia"}
        </span>
        {isOpen ? (
          <ChevronUp className="size-4" />
        ) : (
          <ChevronDown className="size-4" />
        )}
      </Button>

      {isOpen ? (
        <div className="space-y-3">
          {types.length === 0 ? (
            <p className="rounded-xl border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
              Belum ada jenis izin aktif.
            </p>
          ) : (
            types.map((type, index) => (
              <div
                key={type.id}
                className={cn(
                  "rounded-xl border p-3 transition-colors",
                  index === 0
                    ? "border-primary/20 bg-primary/5"
                    : "bg-background",
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{type.name}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {type.description ?? "Jenis izin asrama."}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {type.config.approvalRoles.map((role, stageIndex) => (
                    <Badge
                      key={role}
                      variant="secondary"
                      className="gap-1 py-0.5 text-[10px]"
                    >
                      <span>{stageIndex + 1}</span>
                      <span className="text-muted-foreground">·</span>
                      <span>{approvalLabel(type.config, role)}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed px-3 py-4 text-center text-xs leading-relaxed text-muted-foreground">
          Klik tombol di atas untuk melihat daftar jenis izin dan alur
          persetujuannya.
        </p>
      )}
    </div>
  );
}
