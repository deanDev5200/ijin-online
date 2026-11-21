import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-linear-to-br from-primary/[0.06] via-card to-card px-5 py-5 sm:px-6 sm:py-6">
      <div
        className="pointer-events-none absolute -top-12 -right-10 size-40 rounded-full bg-primary/[0.05]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-5 -right-3 size-24 rounded-full border border-primary/10"
        aria-hidden="true"
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <span
            className="mb-3 block h-1 w-9 rounded-full bg-linear-to-r from-primary to-primary/30"
            aria-hidden="true"
          />
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {children ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
