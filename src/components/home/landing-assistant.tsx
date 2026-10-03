"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { Role } from "@/db/schema";
import { useI18n } from "@/components/i18n-provider";
import { encodeDraft, type DonationDraft } from "@/lib/ai/schemas";
import { CATEGORY_LABEL, CONDITION_LABEL, UNIT_LABEL } from "@/lib/donations/meta";
import { cn } from "@/lib/utils";

/*
 * "FoodBridge Helper" on the public site: a chat that helps a visitor donate, step by step
 * (LangGraph agent behind /api/assistant/guest). The conversation and draft stay in this browser
 * tab (sessionStorage); when the draft is complete the visitor opens the pre-filled donation form.
 * Other parts of the page open it with: window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: "message" })).
 */

export const OPEN_EVENT = "fb:open-assistant";
const STORE = "fb-guest-chat";
const TOTAL_STEPS = 9;

type Step = "ask" | "fix" | "confirm" | "done";
type Msg = { id: number; role: "user" | "assistant"; content: string; error?: boolean; step?: Step | null; sources?: string[] };
type Saved = { messages: Msg[]; draft: DonationDraft | null; asked: string | null };

const QUICK = [
  "I have leftover food to donate",
  "How does FoodBridge work?",
  "We are an NGO. How do we get food?",
  "How can I volunteer?",
];

export function LandingAssistant({ role }: { role: Role | null }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [chat, setChat] = useState<Saved>({ messages: [], draft: null, asked: null });
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const seq = useRef(1);

  // Restore this tab's conversation.
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE) ?? "null") as Saved | null;
      if (saved?.messages?.length) {
        seq.current = Math.max(...saved.messages.map((m) => m.id)) + 1;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from the browser
        setChat(saved);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORE, JSON.stringify(chat));
    } catch {}
  }, [chat]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [chat.messages, busy, open]);

  useEffect(() => {
    if (open && !busy) field.current?.focus();
  }, [open, busy]);

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || busy) return;
      const history = chat.messages.filter((m) => !m.error).slice(-12).map(({ role: r, content }) => ({ role: r, content }));
      const userMsg: Msg = { id: seq.current++, role: "user", content: message };
      setChat((c) => ({ ...c, messages: [...c.messages, userMsg] }));
      setInput("");
      setBusy(true);
      try {
        const res = await fetch("/api/assistant/guest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, history, draft: chat.draft, asked: chat.asked }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
        setChat((c) => ({
          messages: [...c.messages, { id: seq.current++, role: "assistant", content: data.reply, step: data.step, sources: data.sources }],
          draft: data.draft ?? c.draft,
          asked: data.asked ?? null,
        }));
      } catch (error) {
        const content = error instanceof Error ? error.message : "Something went wrong. Please try again.";
        setChat((c) => ({ ...c, messages: [...c.messages, { id: seq.current++, role: "assistant", content, error: true }] }));
      } finally {
        setBusy(false);
      }
    },
    [busy, chat],
  );

  // Buttons elsewhere on the page open the chat (optionally with a first message).
  useEffect(() => {
    const onOpen = (e: Event) => {
      setOpen(true);
      const text = (e as CustomEvent<string | undefined>).detail;
      if (text) void send(text);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, [send]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  function restart() {
    seq.current = 1;
    setChat({ messages: [], draft: null, asked: null });
  }

  const filled = chat.draft ? TOTAL_STEPS - Math.min(TOTAL_STEPS, chat.draft.missing.length) : 0;
  const donating = !!chat.draft && chat.messages.at(-1)?.step !== "done";

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="group fixed right-4 bottom-4 z-40 flex h-14 items-center gap-2.5 rounded-full bg-accent-400 pr-5 pl-2 text-sm font-semibold text-night-950 shadow-[0_16px_40px_-12px_rgb(246_177_58/0.7)] transition-transform hover:-translate-y-0.5 sm:right-6 sm:bottom-6"
        >
          <span className="relative grid size-10 place-items-center rounded-full bg-night-950 text-accent-300">
            <ChatIcon className="size-5" />
            <span aria-hidden className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-brand-400 ring-2 ring-accent-400" />
          </span>
          {t("Donate with our helper")}
        </button>
      )}

      {open && (
        <section
          role="dialog"
          aria-label={t("FoodBridge Helper")}
          className="fixed inset-x-2 bottom-2 z-50 flex max-h-[88dvh] flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-night-900 text-mist-200 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.9)] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[25rem]"
        >
          <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-night-950 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-400 text-night-950">
                <ChatIcon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-lg leading-tight font-semibold text-cream-50">{t("FoodBridge Helper")}</p>
                <p className="flex items-center gap-1.5 truncate text-xs text-mist-300">
                  <span aria-hidden className="size-1.5 rounded-full bg-brand-400" />
                  {t("AI assistant · helps you donate food")}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {chat.messages.length > 0 && (
                <button type="button" onClick={restart} className="rounded-full px-2.5 py-1 text-xs text-mist-300 hover:bg-white/10 hover:text-cream-50">
                  {t("Start over")}
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("Close chat")}
                className="grid size-9 place-items-center rounded-full text-mist-300 hover:bg-white/10 hover:text-cream-50"
              >
                <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
          </header>

          {donating && (
            <div className="border-b border-white/10 px-4 py-2.5">
              <div className="flex items-center justify-between text-[11px] text-mist-300">
                <span>{t("Donation details")}</span>
                <span>{t("{a} of {b}", { a: filled, b: TOTAL_STEPS })}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-accent-400 transition-all duration-500" style={{ width: `${(filled / TOTAL_STEPS) * 100}%` }} />
              </div>
            </div>
          )}

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            <Bubble role="assistant">
              {t("Hello! 👋 I’m the FoodBridge Helper. Have some food left over? Tell me about it and I’ll fill in the donation form for you, one question at a time. You can also ask me anything about FoodBridge.")}
            </Bubble>
            {chat.messages.length === 0 && (
              <div className="flex flex-col gap-2 pt-1">
                {QUICK.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void send(t(q))}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-left text-sm text-cream-100 transition-colors hover:border-accent-400/50 hover:bg-accent-400/10"
                  >
                    {t(q)}
                  </button>
                ))}
              </div>
            )}
            {chat.messages.map((m) => (
              <Bubble key={m.id} role={m.role} error={m.error}>
                {m.error ? t(m.content) : m.content}
                {m.step === "done" && chat.draft && <ReadyCard draft={chat.draft} role={role} />}
                {!!m.sources?.length && <span className="mt-2 block text-[11px] text-mist-400">{t("From: {list}", { list: m.sources.join(" · ") })}</span>}
              </Bubble>
            ))}
            {busy && (
              <Bubble role="assistant">
                <span className="flex gap-1 py-1" aria-label={t("Thinking…")}>
                  {[0, 150, 300].map((delay) => (
                    <span key={delay} className="size-2 animate-bounce rounded-full bg-mist-300" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </span>
              </Bubble>
            )}
            <div ref={end} />
          </div>

          <form onSubmit={onSubmit} className="border-t border-white/10 bg-night-950 p-3">
            <div className="flex items-end gap-2">
              <label htmlFor="guest-assistant-input" className="sr-only">
                {t("Message")}
              </label>
              <textarea
                id="guest-assistant-input"
                ref={field}
                rows={1}
                value={input}
                maxLength={1000}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                placeholder={t("Type your message…")}
                className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-white/10 bg-night-900 px-3.5 py-2.5 text-sm text-cream-50 placeholder:text-mist-400 focus:border-accent-400 focus:ring-4 focus:ring-accent-400/20 focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label={t("Send")}
                className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-400 text-night-950 hover:bg-accent-300 disabled:opacity-40"
              >
                <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-center text-[10.5px] text-mist-400">{t("AI can make mistakes. You check the form before anything is posted.")}</p>
          </form>
        </section>
      )}
    </>
  );
}

function Bubble({ role, error, children }: { role: "user" | "assistant"; error?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("flex", role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line",
          role === "user"
            ? "rounded-br-md bg-accent-400 text-night-950"
            : error
              ? "rounded-bl-md bg-red-500/15 text-red-200"
              : "rounded-bl-md bg-white/[0.06] text-cream-100",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** The finished draft, with the way into the pre-filled donation form. */
function ReadyCard({ draft, role }: { draft: DonationDraft; role: Role | null }) {
  const { t, number } = useI18n();
  const form = `/donor/donate?draft=${encodeDraft(draft)}`;
  const hours = (h: number) => (h < 1 ? t("{n} min", { n: number(Math.round(h * 60)) }) : t("{n} h", { n: number(Math.round(h * 10) / 10) }));
  const rows: [string, string | null][] = [
    ["Food", draft.foodType],
    ["Amount", draft.quantity !== null ? `${number(draft.quantity)} ${draft.unit ? t(UNIT_LABEL[draft.unit]) : ""}` : null],
    ["Kind", draft.category ? t(CATEGORY_LABEL[draft.category]) : null],
    ["Condition", draft.condition ? t(CONDITION_LABEL[draft.condition]) : null],
    ["Good for", draft.bestBeforeInHours !== null ? hours(draft.bestBeforeInHours) : null],
    ["Pickup in", draft.pickupInMinutes !== null ? hours(draft.pickupInMinutes / 60) : null],
    ["Pickup at", draft.pickupAddress],
  ];
  return (
    <span className="mt-3 block rounded-xl border border-accent-400/30 bg-night-950/60 p-3">
      <span className="block text-[11px] font-semibold tracking-widest text-accent-300 uppercase">{t("Your donation form is ready")}</span>
      <span className="mt-2 block space-y-1 text-xs">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <span key={k} className="flex gap-2">
              <span className="w-20 shrink-0 text-mist-400">{t(k)}</span>
              <span className="text-cream-50">{v}</span>
            </span>
          ))}
      </span>
      {role === "donor" ? (
        <Link href={form} className="mt-3 flex h-10 items-center justify-center rounded-full bg-accent-400 text-sm font-semibold text-night-950 hover:bg-accent-300">
          {t("Open my donation form")} →
        </Link>
      ) : role ? (
        <span className="mt-3 block text-xs text-mist-300">{t("Log in with a donor account to post food.")}</span>
      ) : (
        <span className="mt-3 flex flex-col gap-2">
          <Link
            href={`/register?role=donor&next=${encodeURIComponent(form)}`}
            className="flex h-10 items-center justify-center rounded-full bg-accent-400 text-sm font-semibold text-night-950 hover:bg-accent-300"
          >
            {t("Create a free donor account")} →
          </Link>
          <Link
            href={`/login?next=${encodeURIComponent(form)}`}
            className="flex h-10 items-center justify-center rounded-full border border-white/15 text-sm font-semibold text-cream-50 hover:bg-white/10"
          >
            {t("I already have an account")}
          </Link>
        </span>
      )}
      <span className="mt-2 block text-[11px] text-mist-400">{t("You check everything and post it yourself.")}</span>
    </span>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
      <path d="M12 15s-3-1.7-3-3.8a1.7 1.7 0 0 1 3-1.1 1.7 1.7 0 0 1 3 1.1c0 2.1-3 3.8-3 3.8Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** A button anywhere on the page that opens the helper, optionally sending a first message. */
export function AssistantButton({ message, className, children }: { message?: string; className?: string; children: React.ReactNode }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: message }))}>
      {children}
    </button>
  );
}
