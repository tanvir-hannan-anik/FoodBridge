"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Role } from "@/db/schema";
import { directionsUrl, distanceKm, formatDistance, mapSearchUrl, travelMinutes, type LatLng } from "@/lib/geo";
import { LIVE_POLL_SECONDS, LIVE_SEND_SECONDS, type DeliveryView, type LivePosition } from "@/lib/location/meta";
import { useI18n } from "@/components/i18n-provider";
import type { I18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { LazyMap } from "./lazy-map";
import type { MapMarker, MarkerKind } from "./map-canvas";

const LIVE_KIND: Partial<Record<Role, MarkerKind>> = { donor: "donor-live", ngo: "ngo-live", volunteer: "volunteer-live" };
const ROLE_NAME: Record<Role, string> = { donor: "Donor", ngo: "NGO", volunteer: "Volunteer", admin: "Admin" };
/** Don't resend a position unless it moved at least this far (km) or LIVE_SEND_SECONDS passed. */
const MIN_MOVE_KM = 0.03;

type Sharing = { state: "off" } | { state: "starting" } | { state: "on"; since: number } | { state: "error"; message: string };

/**
 * Delivery map for donor, NGO, volunteer and admin: pickup → delivery, the volunteer, and anyone who
 * chose to share their live location. Positions refresh every LIVE_POLL_SECONDS while the page is
 * visible. Sharing needs the browser's permission, stops when you leave the page, and ends with the delivery.
 */
export function DeliveryMap({ initial, className }: { initial: DeliveryView; className?: string }) {
  const i18n = useI18n();
  const { t } = i18n;
  const [view, setView] = useState(initial);
  const [sharing, setSharing] = useState<Sharing>({ state: "off" });
  const [me, setMe] = useState<LatLng | null>(null);
  const watchId = useRef<number | null>(null);
  const lastSent = useRef<{ at: number; point: LatLng } | null>(null);
  const url = `/api/deliveries/${view.donationId}/location`;

  // Server data changes (e.g. status after an action): take the fresh snapshot.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with new server props
    setView(initial);
  }, [initial]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) setView((await res.json()) as DeliveryView);
    } catch {
      // Offline for a moment: keep showing the last positions.
    }
  }, [url]);

  // Poll only while a delivery is live and the tab is visible.
  useEffect(() => {
    if (!view.live) return;
    const tick = () => document.visibilityState === "visible" && refresh();
    const timer = window.setInterval(tick, LIVE_POLL_SECONDS * 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [view.live, refresh]);

  const stopWatching = useCallback(() => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    lastSent.current = null;
  }, []);

  const stopSharing = useCallback(async () => {
    stopWatching();
    setSharing({ state: "off" });
    setMe(null);
    await fetch(url, { method: "DELETE" }).catch(() => {});
    refresh();
  }, [stopWatching, url, refresh]);

  const startSharing = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setSharing({ state: "error", message: t("This browser can’t share location.") });
      return;
    }
    setSharing({ state: "starting" });
    watchId.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMe(point);
        const last = lastSent.current;
        const due = !last || Date.now() - last.at >= LIVE_SEND_SECONDS * 1000 || (distanceKm(last.point, point) ?? 0) >= MIN_MOVE_KM;
        if (!due) return;
        lastSent.current = { at: Date.now(), point };
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...point, accuracy: Math.round(pos.coords.accuracy) }),
        }).catch(() => null);
        if (res && res.status === 409) {
          // The delivery ended: stop quietly.
          stopWatching();
          setSharing({ state: "off" });
          refresh();
          return;
        }
        setSharing((s) => (s.state === "on" ? s : { state: "on", since: Date.now() }));
      },
      (err) => {
        stopWatching();
        setSharing({
          state: "error",
          message:
            err.code === err.PERMISSION_DENIED
              ? t("Location permission was denied. Allow it in your browser settings to share.")
              : t("Couldn’t get your location. Check GPS / location services and try again."),
        });
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 30_000 },
    );
  }, [url, stopWatching, refresh, t]);

  // Leaving the page stops sharing and deletes my position straight away.
  useEffect(
    () => () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        fetch(url, { method: "DELETE", keepalive: true }).catch(() => {});
      }
    },
    [url],
  );

  // The delivery finished while sharing: stop.
  useEffect(() => {
    if (!view.live && watchId.current !== null) void stopSharing();
  }, [view.live, stopSharing]);

  const others = view.positions.filter((p) => p.userId !== view.viewerId);
  const volunteerLive = view.positions.find((p) => p.role === "volunteer");
  const iAmVolunteer = view.viewerRole === "volunteer";
  // The volunteer's saved base is private: only they (and admins) see it. Others see live sharing only.
  const volunteerPoint: LatLng | null =
    (iAmVolunteer && me) || (volunteerLive && { lat: volunteerLive.lat, lng: volunteerLive.lng }) || (iAmVolunteer || view.viewerRole === "admin" ? (view.volunteer?.point ?? null) : null);
  const beforePickup = view.status === "MATCHED" || view.status === "ASSIGNED";

  const markers = useMemo(() => {
    const list: MapMarker[] = [];
    if (view.pickup.point) list.push({ id: "pickup", point: view.pickup.point, kind: "pickup", glyph: "D", title: t("Pickup: {name}", { name: view.pickup.name }) });
    if (view.delivery?.point) {
      list.push({ id: "delivery", point: view.delivery.point, kind: "delivery", glyph: "N", title: t("Delivery: {name}", { name: view.delivery.name }) });
    }
    for (const p of view.positions) {
      if (p.userId === view.viewerId && me) continue; // drawn from the device below, fresher
      const kind = LIVE_KIND[p.role];
      if (kind) {
        list.push({
          id: `live-${p.userId}`,
          point: p,
          kind,
          glyph: ROLE_NAME[p.role][0],
          title: t("{name} ({role}, live)", { name: p.name, role: t(ROLE_NAME[p.role]) }),
          accuracy: p.accuracy,
        });
      }
    }
    if (me) {
      const kind = LIVE_KIND[view.viewerRole] ?? "volunteer-live";
      list.push({ id: "me", point: me, kind, glyph: "•", title: t("You (live)") });
    } else if (iAmVolunteer || view.viewerRole === "admin") {
      if (!volunteerLive && view.volunteer?.point) {
        list.push({ id: "volunteer-base", point: view.volunteer.point, kind: "volunteer", glyph: "V", title: t("{name} (last known position)", { name: view.volunteer.name }) });
      }
    }
    return list;
  }, [view, me, iAmVolunteer, volunteerLive, t]);

  // Simple route: Volunteer → Donor → NGO before pickup; Volunteer → NGO after it.
  const route = [beforePickup ? volunteerPoint : null, beforePickup ? view.pickup.point : volunteerPoint ?? view.pickup.point, view.delivery?.point ?? null].filter(
    (p): p is LatLng => !!p,
  );
  const toPickup = distanceKm(volunteerPoint, view.pickup.point);
  const pickupToNgo = distanceKm(view.pickup.point, view.delivery?.point);
  const toNgo = distanceKm(volunteerPoint, view.delivery?.point);
  const fitKey = [view.pickup.point, view.delivery?.point].map((p) => (p ? `${p.lat},${p.lng}` : "-")).join("|");
  const anythingToShow = markers.length > 0;

  return (
    <div className={cn("space-y-4", className)}>
      {anythingToShow ? (
        <LazyMap markers={markers} route={route} fitKey={fitKey} />
      ) : (
        <p className="rounded-2xl bg-cream-100 px-4 py-6 text-center text-sm text-ink-500">
          {t("No map pins yet. Addresses are shown below; pins appear once donors and NGOs set their location.")}
        </p>
      )}

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-600" aria-label={t("Map legend")}>
        <Legend className="bg-accent-500" label={`${t("Pickup")} · ${view.pickup.name}`} />
        {view.delivery && <Legend className="bg-brand-700" label={`${t("Delivery")} · ${view.delivery.name}`} />}
        {view.volunteer && <Legend className="bg-violet-600" label={`${t("Volunteer")} · ${view.volunteer.name}`} />}
      </ul>

      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
        {beforePickup && <Metric label={t("Volunteer → pickup")} km={toPickup} i18n={i18n} />}
        {!beforePickup && view.live && <Metric label={t("Volunteer → NGO")} km={toNgo} i18n={i18n} />}
        <Metric label={t("Donor → NGO")} km={pickupToNgo} i18n={i18n} />
      </dl>

      <div className="flex flex-wrap gap-2">
        {iAmVolunteer && view.delivery && (
          <NavLink
            primary
            href={directionsUrl({
              destination: { point: view.delivery.point, address: view.delivery.address },
              waypoints: beforePickup ? [{ point: view.pickup.point, address: view.pickup.address }] : [],
            })}
            label={t(beforePickup ? "Route: you → donor → NGO" : "Navigate to NGO")}
          />
        )}
        <NavLink href={mapSearchUrl(view.pickup.point, view.pickup.address)} label={t("Open pickup in Maps")} />
        {view.delivery && (
          <NavLink href={mapSearchUrl(view.delivery.point, view.delivery.address)} label={t("Open delivery in Maps")} />
        )}
      </div>

      {view.live && (
        <section className="rounded-2xl border border-cream-200 bg-cream-50 p-4" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-semibold text-brand-950">
                <span aria-hidden className={cn("size-2.5 rounded-full", view.positions.length ? "animate-pulse bg-brand-500" : "bg-ink-300")} />
                {t("Live location")}
              </p>
              <p className="text-xs text-ink-500">
                {others.length
                  ? others.map((p) => livedLabel(p, i18n)).join(" · ")
                  : view.viewerRole === "volunteer"
                    ? t("Share yours so the donor and NGO can see you coming.")
                    : t("Nobody is sharing right now. You’ll see the volunteer here if they share.")}
              </p>
            </div>
            {view.canShare &&
              (sharing.state === "on" || sharing.state === "starting" ? (
                <button
                  type="button"
                  onClick={stopSharing}
                  className="h-10 shrink-0 rounded-full border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  {t(sharing.state === "starting" ? "Starting…" : "Stop sharing")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startSharing}
                  className="h-10 shrink-0 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  {t("Share my live location")}
                </button>
              ))}
          </div>
          {sharing.state === "on" && <p className="mt-2 text-xs font-medium text-brand-700">{t("You’re sharing your live location with this delivery.")}</p>}
          {sharing.state === "error" && <p className="mt-2 text-xs font-medium text-red-600">{sharing.message}</p>}
          {view.canShare && (
            <p className="mt-2 text-xs text-ink-500">
              {t(
                "Only this delivery’s donor, NGO, volunteer and the FoodBridge team can see it. Sharing stops when you leave this page, and positions are deleted when the delivery ends.",
              )}
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function livedLabel(p: LivePosition, { t, relative }: I18n) {
  return `${p.name} (${t(ROLE_NAME[p.role]).toLowerCase()}) · ${relative(new Date(p.updatedAt))}`;
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span aria-hidden className={cn("size-2.5 rounded-full", className)} />
      {label}
    </li>
  );
}

function Metric({ label, km, i18n }: { label: string; km: number | null; i18n: I18n }) {
  const { t } = i18n;
  const minutes = travelMinutes(km);
  return (
    <div className="rounded-xl bg-cream-100 px-3 py-2">
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd className="font-semibold text-brand-950">
        {t(formatDistance(km) ?? "—")}
        {minutes && <span className="ml-1 text-xs font-normal text-ink-500">{t("~{n} min", { n: minutes })}</span>}
      </dd>
    </div>
  );
}

function NavLink({ href, label, primary }: { href: string; label: string; primary?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold",
        primary ? "bg-brand-600 text-white hover:bg-brand-700" : "border border-brand-900/15 text-brand-900 hover:bg-cream-100",
      )}
    >
      {label} ↗
    </a>
  );
}
