import "server-only";

import pg from "pg";
import type { ChatOrderSource } from "@/db/schema";

/*
 * The only file that talks to the Supabase database n8n writes chat messages into.
 * SUPABASE_DB_URL must be reachable over IPv4: use Supabase's pooler string
 * (postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres),
 * not db.<ref>.supabase.co, which is IPv6-only and fails on most networks and on Vercel.
 */

/** One Supabase row, normalised to the columns `chat_orders` keeps. */
export type InboxRow = {
  source: ChatOrderSource;
  externalId: number;
  name: string | null;
  phone: string | null;
  location: string | null;
  food: string | null;
  quantity: string | null;
  goodFor: string | null;
  place: string | null;
  timeText: string | null;
  sourceStatus: string | null;
  receivedAt: Date;
};

export function inboxConfigured() {
  return Boolean(process.env.SUPABASE_DB_URL);
}

const globalForInbox = globalThis as unknown as { __foodbridgeInbox?: pg.Pool };

function pool() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("SUPABASE_DB_URL is not set.");
  // Supabase's certificate chain isn't in Node's store; the connection is still encrypted.
  globalForInbox.__foodbridgeInbox ??= new pg.Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    max: 2,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
  });
  return globalForInbox.__foodbridgeInbox;
}

// created_at is "timestamp without time zone" written by now() on a UTC server.
const OFFERS = `
  SELECT 'donation' AS source, id AS "externalId", shop_name AS name, contact_number AS phone, shop_location AS location,
         food_type AS food, quantity, good_for AS "goodFor", pickup_location AS place, pickup_before AS "timeText",
         status AS "sourceStatus", coalesce(created_at AT TIME ZONE 'UTC', now()) AS "receivedAt"
  FROM donations ORDER BY id DESC LIMIT $1`;
const REQUESTS = `
  SELECT 'request' AS source, id AS "externalId", ngo_name AS name, contact_number AS phone, ngo_location AS location,
         food_needed AS food, quantity, NULL AS "goodFor", delivery_location AS place, needed_by AS "timeText",
         status AS "sourceStatus", coalesce(created_at AT TIME ZONE 'UTC', now()) AS "receivedAt"
  FROM requests ORDER BY id DESC LIMIT $1`;

/** The latest offers and requests, newest first. Throws if Supabase can't be reached. */
export async function fetchInbox(limit: number): Promise<InboxRow[]> {
  const db = pool();
  const [offers, requests] = await Promise.all([db.query<InboxRow>(OFFERS, [limit]), db.query<InboxRow>(REQUESTS, [limit])]);
  return [...offers.rows, ...requests.rows];
}

const TABLE: Record<ChatOrderSource, string> = { donation: "donations", request: "requests" };

/**
 * Claims a waiting offer in Supabase (so the chat bot can't hand it out again).
 * False when it's already taken, withdrawn or deleted there.
 */
export async function claimInSource(source: ChatOrderSource, externalId: number, openStatus: string, status: string) {
  const { rowCount } = await pool().query(
    `UPDATE ${TABLE[source]} SET status = $1 WHERE id = $2 AND (status IS NULL OR status = $3)`,
    [status, externalId, openStatus],
  );
  return rowCount === 1;
}

export async function setSourceStatus(source: ChatOrderSource, externalId: number, status: string) {
  await pool().query(`UPDATE ${TABLE[source]} SET status = $1 WHERE id = $2`, [status, externalId]);
}
