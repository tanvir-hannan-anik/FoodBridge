"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Role } from "@/db/schema";
import { cn } from "@/lib/utils";
import { ChatThread } from "./chat-thread";
import { useAssistant, type ChatSummary } from "./use-assistant";

const DAY = 86_400_000;

/** Groups chats like a chat app: Today, Yesterday, Previous 7 days, Previous 30 days, Older. */
function groupChats(chats: ChatSummary[]) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const t = startOfToday.getTime();
  const groups: { label: string; items: ChatSummary[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 days", items: [] },
    { label: "Previous 30 days", items: [] },
    { label: "Older", items: [] },
  ];
  for (const c of chats) {
    const at = new Date(c.updatedAt).getTime();
    const i = at >= t ? 0 : at >= t - DAY ? 1 : at >= t - 7 * DAY ? 2 : at >= t - 30 * DAY ? 3 : 4;
    groups[i].items.push(c);
  }
  return groups.filter((g) => g.items.length);
}

/** Full-screen assistant: chat history on the left (Back, New chat, titled chats), the chat on the right. */
export function AssistantFullScreen({ role, initial, backHref }: { role: Role; initial: string; backHref: string }) {
  const chat = useAssistant(initial);
  const [drawer, setDrawer] = useState(false);

  // Keep the address bar on the open chat, so reload and sharing the tab work.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (chat.conversationId) url.searchParams.set("c", chat.conversationId);
    else url.searchParams.delete("c");
    window.history.replaceState(null, "", url);
  }, [chat.conversationId]);

  const current = chat.conversations.find((c) => c.id === chat.conversationId);

  const sidebar = (
    <nav aria-label="Chat history" className="flex h-full flex-col bg-brand-950 text-cream-50">
      <div className="space-y-2 p-3">
        <Link href={backHref} className="flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-brand-100 hover:bg-cream-50/10">
          <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to FoodBridge
        </Link>
        <button
          type="button"
          onClick={() => {
            chat.newChat();
            setDrawer(false);
          }}
          className="flex h-10 w-full items-center gap-2 rounded-xl border border-cream-50/15 px-3 text-sm font-semibold hover:bg-cream-50/10"
        >
          <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="size-4.5 text-accent-300">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {chat.conversations.length === 0 ? (
          <p className="px-3 py-6 text-sm text-brand-300">Your chats will appear here.</p>
        ) : (
          groupChats(chat.conversations).map((g) => (
            <div key={g.label} className="mt-3">
              <p className="px-3 pb-1 text-[11px] font-semibold tracking-widest text-brand-300 uppercase">{g.label}</p>
              <ul className="space-y-0.5">
                {g.items.map((c) => (
                  <ChatItem
                    key={c.id}
                    chat={c}
                    active={c.id === chat.conversationId}
                    onOpen={() => {
                      chat.open(c.id);
                      setDrawer(false);
                    }}
                    onRename={(title) => chat.rename(c.id, title)}
                    onDelete={() => {
                      if (window.confirm(`Delete “${c.title}”?`)) void chat.remove(c.id);
                    }}
                  />
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

      {chat.conversations.length > 0 && (
        <div className="border-t border-cream-50/10 p-3">
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Delete all your chats? This can’t be undone.")) void chat.remove();
            }}
            className="w-full rounded-xl px-3 py-2 text-left text-xs text-brand-300 hover:bg-cream-50/10 hover:text-cream-50"
          >
            Delete all chats
          </button>
        </div>
      )}
    </nav>
  );

  return (
    <div className="fixed inset-0 z-[70] flex bg-white">
      {/* Sidebar: fixed column on desktop, drawer on mobile */}
      <aside className="hidden w-72 shrink-0 md:block">{sidebar}</aside>
      {drawer && (
        <div className="fixed inset-0 z-10 flex md:hidden">
          <aside className="w-[82%] max-w-xs shadow-raised">{sidebar}</aside>
          <button type="button" aria-label="Close chat history" onClick={() => setDrawer(false)} className="flex-1 bg-brand-950/40" />
        </div>
      )}

      <section className="flex min-w-0 flex-1 flex-col" aria-label="FoodBridge assistant">
        <header className="flex items-center gap-2 border-b border-cream-200 px-3 py-2.5 sm:px-4">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Open chat history"
            className="grid size-9 place-items-center rounded-full text-brand-900 hover:bg-cream-100 md:hidden"
          >
            <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-5">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-semibold text-brand-950">{current?.title ?? "New chat"}</p>
            <p className="truncate text-xs text-ink-500">
              {chat.enabled ? "Ask FoodBridge · AI can make mistakes · never changes your data" : "Help mode (AI not configured)"}
            </p>
          </div>
          <Link
            href={backHref}
            aria-label="Exit full screen"
            title="Exit full screen"
            className="grid size-9 place-items-center rounded-full text-brand-900 hover:bg-cream-100"
          >
            <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-4.5">
              <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
            </svg>
          </Link>
        </header>

        <ChatThread role={role} messages={chat.messages} busy={chat.busy} loading={chat.loading} onSend={chat.send} wide />
      </section>
    </div>
  );
}

function ChatItem({
  chat,
  active,
  onOpen,
  onRename,
  onDelete,
}: {
  chat: ChatSummary;
  active: boolean;
  onOpen: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onRename(String(new FormData(e.currentTarget).get("title") ?? ""));
            setEditing(false);
          }}
        >
          <input
            name="title"
            defaultValue={chat.title}
            maxLength={80}
            autoFocus
            onBlur={(e) => {
              onRename(e.currentTarget.value);
              setEditing(false);
            }}
            onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
            aria-label="Chat name"
            className="h-9 w-full rounded-lg bg-cream-50 px-3 text-sm text-brand-950 focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
        </form>
      </li>
    );
  }

  return (
    <li className={cn("group flex items-center rounded-lg", active ? "bg-cream-50/15" : "hover:bg-cream-50/10")}>
      <button type="button" onClick={onOpen} title={chat.title} aria-current={active ? "page" : undefined} className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm">
        {chat.title}
      </button>
      <span className={cn("flex shrink-0 pr-1", active ? "opacity-100" : "opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100")}>
        <button type="button" onClick={() => setEditing(true)} aria-label={`Rename “${chat.title}”`} className="grid size-7 place-items-center rounded-md text-brand-200 hover:bg-cream-50/10">
          <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
            <path d="M4 20h4L19 9l-4-4L4 16v4ZM14 6l4 4" />
          </svg>
        </button>
        <button type="button" onClick={onDelete} aria-label={`Delete “${chat.title}”`} className="grid size-7 place-items-center rounded-md text-brand-200 hover:bg-cream-50/10">
          <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
            <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
          </svg>
        </button>
      </span>
    </li>
  );
}
