"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { Role } from "@/db/schema";
import { ChatThread } from "./chat-thread";
import { useAssistant } from "./use-assistant";

/** The floating chat panel: continues the latest chat; "Full screen" opens the same chat with the history sidebar. */
export default function AssistantPanel({ role, onClose }: { role: Role; onClose: () => void }) {
  const chat = useAssistant("latest");
  const pathname = usePathname();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const fullScreen = `/assistant?${new URLSearchParams({ ...(chat.conversationId && { c: chat.conversationId }), from: pathname })}`;

  return (
    <section
      role="dialog"
      aria-label="FoodBridge assistant"
      className="fixed inset-x-2 bottom-2 z-50 flex max-h-[85dvh] flex-col overflow-hidden rounded-card border border-cream-200 bg-white shadow-raised sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-104"
    >
      <header className="flex items-start justify-between gap-3 bg-brand-950 px-4 py-3 text-cream-50">
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold">Ask FoodBridge</p>
          <p className="truncate text-xs text-brand-200">
            {chat.enabled ? "AI assistant · can make mistakes · never changes your data" : "Help mode (AI not configured)"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {chat.messages.length > 0 && (
            <button type="button" onClick={chat.newChat} className="rounded-full px-2 py-1 text-xs text-brand-200 hover:bg-cream-50/10">
              New chat
            </button>
          )}
          <Link
            href={fullScreen}
            onClick={onClose}
            aria-label="Open full screen"
            title="Full screen"
            className="grid size-8 place-items-center rounded-full hover:bg-cream-50/10"
          >
            <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-4.5">
              <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
            </svg>
          </Link>
          <button type="button" onClick={onClose} aria-label="Close assistant" className="grid size-8 place-items-center rounded-full hover:bg-cream-50/10">
            <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      </header>

      <ChatThread role={role} messages={chat.messages} busy={chat.busy} loading={chat.loading} onSend={chat.send} onNavigate={onClose} />
    </section>
  );
}
