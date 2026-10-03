import "server-only";

import { mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/node-postgres";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import bcrypt from "bcryptjs";
import pg from "pg";
import * as schema from "./schema";

/*
 * Two ways to run the same plain-Postgres schema:
 * - DATABASE_URL set (production, e.g. Neon on Vercel): a hosted Postgres through node-postgres.
 *   Serverless hosts have a read-only, short-lived filesystem, so an embedded database can't work there.
 * - Otherwise (local development): PGlite, Postgres compiled to WASM and stored in DATABASE_DIR,
 *   so the app runs with zero setup.
 * The DDL below is idempotent and runs on every start in both cases.
 */

/** Typed as the PGlite flavour; the node-postgres database has the same query-builder API. */
type DB = PgliteDatabase<typeof schema>;

/** The two calls migrations need, satisfied by both a PGlite client and a node-postgres client. */
type SqlClient = {
  query<T>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
  exec(sql: string): Promise<unknown>;
};

const DDL = /* sql */ `
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('donor','ngo','volunteer','admin')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','suspended')),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text NOT NULL,
  password_hash text NOT NULL,
  donor_type text,
  organization_name text,
  address text,
  area text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid NOT NULL REFERENCES users(id),
  food_type text NOT NULL,
  category text NOT NULL,
  quantity real NOT NULL CHECK (quantity > 0),
  unit text NOT NULL,
  meals_estimate integer NOT NULL,
  condition text NOT NULL,
  prepared_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  pickup_at timestamptz NOT NULL,
  pickup_address text NOT NULL,
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  instructions text,
  image_data bytea,
  image_type text,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN
    ('PENDING','MATCHED','ASSIGNED','PICKED_UP','DELIVERED','COMPLETED','CANCELLED','EXPIRED')),
  ngo_id uuid REFERENCES users(id),
  volunteer_id uuid REFERENCES users(id),
  cancel_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS donations_donor_idx ON donations (donor_id, created_at);
CREATE INDEX IF NOT EXISTS donations_status_idx ON donations (status);

CREATE TABLE IF NOT EXISTS donation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  actor_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS donation_events_donation_idx ON donation_events (donation_id, created_at);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  donation_id uuid REFERENCES donations(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, created_at);

-- Segment 05: NGO module
ALTER TABLE users ADD COLUMN IF NOT EXISTS ngo_type text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_no text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS capacity integer;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS meals_served integer;

CREATE TABLE IF NOT EXISTS food_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  ngo_id uuid NOT NULL REFERENCES users(id),
  quantity real NOT NULL CHECK (quantity > 0),
  people integer NOT NULL CHECK (people > 0),
  preferred_at timestamptz NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACCEPTED','DECLINED','CANCELLED','EXPIRED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (donation_id, ngo_id)
);
CREATE INDEX IF NOT EXISTS food_requests_ngo_idx ON food_requests (ngo_id, created_at);
CREATE INDEX IF NOT EXISTS food_requests_donation_idx ON food_requests (donation_id);

-- Segment 06: Volunteer module
ALTER TABLE users ADD COLUMN IF NOT EXISTS available boolean NOT NULL DEFAULT true;
ALTER TABLE donation_events ADD COLUMN IF NOT EXISTS photo_data bytea;
ALTER TABLE donation_events ADD COLUMN IF NOT EXISTS photo_type text;
CREATE INDEX IF NOT EXISTS donations_volunteer_idx ON donations (volunteer_id, updated_at);

-- Segment 07: Admin module (deactivated accounts + admin activity log)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('active','pending','suspended','deactivated'));
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id),
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activity_log_target_idx ON activity_log (target_id, created_at);
CREATE INDEX IF NOT EXISTS activity_log_created_idx ON activity_log (created_at);

-- Segment 08: Food donation management (fast expiry sweeps)
CREATE INDEX IF NOT EXISTS donations_expiry_idx ON donations (status, expires_at);

-- Segment 09: Food requests (NGO needs) + system matching
CREATE TABLE IF NOT EXISTS food_needs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id uuid NOT NULL REFERENCES users(id),
  category text,
  food_type text,
  quantity real NOT NULL CHECK (quantity > 0),
  unit text NOT NULL,
  people integer NOT NULL CHECK (people > 0),
  area text NOT NULL,
  address text,
  needed_by timestamptz NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CLOSED','CANCELLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS food_needs_ngo_idx ON food_needs (ngo_id, created_at);
CREATE INDEX IF NOT EXISTS food_needs_status_idx ON food_needs (status, needed_by);
ALTER TABLE food_requests ADD COLUMN IF NOT EXISTS need_id uuid REFERENCES food_needs(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS food_requests_need_idx ON food_requests (need_id);
ALTER TABLE food_requests DROP CONSTRAINT IF EXISTS food_requests_status_check;
ALTER TABLE food_requests ADD CONSTRAINT food_requests_status_check
  CHECK (status IN ('PENDING','MATCHED','ACCEPTED','DECLINED','SKIPPED','CANCELLED','EXPIRED'));

-- Segment 10: Matching & allocation (partial allocation + matching history)
ALTER TABLE donations ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES donations(id) ON DELETE SET NULL;
ALTER TABLE food_requests ADD COLUMN IF NOT EXISTS distance_km real;
ALTER TABLE food_requests ADD COLUMN IF NOT EXISTS allocated_at timestamptz;
CREATE TABLE IF NOT EXISTS match_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES food_requests(id) ON DELETE CASCADE,
  donation_id uuid NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  ngo_id uuid NOT NULL REFERENCES users(id),
  need_id uuid,
  status text NOT NULL,
  quantity real,
  people integer,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS match_events_donation_idx ON match_events (donation_id, created_at);
CREATE INDEX IF NOT EXISTS match_events_ngo_idx ON match_events (ngo_id, created_at);
CREATE OR REPLACE FUNCTION log_match_event() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status OR NEW.donation_id IS DISTINCT FROM OLD.donation_id THEN
    INSERT INTO match_events (request_id, donation_id, ngo_id, need_id, status, quantity, people)
    VALUES (NEW.id, NEW.donation_id, NEW.ngo_id, NEW.need_id, NEW.status, NEW.quantity, NEW.people);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS food_requests_history ON food_requests;
CREATE TRIGGER food_requests_history AFTER INSERT OR UPDATE ON food_requests
  FOR EACH ROW EXECUTE FUNCTION log_match_event();

-- Segment 11: Volunteer pickup & delivery (in-transit step, task snapshot, one-at-a-time offers)
ALTER TABLE donations DROP CONSTRAINT IF EXISTS donations_status_check;
ALTER TABLE donations ADD CONSTRAINT donations_status_check CHECK (status IN
  ('PENDING','MATCHED','ASSIGNED','PICKED_UP','IN_TRANSIT','DELIVERED','COMPLETED','CANCELLED','EXPIRED'));
ALTER TABLE donations ADD COLUMN IF NOT EXISTS delivery_address text;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS delivery_lat double precision;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS delivery_lng double precision;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS deliver_by timestamptz;
CREATE TABLE IF NOT EXISTS task_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  volunteer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'OFFERED' CHECK (status IN ('OFFERED','ACCEPTED','DECLINED','EXPIRED','WITHDRAWN','RELEASED')),
  distance_km real,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  UNIQUE (donation_id, volunteer_id)
);
CREATE INDEX IF NOT EXISTS task_offers_donation_idx ON task_offers (donation_id, status);
CREATE INDEX IF NOT EXISTS task_offers_volunteer_idx ON task_offers (volunteer_id, status);

-- Segment 12: Locations, maps & opt-in live location
ALTER TABLE users ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lng double precision;
ALTER TABLE users ADD COLUMN IF NOT EXISTS located_at timestamptz;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS pickup_lat double precision;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS pickup_lng double precision;
ALTER TABLE food_needs ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE food_needs ADD COLUMN IF NOT EXISTS lng double precision;
CREATE TABLE IF NOT EXISTS live_locations (
  donation_id uuid NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  accuracy real,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (donation_id, user_id)
);

-- Segment 13: Food safety (admin hold / disable)
ALTER TABLE donations ADD COLUMN IF NOT EXISTS safety_flag text CHECK (safety_flag IN ('FLAGGED','DISABLED'));
ALTER TABLE donations ADD COLUMN IF NOT EXISTS safety_note text;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS safety_flagged_at timestamptz;

-- Segment 14: Notifications (links, channel preferences, outbox for email/SMS/WhatsApp/Messenger)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS request_id uuid;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS need_id uuid;
CREATE INDEX IF NOT EXISTS notifications_unread_idx ON notifications (user_id) WHERE read_at IS NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_channels text[] NOT NULL DEFAULT '{}';
CREATE TABLE IF NOT EXISTS notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENT','FAILED','SKIPPED')),
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
CREATE INDEX IF NOT EXISTS notification_deliveries_status_idx ON notification_deliveries (status, created_at);
CREATE OR REPLACE FUNCTION queue_notification_deliveries() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO notification_deliveries (notification_id, user_id, channel)
  SELECT NEW.id, NEW.user_id, c FROM users u, unnest(u.notify_channels) AS c WHERE u.id = NEW.user_id;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS notifications_outbox ON notifications;
CREATE TRIGGER notifications_outbox AFTER INSERT ON notifications
  FOR EACH ROW EXECUTE FUNCTION queue_notification_deliveries();

-- Segment 15: AI assistant conversation history
CREATE TABLE IF NOT EXISTS ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  data text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_messages_user_idx ON ai_messages (user_id, created_at);

-- Segment 16: assistant conversations (titled chats in the full-screen history sidebar)
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_conversations_user_idx ON ai_conversations (user_id, updated_at);
ALTER TABLE ai_messages ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES ai_conversations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS ai_messages_conversation_idx ON ai_messages (conversation_id, created_at);
-- Messages from before conversations existed become one "Earlier chat" per user.
INSERT INTO ai_conversations (user_id, title, created_at, updated_at)
  SELECT user_id, 'Earlier chat', min(created_at), max(created_at) FROM ai_messages WHERE conversation_id IS NULL GROUP BY user_id;
UPDATE ai_messages m SET conversation_id = (
  SELECT c.id FROM ai_conversations c WHERE c.user_id = m.user_id AND c.title = 'Earlier chat' ORDER BY c.created_at LIMIT 1
) WHERE m.conversation_id IS NULL;

-- Segment 17: WhatsApp / Messenger links (via n8n)
CREATE TABLE IF NOT EXISTS channel_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('whatsapp','messenger')),
  external_id text,
  code_hash text,
  code_expires_at timestamptz,
  linked_at timestamptz,
  pending_kind text CHECK (pending_kind IN ('donation','need')),
  pending_text text,
  pending_draft text,
  pending_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS channel_links_user_channel_idx ON channel_links (user_id, channel);
CREATE UNIQUE INDEX IF NOT EXISTS channel_links_external_idx ON channel_links (channel, external_id);

-- Segment 18: indexes for reports and exports
CREATE INDEX IF NOT EXISTS donations_created_idx ON donations (created_at);
CREATE INDEX IF NOT EXISTS donation_events_status_idx ON donation_events (status, created_at);

-- Segment 20: session revocation (bumped on password change and when an account is blocked)
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 0;
-- Segment 19: activity log browsing by action and type
CREATE INDEX IF NOT EXISTS activity_log_action_idx ON activity_log (action, created_at);

-- Segment 22: donors answer NGO food requests (a comment, optionally with the food they posted for it)
CREATE TABLE IF NOT EXISTS need_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id uuid NOT NULL REFERENCES food_needs(id) ON DELETE CASCADE,
  donor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  donation_id uuid REFERENCES donations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (need_id, donor_id)
);
CREATE INDEX IF NOT EXISTS need_responses_need_idx ON need_responses (need_id, updated_at);
`;

/** Accounts that cannot self-register (admin) plus ready-made demo partners (DEMO_MODE only). */
async function seed(client: SqlClient) {
  const { rows } = await client.query<{ n: number }>("SELECT count(*)::int AS n FROM users WHERE role <> 'donor'");
  if (rows[0].n > 0) return;

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@foodbridge.local";
  // The built-in password is for local development only; never create a guessable admin in production.
  if (process.env.NODE_ENV === "production" && process.env.DEMO_MODE !== "true" && !process.env.ADMIN_PASSWORD) {
    throw new Error("Set ADMIN_PASSWORD (and ADMIN_EMAIL) before the first production start, so the admin account isn’t created with a default password.");
  }
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin@12345";
  const accounts: [string, string, string, string, string, string | null][] = [
    ["admin", "FoodBridge Admin", adminEmail, "+8801700000000", adminPassword, null],
  ];
  if (process.env.DEMO_MODE === "true") {
    accounts.push(
      ["ngo", "Hope Kitchen", "ngo@foodbridge.local", "+8801711111111", "Ngo@12345", "Hope Kitchen Foundation"],
      ["volunteer", "Rahim Uddin", "volunteer@foodbridge.local", "+8801722222222", "Volunteer@123", null],
    );
  }
  for (const [role, name, email, phone, password, org] of accounts) {
    await client.query(
      `INSERT INTO users (role, name, email, phone, password_hash, organization_name)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO NOTHING`,
      [role, name, email.toLowerCase(), phone, await bcrypt.hash(password, 12), org],
    );
  }
}

/** Idempotent: safe to run on every start and again whenever the DDL changes. */
async function migrate(client: SqlClient) {
  await client.exec(DDL);
  await seed(client);
  if (process.env.DEMO_MODE === "true") {
    // Give the demo NGO a complete profile (never overwrites edits).
    await client.query(
      `UPDATE users SET ngo_type = 'community_kitchen', area = 'Dhanmondi, Dhaka',
         address = COALESCE(address, 'Road 2, Dhanmondi, Dhaka'), capacity = COALESCE(capacity, 150)
       WHERE email = 'ngo@foodbridge.local' AND ngo_type IS NULL`,
    );
    await client.query(
      `UPDATE users SET area = 'Dhanmondi, Dhaka' WHERE email = 'volunteer@foodbridge.local' AND area IS NULL`,
    );
    // Map pins for the demo partners (Dhanmondi), so distances and maps work out of the box.
    await client.query(`UPDATE users SET lat = 23.7461, lng = 90.3742 WHERE email = 'ngo@foodbridge.local' AND lat IS NULL`);
    await client.query(`UPDATE users SET lat = 23.7509, lng = 90.3782 WHERE email = 'volunteer@foodbridge.local' AND lat IS NULL`);
  }
}

/**
 * PGlite keeps the database in memory and writes it back to its folder, so only ONE
 * process may open a folder at a time (a second `next dev`/`next start` would overwrite it).
 * A small lock file ("<pid> <boot time>") turns that mistake into a clear error instead of
 * silent data loss. The boot time matters because the OS reuses pids after a restart: a lock
 * written before the last boot is always stale, whoever holds that pid now.
 */
function acquireLock(dir: string) {
  const lockFile = `${dir}.lock`;
  const content = `${process.pid} ${bootTime()}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      writeFileSync(lockFile, content, { flag: "wx" });
      process.once("exit", () => {
        try {
          if (readFileSync(lockFile, "utf8") === content) unlinkSync(lockFile);
        } catch {}
      });
      return;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const [owner, boot] = readFileSync(lockFile, "utf8").trim().split(/\s+/).map(Number);
      if (owner === process.pid) return;
      // Older lock files have no boot time: fall back to when the file was written.
      const sameBoot = boot ? Math.abs(boot - bootTime()) < 5 * 60_000 : statSync(lockFile).mtimeMs > bootTime() - 60_000;
      if (sameBoot && isAlive(owner)) {
        throw new Error(
          `The database at ${dir} is already open in another process (pid ${owner}). ` +
            `Stop the other FoodBridge server, or give this one its own DATABASE_DIR.`,
        );
      }
      unlinkSync(lockFile); // stale lock from a crashed process or an earlier boot
    }
  }
}

/** When the machine started (ms since epoch). Varies by a second or so between calls. */
function bootTime() {
  return Math.round(Date.now() - os.uptime() * 1000);
}

function isAlive(pid: number) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

type Opened = { db: DB; migrate: () => Promise<void> };

function openPglite(): Opened {
  const dir = path.resolve(/*turbopackIgnore: true*/ process.env.DATABASE_DIR ?? "./.data/pglite");
  mkdirSync(path.dirname(dir), { recursive: true });
  acquireLock(dir);
  const client = new PGlite(dir);
  return { db: drizzle({ client, schema }), migrate: () => migrate(client) };
}

// Counts and sums come back as bigint/numeric; parse them as numbers, as PGlite does.
pg.types.setTypeParser(pg.types.builtins.INT8, Number);
pg.types.setTypeParser(pg.types.builtins.NUMERIC, Number);

/** Any id works, as long as every server uses the same one. */
const MIGRATION_LOCK = 727_19_20;

function openPostgres(url: string): Opened {
  // Serverless: few connections per instance; use the provider's pooled connection string.
  const pool = new pg.Pool({ connectionString: url, max: 5, idleTimeoutMillis: 10_000 });
  return {
    db: drizzlePostgres({ client: pool, schema }) as unknown as DB,
    // Several instances can cold-start at once. One transaction with a transaction-scoped
    // advisory lock runs the DDL one at a time, all or nothing, and works behind any pooler.
    migrate: async () => {
      const conn = await pool.connect();
      try {
        await conn.query("BEGIN");
        await conn.query("SELECT pg_advisory_xact_lock($1)", [MIGRATION_LOCK]);
        const client: SqlClient = {
          query: async <T>(sql: string, params?: unknown[]) => ({ rows: (await conn.query(sql, params)).rows as T[] }),
          exec: (sql) => conn.query(sql),
        };
        await migrate(client);
        await conn.query("COMMIT");
      } catch (error) {
        await conn.query("ROLLBACK").catch(() => {});
        throw error;
      } finally {
        conn.release();
      }
    },
  };
}

async function open(): Promise<Opened> {
  // Neon sets DATABASE_URL; some other Vercel database integrations set POSTGRES_URL.
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url && process.env.VERCEL) {
    throw new Error("DATABASE_URL is not set. Connect a Postgres database (e.g. Neon) to this Vercel project.");
  }
  const opened = url ? openPostgres(url) : openPglite();
  await opened.migrate();
  return opened;
}

// One database connection per process (survives dev hot reloads). We remember which DDL was
// applied so that editing the schema during `next dev` re-runs the migration on the live connection.
type Cached = { opened: Promise<Opened>; ddl: string };
const globalForDb = globalThis as unknown as { __foodbridgeDb?: Cached };

export async function getDb(): Promise<DB> {
  let cached = globalForDb.__foodbridgeDb;
  // A dev server started on older code cached `{ db }` (a PGlite database). Reuse it:
  // opening the same folder twice in one process would corrupt it.
  if (cached && !("opened" in cached)) {
    const legacy = cached as unknown as { db: Promise<DB & { $client: PGlite }>; ddl?: string };
    cached = globalForDb.__foodbridgeDb = {
      ddl: legacy.ddl ?? "",
      opened: legacy.db.then((db) => ({ db, migrate: () => migrate(db.$client) })),
    };
  }

  if (!cached) {
    const opened = open().catch((error) => {
      globalForDb.__foodbridgeDb = undefined;
      throw error;
    });
    globalForDb.__foodbridgeDb = { opened, ddl: DDL };
    return (await opened).db;
  }
  if (cached.ddl !== DDL) {
    cached.ddl = DDL;
    cached.opened = cached.opened.then(async (o) => {
      await o.migrate();
      return o;
    });
  }
  return (await cached.opened).db;
}

export { schema };
