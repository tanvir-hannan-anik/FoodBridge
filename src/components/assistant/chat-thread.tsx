"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Role } from "@/db/schema";
import { useI18n } from "@/components/i18n-provider";
import { encodeDraft, type DonationDraft, type NeedDraft } from "@/lib/ai/schemas";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "./use-assistant";

const QUICK: Record<Role, string[]> = {
  donor: ["What should I do next?", "I have 20 plates of chicken biryani cooked an hour ago", "What are the food-safety rules?"],
  ngo: ["What should I do next?", "We need rice meals for 40 children tonight in Mirpur", "How does matching work?"],
  volunteer: ["What should I do next?", "How do I accept or decline a pickup?", "How does live location work?"],
  admin: ["What needs my attention?", "Summarise my alerts", "How can I pause unsafe food?"],
};

const FIELD_LABEL: Record<string, string> = {
  foodType: "Food",
  category: "Category",
  quantity: "Quantity",
  unit: "Unit",
  condition: "Condition",
  preparedMinutesAgo: "Prepared (min ago)",
  bestBeforeInHours: "Best before (hours from now)",
  pickupInMinutes: "Pickup in (min)",
  pickupAddress: "Pickup address",
  instructions: "Instructions",
  people: "People to serve",
  area: "Area",
  address: "Delivery address",
  neededInHours: "Needed in (hours)",
  notes: "Notes",
};

/** Messages, draft cards, suggestions and the message box. Shared by the floating panel and the full-screen view. */
export function ChatThread({
  role,
  messages,
  busy,
  loading,
  onSend,
  onNavigate,
  wide = false,
}: {
  role: Role;
  messages: ChatMessage[];
  busy: boolean;
  loading: boolean;
  onSend: (text: string) => void;
  /** Called when a link inside the chat is followed (the panel closes itself). */
  onNavigate?: () => void;
  wide?: boolean;
}) {
  const [input, setInput] = useState("");
  const { t } = useI18n();
  const end = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);

  // Block body: newer browsers return a Promise from scrollIntoView, and an effect may only return a cleanup.
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages, busy]);

  useEffect(() => {
    if (!busy) field.current?.focus();
  }, [busy, loading]);

  function submit(text: string) {
    if (!text.trim() || busy) return;
    setInput("");
    onSend(text);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit(input);
  }

  const column = wide ? "mx-auto w-full max-w-3xl" : "";

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-4" aria-live="polite">
        <div className={cn("space-y-3", column)}>
          {loading && messages.length === 0 && <p className="py-8 text-center text-sm text-ink-500">{t("Loading…")}</p>}
          {!loading && messages.length === 0 && (
            <div className={cn("space-y-3", wide && "pt-8 sm:pt-16")}>
              {wide && <p className="font-display text-2xl font-semibold text-brand-950 sm:text-3xl">{t("How can I help?")}</p>}
              <p className="text-sm text-ink-700">
                {t(
                  role === "donor"
                    ? "I can answer questions about FoodBridge, fill in a donation for you, and sort out what needs your attention. Try:"
                    : role === "ngo"
                      ? "I can answer questions about FoodBridge, fill in a food request for you, and sort out what needs your attention. Try:"
                      : "I can answer questions about FoodBridge and sort out what needs your attention. Try:",
                )}
              </p>
              <div className={cn("flex flex-col gap-2", wide && "sm:grid sm:grid-cols-3")}>
                {QUICK[role].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => submit(t(q))}
                    className="rounded-2xl border border-cream-200 px-3 py-2 text-left text-sm text-brand-900 hover:bg-cream-50"
                  >
                    {t(q)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line",
                  m.role === "user" ? "bg-brand-600 text-white" : m.error ? "bg-red-50 text-red-700" : "bg-cream-100 text-ink-800",
                )}
              >
                {m.error ? t(m.content) : m.content}
                {m.data?.donationDraft && <DraftCard kind="donation" draft={m.data.donationDraft} onNavigate={onNavigate} />}
                {m.data?.needDraft && <DraftCard kind="need" draft={m.data.needDraft} onNavigate={onNavigate} />}
                {!!m.data?.suggestions?.length && (
                  <ul className="mt-2 space-y-1.5">
                    {m.data.suggestions.map((s, i) => (
                      <li key={i}>
                        {s.href ? (
                          <Link href={s.href} onClick={onNavigate} className="block rounded-xl bg-white px-3 py-2 hover:ring-1 hover:ring-brand-500">
                            <span className={cn("font-semibold", s.priority === "high" ? "text-accent-700" : "text-brand-950")}>{t(s.title)}</span>
                            <span className="block text-xs text-ink-500">{t(s.detail)}</span>
                          </Link>
                        ) : (
                          <span className="block rounded-xl bg-white px-3 py-2">
                            <span className="font-semibold text-brand-950">{t(s.title)}</span>
                            <span className="block text-xs text-ink-500">{t(s.detail)}</span>
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {!!m.data?.sources?.length && <p className="mt-2 text-[11px] text-ink-500">{t("From: {list}", { list: m.data.sources.join(" · ") })}</p>}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <span className="rounded-2xl bg-cream-100 px-3.5 py-2.5 text-sm text-ink-500">{t("Thinking…")}</span>
            </div>
          )}
          <div ref={end} />
        </div>
      </div>

      <form onSubmit={onSubmit} className="border-t border-cream-200 p-3">
        <div className={cn("flex items-end gap-2", column)}>
          <label htmlFor="assistant-input" className="sr-only">
            {t("Message")}
          </label>
          <textarea
            id="assistant-input"
            ref={field}
            rows={wide ? 2 : 1}
            value={input}
            maxLength={2000}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            placeholder={t("Ask a question or describe your food…")}
            className="max-h-40 min-h-11 flex-1 resize-none rounded-field border border-cream-300 px-3 py-2.5 text-sm focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/25"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="h-11 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {t("Send")}
          </button>
        </div>
      </form>
    </>
  );
}

function DraftCard({ kind, draft, onNavigate }: { kind: "donation" | "need"; draft: DonationDraft | NeedDraft; onNavigate?: () => void }) {
  const filled = Object.entries(draft).filter(([k, v]) => k !== "missing" && v !== null && v !== "");
  const href = kind === "donation" ? `/donor/donate?draft=${encodeDraft(draft)}` : `/ngo/requests/new?draft=${encodeDraft(draft)}`;
  const { t } = useI18n();
  return (
    <div className="mt-2 rounded-xl bg-white p-3">
      <p className="text-xs font-semibold tracking-widest text-ink-500 uppercase">{t(kind === "donation" ? "Donation draft" : "Food request draft")}</p>
      {filled.length > 0 && (
        <dl className="mt-1.5 space-y-0.5 text-xs">
          {filled.map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <dt className="w-32 shrink-0 text-ink-500">{t(FIELD_LABEL[k] ?? k)}</dt>
              <dd className="text-brand-950">{String(v)}</dd>
            </div>
          ))}
        </dl>
      )}
      {draft.missing.length > 0 && (
        <p className="mt-2 text-xs text-accent-700">{t("Still needed: {list}.", { list: draft.missing.map((m) => t(m)).join(", ") })}</p>
      )}
      <Link
        href={href}
        onClick={onNavigate}
        className="mt-2 inline-flex h-9 items-center rounded-full bg-brand-600 px-3 text-xs font-semibold text-white hover:bg-brand-700"
      >
        {t("Open the form with these details")} →
      </Link>
      <p className="mt-1 text-[11px] text-ink-500">{t("You check everything and post it yourself.")}</p>
    </div>
  );
}
