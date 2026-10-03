"use client";

import { useState, useTransition } from "react";
import { saveMyLocation } from "@/app/actions/volunteer";
import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

/**
 * Volunteer's "I'm here now": asks the browser for the current position ONCE and saves it, so the
 * nearest pickups are offered first. No background tracking.
 */
export function LocateMe({ locatedAt, hasLocation }: { locatedAt: Date | null; hasLocation: boolean }) {
  const { t, relative } = useI18n();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ error?: boolean; text: string } | null>(null);

  function locate() {
    if (!("geolocation" in navigator)) {
      setMessage({ error: true, text: t("This browser can’t share location. Set a pin on your profile instead.") });
      return;
    }
    setMessage({ text: t("Finding you…") });
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        start(async () => {
          const res = await saveMyLocation(pos.coords.latitude, pos.coords.longitude);
          setMessage(res?.message ? { error: true, text: t(res.message) } : { text: t("Location updated. Nearby pickups come to you first.") });
        }),
      (err) =>
        setMessage({
          error: true,
          text: t(err.code === err.PERMISSION_DENIED ? "Location permission was denied." : "Couldn’t get your location. Try again."),
        }),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <button
        type="button"
        onClick={locate}
        disabled={pending}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-cream-50/25 px-4 font-semibold text-cream-50 hover:bg-cream-50/10 disabled:opacity-60"
      >
        <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
          <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
          <circle cx="12" cy="9.5" r="2.5" />
        </svg>
        {t(pending ? "Saving…" : "Update my location")}
      </button>
      <span className={cn("text-xs", message?.error ? "font-medium text-red-300" : "text-brand-200")} aria-live="polite">
        {message?.text ??
          (locatedAt
            ? t("Location from {time}", { time: relative(locatedAt) })
            : t(hasLocation ? "Using your profile pin" : "No location yet: tasks aren’t sorted by distance"))}
      </span>
    </div>
  );
}
