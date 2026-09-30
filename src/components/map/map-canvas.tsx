"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import { DEFAULT_CENTER, type LatLng } from "@/lib/geo";

/*
 * The real map (Leaflet + OpenStreetMap tiles). Never import this directly: use <LazyMap>, which
 * loads Leaflet only when a map scrolls into view, so it never slows down other pages.
 */

export type MarkerKind = "pickup" | "delivery" | "volunteer" | "donor" | "me" | "donor-live" | "ngo-live" | "volunteer-live" | "pin";

export type MapMarker = {
  id: string;
  point: LatLng;
  kind: MarkerKind;
  /** Short text on the pin (one or two characters). */
  glyph: string;
  title: string;
  /** Second line in the popup. */
  subtitle?: string;
  /** Link shown in the popup (same-site path). */
  href?: string;
  /** Approximate position: drawn faded, with a ~1 km circle. */
  approximate?: boolean;
  /** Live positions: accuracy circle in metres. */
  accuracy?: number | null;
};

export type MapCanvasProps = {
  markers: MapMarker[];
  /** Straight-line route through these points (Volunteer → Donor → NGO). */
  route?: LatLng[];
  /** Several independent lines (e.g. each delivery's pickup → NGO). */
  routes?: LatLng[][];
  /** Picking mode: tap the map (or drag the pin) to choose a point. */
  onPick?: (point: LatLng) => void;
  /** Re-fit the view to the markers whenever this changes (not on every live update). */
  fitKey?: string;
  className?: string;
};

const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Pin colours use the design tokens; Tailwind picks these class names up from this file. */
const PIN_CLASS: Record<MarkerKind, string> = {
  pickup: "bg-accent-500 text-brand-950",
  delivery: "bg-brand-700 text-white",
  volunteer: "bg-violet-600 text-white",
  donor: "bg-accent-200 text-brand-950",
  me: "bg-sky-600 text-white",
  "donor-live": "bg-accent-500 text-brand-950 ring-4 ring-accent-300/60",
  "ngo-live": "bg-brand-700 text-white ring-4 ring-brand-300/60",
  "volunteer-live": "bg-violet-600 text-white ring-4 ring-violet-300/70 animate-pulse",
  pin: "bg-tomato-500 text-white",
};

function icon(m: MapMarker) {
  const live = m.kind.endsWith("-live");
  return L.divIcon({
    className: "",
    iconSize: [34, 34],
    iconAnchor: live ? [17, 17] : [17, 34],
    popupAnchor: [0, live ? -17 : -34],
    html: live
      ? `<span class="grid size-[34px] place-items-center rounded-full border-2 border-white text-xs font-bold shadow-raised ${PIN_CLASS[m.kind]}">${m.glyph}</span>`
      : `<span class="grid size-[34px] place-items-center rounded-full rounded-br-none rotate-45 border-2 border-white shadow-raised ${PIN_CLASS[m.kind]}"><span class="-rotate-45 text-xs font-bold">${m.glyph}</span></span>`,
  });
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function popupHtml(m: MapMarker) {
  let html = `<strong>${escapeHtml(m.title)}</strong>`;
  if (m.subtitle) html += `<br><span style="color:#525b56">${escapeHtml(m.subtitle)}</span>`;
  if (m.href && m.href.startsWith("/")) html += `<br><a href="${escapeHtml(m.href)}" style="font-weight:600;color:#166442">Open →</a>`;
  return html;
}

export default function MapCanvas({ markers, route, routes, onPick, fitKey, className }: MapCanvasProps) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const pickRef = useRef(onPick);
  const fitted = useRef<string | undefined>(undefined);

  useEffect(() => {
    pickRef.current = onPick;
  }, [onPick]);

  // Create the map once.
  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false }).setView(
      [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
      12,
    );
    L.tileLayer(TILE_URL, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(m);
    m.on("click", (e: L.LeafletMouseEvent) => pickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng }));
    // Enable wheel zoom only after the user interacts, so scrolling the page never gets stuck on the map.
    m.once("focus", () => m.scrollWheelZoom.enable());
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
      layer.current = null;
      fitted.current = undefined;
    };
  }, []);

  // Redraw markers and the route whenever they change.
  useEffect(() => {
    const m = map.current;
    const group = layer.current;
    if (!m || !group) return;
    group.clearLayers();

    for (const line of [...(route ? [route] : []), ...(routes ?? [])]) {
      if (line.length < 2) continue;
      L.polyline(
        line.map((p) => [p.lat, p.lng] as L.LatLngTuple),
        { color: "#1a7d4f", weight: 4, opacity: 0.75, dashArray: "8 8" },
      ).addTo(group);
    }
    for (const mk of markers) {
      if (mk.approximate) {
        L.circle([mk.point.lat, mk.point.lng], { radius: 700, color: "#97a09a", weight: 1, fillOpacity: 0.06 }).addTo(group);
      }
      if (mk.accuracy && mk.accuracy > 25) {
        L.circle([mk.point.lat, mk.point.lng], { radius: Math.min(mk.accuracy, 2000), color: "#7c3aed", weight: 1, fillOpacity: 0.08 }).addTo(group);
      }
      const marker = L.marker([mk.point.lat, mk.point.lng], {
        icon: icon(mk),
        title: mk.title,
        opacity: mk.approximate ? 0.75 : 1,
        draggable: mk.kind === "pin" && !!pickRef.current,
        keyboard: true,
      });
      marker.bindPopup(popupHtml(mk));
      if (mk.kind === "pin") {
        marker.on("dragend", () => {
          const p = marker.getLatLng();
          pickRef.current?.({ lat: p.lat, lng: p.lng });
        });
      }
      marker.addTo(group);
    }

    const key = fitKey ?? markers.map((mk) => mk.id).join("|");
    if (fitted.current !== key && markers.length) {
      fitted.current = key;
      if (markers.length === 1) m.setView([markers[0].point.lat, markers[0].point.lng], Math.max(m.getZoom(), 15));
      else m.fitBounds(L.latLngBounds(markers.map((mk) => [mk.point.lat, mk.point.lng] as L.LatLngTuple)), { padding: [36, 36], maxZoom: 16 });
    }
  }, [markers, route, routes, fitKey]);

  return <div ref={el} className={className} role="application" aria-label="Map" tabIndex={0} />;
}
