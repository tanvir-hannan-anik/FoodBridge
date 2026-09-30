import type { DonationStatus, Role } from "@/db/schema";
import type { LatLng } from "@/lib/geo";

/** A shared live position older than this is treated as stale and hidden. */
export const LIVE_FRESH_MINUTES = 10;
/** How often an open map asks for fresh positions, and how often a sharing device sends one. */
export const LIVE_POLL_SECONDS = 15;
export const LIVE_SEND_SECONDS = 15;

export type LivePosition = {
  userId: string;
  role: Role;
  name: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  /** ISO string (sent to the browser as JSON). */
  updatedAt: string;
};

export type MapPlace = { point: LatLng | null; address: string | null; name: string };

/** What a delivery map shows. Built on the server (auth-checked) and refreshed by polling. */
export type DeliveryView = {
  donationId: string;
  status: DonationStatus;
  viewerId: string;
  viewerRole: Role;
  /** Live sharing is possible (a volunteer has accepted and it isn't delivered yet). */
  live: boolean;
  canShare: boolean;
  /** The task is waiting on a volunteer's accept/decline. */
  pendingOffer: boolean;
  pickup: MapPlace;
  delivery: MapPlace | null;
  volunteer: { point: LatLng | null; name: string } | null;
  positions: LivePosition[];
};

/** Layers on the role "Map" page. */
export type OverviewLayer = "donor" | "donation" | "ngo" | "volunteer";

export const OVERVIEW_LAYER_LABEL: Record<OverviewLayer, string> = {
  donor: "Donors",
  donation: "Food pickups",
  ngo: "NGOs & delivery points",
  volunteer: "Volunteers",
};

export type OverviewPoint = {
  id: string;
  layer: OverviewLayer;
  point: LatLng;
  title: string;
  subtitle?: string;
  href?: string;
  /** Rounded to ~1 km to protect a private home. */
  approximate?: boolean;
};

export type OverviewMapData = {
  role: Role;
  me: LatLng | null;
  points: OverviewPoint[];
  /** Pickup → delivery lines for active deliveries / tasks. */
  routes: LatLng[][];
  layers: OverviewLayer[];
};
