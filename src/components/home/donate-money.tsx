"use client";

import { useState } from "react";
import { formatCount, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Roughly what one taka buys: a simple meal costs about ৳50 to cook and deliver. */
const TAKA_PER_MEAL = 50;

/**
 * "Donate money": pick or type an amount. Payments aren't connected yet (bKash/Nagad/card later),
 * so the button only says so; nothing is charged or sent anywhere.
 */
export function DonateMoney({
  lang,
  amounts,
  labels,
}: {
  lang: Lang;
  amounts: number[];
  labels: { other: string; cta: string; soon: string; note: string; meals: string };
}) {
  const [amount, setAmount] = useState<number | null>(amounts[1] ?? null);
  const [custom, setCustom] = useState("");
  const [notice, setNotice] = useState(false);
  const value = custom ? Number(custom) : amount;
  const taka = (n: number) => `৳${formatCount(n, lang)}`;
  const meals = value && value > 0 ? Math.max(1, Math.floor(value / TAKA_PER_MEAL)) : 0;

  return (
    <div className="rounded-3xl border border-white/10 bg-night-950/70 p-5 sm:p-6">
      <div role="radiogroup" aria-label={labels.cta} className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {amounts.map((a) => {
          const on = !custom && amount === a;
          return (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                setAmount(a);
                setCustom("");
                setNotice(false);
              }}
              className={cn(
                "h-12 rounded-2xl border text-base font-semibold transition-colors",
                on ? "border-accent-400 bg-accent-400 text-night-950" : "border-white/10 bg-white/5 text-cream-50 hover:border-accent-400/50",
              )}
            >
              {taka(a)}
            </button>
          );
        })}
      </div>
      <label className="mt-3 flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 focus-within:border-accent-400 focus-within:ring-4 focus-within:ring-accent-400/20">
        <span className="text-mist-300">৳</span>
        <span className="sr-only">{labels.other}</span>
        <input
          inputMode="numeric"
          value={custom}
          onChange={(e) => {
            setCustom(e.target.value.replace(/\D/g, "").slice(0, 7));
            setNotice(false);
          }}
          placeholder={labels.other}
          className="w-full bg-transparent text-cream-50 placeholder:text-mist-400 focus:outline-none"
        />
      </label>
      <p className="mt-3 h-5 text-sm text-brand-200">{meals > 0 && labels.meals.replace("{n}", formatCount(meals, lang))}</p>
      <button
        type="button"
        onClick={() => setNotice(true)}
        disabled={!value || value <= 0}
        className="mt-2 inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-accent-400 px-6 font-semibold text-night-950 transition-all hover:-translate-y-0.5 hover:bg-accent-300 disabled:opacity-50 disabled:hover:translate-y-0"
      >
        <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="size-5">
          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
        </svg>
        {labels.cta}
        {value && value > 0 ? ` · ${taka(value)}` : ""}
      </button>
      <p role="status" className={cn("mt-3 text-sm", notice ? "rounded-2xl bg-accent-400/10 px-4 py-3 text-accent-100" : "text-mist-400")}>
        {notice ? labels.soon : labels.note}
      </p>
    </div>
  );
}
