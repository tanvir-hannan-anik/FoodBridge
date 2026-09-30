"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { distanceKm, formatDistance } from "@/lib/geo";
import { OVERVIEW_LAYER_LABEL, type OverviewLayer, type OverviewMapData } from "@/lib/location/meta";
import { cn } from "@/lib/utils";
import { LazyMap } from "./lazy-map";
import type { MapMarker, MarkerKind } from "./map-canvas";

const LAYER_STYLE: Record<OverviewLayer, { kind: MarkerKind; glyph: string; dot: string }> = {
  donor: { kind: "donor", glyph: "D", dot: "bg-accent-200 ring-1 ring-accent-500" },
  donation: { kind: "pickup", glyph: "F", dot: "bg-accent-500" },
  ngo: { kind: "delivery", glyph: "N", dot: "bg-brand-700" },
  volunteer: { kind: "volunteer", glyph: "V", dot: "bg-violet-600" },
};

/** The role "Map" page: every relevant donor, NGO, volunteer and food pickup, with layer toggles. */
export function OverviewMap({ data }: { data: OverviewMapData }) {
  const [hidden, setHidden] = useState<Set<OverviewLayer>>(new Set());
  const counts = useMemo(() => {
    const c = {} as Record<OverviewLayer, number>;
    for (const l of data.layers) c[l] = 0;
    for (const p of data.points) c[p.layer] = (c[p.layer] ?? 0) + 1;
    return c;
  }, [data]);

  const visible = data.points.filter((p) => !hidden.has(p.layer));
  const markers: MapMarker[] = [
    ...visible.map((p) => ({
      id: p.id,
      point: p.point,
      kind: LAYER_STYLE[p.layer].kind,
      glyph: LAYER_STYLE[p.layer].glyph,
      title: p.title,
      subtitle: p.subtitle,
      href: p.href,
      approximate: p.approximate,
    })),
    ...(data.me ? [{ id: "me", point: data.me, kind: "me" as const, glyph: "★", title: "You", subtitle: "Your saved location" }] : []),
  ];
  const nearest = data.me
    ? visible
        .filter((p) => p.href)
        .map((p) => ({ ...p, km: distanceKm(data.me, p.point) }))
        .sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity))
        .slice(0, 8)
    : [];

  function toggle(layer: OverviewLayer) {
    setHidden((h) => {
      const next = new Set(h);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Show on map">
        {data.layers.map((layer) => {
          const on = !hidden.has(layer);
          return (
            <button
              key={layer}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(layer)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold",
                on ? "border-brand-600 bg-brand-50 text-brand-900" : "border-cream-300 bg-white text-ink-500",
              )}
            >
              <span aria-hidden className={cn("size-2.5 rounded-full", LAYER_STYLE[layer].dot, !on && "opacity-40")} />
              {OVERVIEW_LAYER_LABEL[layer]} <span className="text-ink-500">({counts[layer] ?? 0})</span>
            </button>
          );
        })}
      </div>

      {markers.length ? (
        <LazyMap markers={markers} routes={hidden.has("donation") ? [] : data.routes} fitKey={data.points.length ? "all" : "me"} className="h-[28rem] sm:h-[32rem]" />
      ) : (
        <p className="rounded-2xl bg-cream-100 px-4 py-10 text-center text-sm text-ink-500">Nothing to show on the map yet.</p>
      )}

      <p className="text-xs text-ink-500">
        Tap a pin for details. Dashed lines join a pickup to its delivery point. Faded pins with a circle are approximate (about 1 km) to protect
        private homes.
        {!data.me && (
          <>
            {" "}
            <Link href="/profile" className="font-semibold text-brand-700 hover:underline">
              Set your location
            </Link>{" "}
            to see distances.
          </>
        )}
      </p>

      {nearest.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-brand-950">Nearest to you</h2>
          <ul className="divide-y divide-cream-200 rounded-2xl border border-cream-200 bg-white">
            {nearest.map((p) => (
              <li key={p.id}>
                <Link href={p.href!} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-cream-50">
                  <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", LAYER_STYLE[p.layer].dot)} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-brand-950">{p.title}</span>
                    {p.subtitle && <span className="block truncate text-xs text-ink-500">{p.subtitle}</span>}
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-ink-600">{formatDistance(p.km)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
