"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Role } from "@/db/schema";

// The chat panel (and its code) loads only when someone opens it.
const AssistantPanel = dynamic(() => import("./assistant-panel"), { ssr: false });

/** Floating "Ask FoodBridge" button, above the mobile tab bar. */
export function AssistantLauncher({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // The full-screen assistant page has its own chat.
  if (pathname === "/assistant") return null;
  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed right-4 bottom-24 z-40 flex h-12 items-center gap-2 rounded-full bg-brand-950 pr-4 pl-3 text-sm font-semibold text-cream-50 shadow-raised hover:bg-brand-900 md:bottom-6"
          aria-haspopup="dialog"
        >
          <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5 text-accent-300">
            <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4L12 3ZM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
          </svg>
          Ask FoodBridge
        </button>
      )}
      {open && <AssistantPanel role={role} onClose={() => setOpen(false)} />}
    </>
  );
}
