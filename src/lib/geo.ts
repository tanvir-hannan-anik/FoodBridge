/**
 * Minimal location maths, safe for client and server. Distances are straight-line ("as the crow
 * flies"): good enough to rank nearby food and volunteers without a routing service.
 */

export type LatLng = { lat: number; lng: number };

/** Dhaka, where FoodBridge starts; the map's default view when nothing is pinned yet. */
export const DEFAULT_CENTER: LatLng = { lat: 23.7808, lng: 90.3992 };

export function isLatLng(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

/** Builds a point from nullable columns (null if either half is missing). */
export function toPoint(lat: number | null | undefined, lng: number | null | undefined): LatLng | null {
  return isLatLng(lat, lng) ? { lat: lat as number, lng: lng as number } : null;
}

/** Great-circle distance in km (haversine). Null if either point is unknown. */
export function distanceKm(a: LatLng | null | undefined, b: LatLng | null | undefined): number | null {
  if (!a || !b) return null;
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Sums the legs of a route, skipping unknown points. Null if fewer than two points are known. */
export function routeKm(points: (LatLng | null | undefined)[]): number | null {
  const known = points.filter((p): p is LatLng => !!p);
  if (known.length < 2) return null;
  let total = 0;
  for (let i = 1; i < known.length; i++) total += distanceKm(known[i - 1], known[i])!;
  return total;
}

/** "650 m", "3.4 km", "12 km". */
export function formatDistance(km: number | null | undefined) {
  if (km === null || km === undefined) return null;
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

/** Rough city travel time by motorbike/rickshaw (~15 km/h door to door, straight line × 1.3). */
export function travelMinutes(km: number | null | undefined) {
  if (km === null || km === undefined) return null;
  return Math.max(2, Math.round(((km * 1.3) / 15) * 60));
}

const coords = (p: LatLng) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;

/** Opens a place in Google Maps (pin if known, else an address search). */
export function mapSearchUrl(point: LatLng | null, address?: string | null) {
  const query = point ? coords(point) : (address ?? "");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

type Stop = { point: LatLng | null; address?: string | null };

const stop = (s: Stop) => (s.point ? coords(s.point) : (s.address ?? ""));

/**
 * Turn-by-turn navigation in Google Maps (opens the app on phones). Without an origin it starts
 * from the device's current position. Waypoints give the Volunteer → Donor → NGO route.
 */
export function directionsUrl({ origin, destination, waypoints = [] }: { origin?: Stop; destination: Stop; waypoints?: Stop[] }) {
  const params = new URLSearchParams({ api: "1", destination: stop(destination), travelmode: "driving" });
  if (origin && stop(origin)) params.set("origin", stop(origin));
  const via = waypoints.map(stop).filter(Boolean);
  if (via.length) params.set("waypoints", via.join("|"));
  return `https://www.google.com/maps/dir/?${params}`;
}
