"use client";

import { useState } from "react";
import { DEFAULT_CENTER, type LatLng } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { LazyMap } from "./lazy-map";

type Props = {
  label: string;
  hint?: string;
  /** Hidden input names sent with the form. */
  names?: { lat: string; lng: string };
  defaultValue?: LatLng | null;
  className?: string;
};

/**
 * Optional map pin for a form: "Use my current location" (asks the browser once, no tracking),
 * or open the map and tap / drag the pin. Sends two hidden inputs; empty = no pin.
 */
export function LocationPicker({ label, hint, names = { lat: "lat", lng: "lng" }, defaultValue = null, className }: Props) {
  const [point, setPoint] = useState<LatLng | null>(defaultValue);
  const [open, setOpen] = useState(false);
  // Re-centre the map only when the pin jumps (GPS), not on every tap or drag.
  const [jumps, setJumps] = useState(0);
  const [status, setStatus] = useState<{ tone: "info" | "error"; text: string } | null>(null);

  function useCurrent() {
    if (!("geolocation" in navigator)) {
      setStatus({ tone: "error", text: "This browser can’t share location. Pick the spot on the map instead." });
      setOpen(true);
      return;
    }
    setStatus({ tone: "info", text: "Finding you…" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setJumps((j) => j + 1);
        setStatus({ tone: "info", text: `Located within about ${Math.round(pos.coords.accuracy)} m. Drag the pin to fine-tune.` });
        setOpen(true);
      },
      (err) =>
        setStatus({
          tone: "error",
          text:
            err.code === err.PERMISSION_DENIED
              ? "Location permission was denied. You can still tap the spot on the map."
              : "Couldn’t get your location. Tap the spot on the map instead.",
        }),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  }

  return (
    <fieldset className={cn("space-y-3", className)}>
      <legend className="text-sm font-semibold text-brand-950">
        {label} <span className="font-normal text-ink-500">(optional)</span>
      </legend>
      <input type="hidden" name={names.lat} value={point ? point.lat.toFixed(6) : ""} />
      <input type="hidden" name={names.lng} value={point ? point.lng.toFixed(6) : ""} />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={useCurrent}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-brand-950 px-4 text-sm font-semibold text-cream-50 hover:bg-brand-900"
        >
          <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3m0 14v3M2 12h3m14 0h3" strokeLinecap="round" />
          </svg>
          Use my current location
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="h-10 rounded-full border border-brand-900/15 px-4 text-sm font-semibold text-brand-900 hover:bg-cream-100"
        >
          {open ? "Hide map" : point ? "Adjust on map" : "Pick on map"}
        </button>
        {point && (
          <button
            type="button"
            onClick={() => {
              setPoint(null);
              setStatus(null);
            }}
            className="h-10 rounded-full px-3 text-sm font-medium text-ink-500 hover:text-red-600"
          >
            Remove pin
          </button>
        )}
      </div>

      <p className="text-xs text-ink-500">
        {point ? (
          <span className="font-medium text-brand-800">
            📍 Pinned at {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
          </span>
        ) : (
          (hint ?? "A pin lets us show distances and find the nearest matches.")
        )}
      </p>
      {status && <p className={cn("text-xs", status.tone === "error" ? "font-medium text-red-600" : "text-ink-600")}>{status.text}</p>}

      {open && (
        <div>
          <LazyMap
            className="h-64 sm:h-72"
            markers={[{ id: "pin", point: point ?? DEFAULT_CENTER, kind: "pin", glyph: "•", title: point ? "Chosen location" : "Tap the map to place the pin" }]}
            fitKey={`${jumps}-${point ? "pinned" : "default"}`}
            onPick={(p) => {
              setPoint(p);
              setStatus(null);
            }}
          />
          <p className="mt-1.5 text-xs text-ink-500">Tap the map or drag the pin to the exact spot.</p>
        </div>
      )}
    </fieldset>
  );
}
