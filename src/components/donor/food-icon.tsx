import type { FoodCategory } from "@/db/schema";
import { cn } from "@/lib/utils";

const ICON: Record<FoodCategory, { path: string; tone: string }> = {
  cooked: {
    path: "M3 12h18a9 9 0 0 1-18 0ZM8 8c0-1.5 1-2 1-3.5M12 8c0-1.5 1-2 1-3.5M16 8c0-1.5 1-2 1-3.5",
    tone: "bg-accent-100 text-accent-700",
  },
  bakery: {
    path: "M4 14a4 4 0 0 1 2-7.5 5 5 0 0 1 6-2 5 5 0 0 1 6 2A4 4 0 0 1 20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2ZM9 11v5M15 11v5M12 10v6",
    tone: "bg-[#f7e6d0] text-[#9a5b1c]",
  },
  packaged: {
    path: "M3 7.5 12 3l9 4.5v9L12 21l-9-4.5ZM3 7.5 12 12l9-4.5M12 12v9",
    tone: "bg-sky-50 text-sky-700",
  },
  raw: {
    path: "M5 20c0-6 3-12 7-16 4 4 7 10 7 16M12 4v16M8.5 12l3.5 3M15.5 10 12 13",
    tone: "bg-brand-50 text-brand-700",
  },
  fruits_veg: {
    path: "M12 7c-3-2-8-1-8 5s4 9 6 9c1 0 1.5-.5 2-.5s1 .5 2 .5c2 0 6-3 6-9s-5-7-8-5ZM12 7c0-2 1-4 3-4",
    tone: "bg-red-50 text-red-600",
  },
  dairy: {
    path: "M8 3h8M9 3v3l-2 3v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9l-2-3V3M7 13h10",
    tone: "bg-indigo-50 text-indigo-600",
  },
  other: {
    path: "M4 10h16l-1.6 8.2a2 2 0 0 1-2 1.8H7.6a2 2 0 0 1-2-1.8ZM8 10l3-6M16 10l-3-6",
    tone: "bg-cream-100 text-brand-800",
  },
};

export function FoodIcon({ category, className }: { category: FoodCategory; className?: string }) {
  const icon = ICON[category];
  return (
    <span aria-hidden className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", icon.tone, className)}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5.5"
      >
        <path d={icon.path} />
      </svg>
    </span>
  );
}
