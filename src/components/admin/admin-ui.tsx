import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Badge, Input, Select, type Option } from "@/components/ui";
import type { UserStatus } from "@/db/schema";
import { USER_STATUS_META } from "@/lib/admin/meta";
import { hasFilters, type AdminFilters } from "@/lib/admin/filters";
import { cn } from "@/lib/utils";

/** GET search/filter bar used above every admin table: search, status, location, date range. */
export function FilterBar({
  path,
  filters,
  statusOptions,
  searchPlaceholder,
  hidden = {},
  statusLabel = "Status",
  anyStatusLabel = "Any status",
  showLocation = true,
}: {
  path: string;
  filters: AdminFilters;
  statusOptions: readonly Option[];
  searchPlaceholder: string;
  /** Extra params to keep, e.g. the role tab. */
  hidden?: Record<string, string>;
  statusLabel?: string;
  anyStatusLabel?: string;
  showLocation?: boolean;
}) {
  const reset = Object.keys(hidden).length ? `${path}?${new URLSearchParams(hidden)}` : path;
  return (
    <form method="get" action={path} className="grid grid-cols-2 gap-3 border-b border-cream-200 bg-cream-50 p-4 sm:p-5 md:grid-cols-6 md:items-end">
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <Input label="Search" name="q" defaultValue={filters.q} placeholder={searchPlaceholder} className="col-span-2" />
      <Select
        label={statusLabel}
        name="status"
        options={[{ value: "", label: anyStatusLabel }, ...statusOptions]}
        defaultValue={filters.status ?? ""}
        className={showLocation ? undefined : "col-span-2 md:col-span-2"}
      />
      {showLocation && <Input label="Location" name="location" defaultValue={filters.location} placeholder="Area" />}
      <Input label="From" name="from" type="date" defaultValue={filters.fromRaw} />
      <Input label="To" name="to" type="date" defaultValue={filters.toRaw} />
      <div className="col-span-2 flex gap-2 md:col-span-6">
        <button type="submit" className="h-10 rounded-full bg-brand-950 px-5 text-sm font-semibold text-cream-50 hover:bg-brand-800">
          Apply filters
        </button>
        {hasFilters(filters) && (
          <Link href={reset} className="grid h-10 place-items-center rounded-full border border-brand-900/15 px-4 text-sm font-semibold text-brand-900 hover:bg-cream-100">
            Reset
          </Link>
        )}
      </div>
    </form>
  );
}

/** Horizontal tabs as links (role or type switch). */
export function Tabs({ items, current }: { items: { href: string; label: string; value: string; count?: number }[]; current: string }) {
  return (
    <nav aria-label="Views" className="-mx-1 mb-4 flex gap-1 overflow-x-auto px-1 pb-1">
      {items.map((t) => {
        const active = t.value === current;
        return (
          <Link
            key={t.value}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold",
              active ? "border-brand-950 bg-brand-950 text-cream-50" : "border-brand-900/10 bg-white text-ink-600 hover:bg-cream-100",
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={cn("rounded-full px-1.5 text-xs tabular-nums", active ? "bg-accent-400 text-brand-950" : "bg-cream-200 text-ink-600")}>
                {t.count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/** A lightweight responsive table: scrolls sideways on phones (and by keyboard, since it can take focus). */
export function Table({ head, children, empty, label = "Table" }: { head: ReactNode[]; children: ReactNode; empty?: ReactNode; label?: string }) {
  return (
    <div className="overflow-x-auto" role="region" aria-label={label} tabIndex={0}>
      <table className="w-full min-w-160 text-left text-sm">
        <thead className="bg-cream-50 text-xs tracking-wider text-ink-500 uppercase">
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col" className="px-4 py-3 font-semibold first:pl-6 last:pr-6">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-cream-200">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-4 py-3 align-top first:pl-6 last:pr-6", className)} {...props} />;
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const meta = USER_STATUS_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function ResultNote({ count, limit }: { count: number; limit: number }) {
  return (
    <p className="border-t border-cream-200 px-6 py-3 text-xs text-ink-500" role="status">
      {count >= limit ? `Showing the latest ${limit}. Narrow the filters to find older records.` : `${count} result${count === 1 ? "" : "s"}`}
    </p>
  );
}
