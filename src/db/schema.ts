import {
  boolean,
  customType,
  doublePrecision,
  index,
  primaryKey,
  uniqueIndex,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Uint8Array }>({
  dataType: () => "bytea",
  toDriver: (value) => value,
  fromDriver: (value) => Buffer.from(value),
});

export const ROLES = ["donor", "ngo", "volunteer", "admin"] as const;
export type Role = (typeof ROLES)[number];

/** pending = awaiting admin verification; suspended = blocked by an admin (can be reinstated); deactivated = account closed. */
export const USER_STATUSES = ["active", "pending", "suspended", "deactivated"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const DONOR_TYPES = ["restaurant", "hotel", "shop", "individual", "other"] as const;
export type DonorType = (typeof DONOR_TYPES)[number];

export const DONATION_STATUSES = [
  "PENDING",
  "MATCHED",
  "ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
] as const;
export type DonationStatus = (typeof DONATION_STATUSES)[number];

export const FOOD_CATEGORIES = ["cooked", "bakery", "packaged", "raw", "fruits_veg", "dairy", "other"] as const;
export type FoodCategory = (typeof FOOD_CATEGORIES)[number];

export const UNITS = ["plates", "kg", "packets", "boxes", "litres", "pieces"] as const;
export type Unit = (typeof UNITS)[number];

export const CONDITIONS = ["fresh", "good", "consume_soon"] as const;
export type FoodCondition = (typeof CONDITIONS)[number];

export const NOTIFICATION_TYPES = [
  "donation_created",
  "matched",
  "volunteer_assigned",
  "picked_up",
  "delivered",
  "completed",
  "cancelled",
  "expired",
  "expiry_warning",
  // NGO request flow
  "request_submitted",
  "request_received",
  "request_accepted",
  "request_declined",
  "account_verified",
  // Volunteer task flow
  "task_available",
  "task_accepted",
  "pickup_reminder",
  // Food requests (NGO needs)
  "request_matched",
  // Matching & allocation (Segment 10)
  "partially_allocated",
  "match_cancelled",
  // Pickup & delivery (Segment 11)
  "task_assigned",
  "task_declined",
  "in_transit",
  // Food safety (Segment 13)
  "safety_review",
  // Admin-only alerts (Segment 14): something needs a person to step in
  "admin_alert",
] as const;

/** Admin food-safety hold: FLAGGED = paused for review (not matchable), DISABLED = withdrawn as unsafe. */
export const SAFETY_FLAGS = ["FLAGGED", "DISABLED"] as const;
export type SafetyFlag = (typeof SAFETY_FLAGS)[number];

/** Outside channels a user can opt into (in-app is always on). Delivered by lib/notifications/channels.ts. */
export const NOTIFY_CHANNELS = ["email", "sms", "whatsapp", "messenger"] as const;
export type NotifyChannel = (typeof NOTIFY_CHANNELS)[number];
/** Chat apps a user can link to talk to FoodBridge through n8n (Segment 17). */
export const CHAT_CHANNELS = ["whatsapp", "messenger"] as const;
export type ChatChannel = (typeof CHAT_CHANNELS)[number];
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NGO_TYPES = ["shelter", "orphanage", "community_kitchen", "elderly_home", "school", "other"] as const;
export type NgoType = (typeof NGO_TYPES)[number];

/**
 * One NGO ↔ one donation. Two ways in:
 * - the NGO asks for a donation directly: PENDING → donor decides → ACCEPTED | DECLINED
 * - the system matches a donation to an NGO food request (need): MATCHED → NGO confirms → ACCEPTED, or SKIPPED
 * NGOs may CANCEL while pending; EXPIRED if the food expires first.
 */
export const REQUEST_STATUSES = ["PENDING", "MATCHED", "ACCEPTED", "DECLINED", "SKIPPED", "CANCELLED", "EXPIRED"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

/** An NGO food request (need). OPEN until the NGO or an admin cancels it, or the NGO closes it. */
export const NEED_STATUSES = ["OPEN", "CLOSED", "CANCELLED"] as const;
export type NeedStatus = (typeof NEED_STATUSES)[number];

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  role: text("role").$type<Role>().notNull(),
  status: text("status").$type<UserStatus>().notNull().default("active"),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  passwordHash: text("password_hash").notNull(),
  // Donor / NGO specific (nullable so one table serves every role).
  donorType: text("donor_type").$type<DonorType>(),
  organizationName: text("organization_name"),
  address: text("address"),
  area: text("area"),
  // NGO specific
  ngoType: text("ngo_type").$type<NgoType>(),
  registrationNo: text("registration_no"),
  description: text("description"),
  capacity: integer("capacity"),
  // Volunteer specific: whether they want new delivery tasks right now.
  available: boolean("available").notNull().default(true),
  /** Optional map pin: donor's usual pickup point, NGO's delivery point, volunteer's base or last known position. */
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  /** When lat/lng was last set from the device (volunteers use it for "nearby" task offers). */
  locatedAt: timestamp("located_at", { withTimezone: true }),
  /** Extra channels this user wants important notifications on. */
  notifyChannels: text("notify_channels").array().$type<NotifyChannel[]>().notNull().default([]),
  /** Sessions carry this number; bumping it signs the account out everywhere (password change, block). */
  sessionVersion: integer("session_version").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const donations = pgTable(
  "donations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    donorId: uuid("donor_id")
      .notNull()
      .references(() => users.id),
    foodType: text("food_type").notNull(),
    category: text("category").$type<FoodCategory>().notNull(),
    quantity: real("quantity").notNull(),
    unit: text("unit").$type<Unit>().notNull(),
    mealsEstimate: integer("meals_estimate").notNull(),
    condition: text("condition").$type<FoodCondition>().notNull(),
    preparedAt: timestamp("prepared_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    pickupAt: timestamp("pickup_at", { withTimezone: true }).notNull(),
    pickupAddress: text("pickup_address").notNull(),
    pickupLat: doublePrecision("pickup_lat"),
    pickupLng: doublePrecision("pickup_lng"),
    contactName: text("contact_name").notNull(),
    contactPhone: text("contact_phone").notNull(),
    instructions: text("instructions"),
    imageData: bytea("image_data"),
    imageType: text("image_type"),
    status: text("status").$type<DonationStatus>().notNull().default("PENDING"),
    ngoId: uuid("ngo_id").references(() => users.id),
    volunteerId: uuid("volunteer_id").references(() => users.id),
    cancelReason: text("cancel_reason"),
    /** Entered by the NGO on completion; falls back to mealsEstimate. */
    mealsServed: integer("meals_served"),
    /** Set when a larger donation was partly allocated: this row is the remainder that stayed available. */
    parentId: uuid("parent_id"),
    /** Delivery task snapshot, filled in when the donation is allocated to an NGO. */
    deliveryAddress: text("delivery_address"),
    deliveryLat: doublePrecision("delivery_lat"),
    deliveryLng: doublePrecision("delivery_lng"),
    deliverBy: timestamp("deliver_by", { withTimezone: true }),
    /** Admin food-safety hold (see SAFETY_FLAGS); null = no concerns. */
    safetyFlag: text("safety_flag").$type<SafetyFlag>(),
    safetyNote: text("safety_note"),
    safetyFlaggedAt: timestamp("safety_flagged_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("donations_donor_idx").on(t.donorId, t.createdAt),
    index("donations_status_idx").on(t.status),
    index("donations_volunteer_idx").on(t.volunteerId, t.updatedAt),
    index("donations_expiry_idx").on(t.status, t.expiresAt),
  ],
);

export const donationEvents = pgTable(
  "donation_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    donationId: uuid("donation_id")
      .notNull()
      .references(() => donations.id, { onDelete: "cascade" }),
    status: text("status").$type<DonationStatus>().notNull(),
    note: text("note"),
    /** Optional proof photo a volunteer attaches when confirming pickup or delivery. */
    photoData: bytea("photo_data"),
    photoType: text("photo_type"),
    actorId: uuid("actor_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("donation_events_donation_idx").on(t.donationId, t.createdAt)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    donationId: uuid("donation_id").references(() => donations.id, { onDelete: "cascade" }),
    /** Optional links, so history can be followed back to the request or food request it's about. */
    requestId: uuid("request_id"),
    needId: uuid("need_id"),
    type: text("type").$type<NotificationType>().notNull(),
    message: text("message").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.createdAt)],
);

export const foodNeeds = pgTable(
  "food_needs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ngoId: uuid("ngo_id")
      .notNull()
      .references(() => users.id),
    /** null = any food type */
    category: text("category").$type<FoodCategory>(),
    foodType: text("food_type"),
    quantity: real("quantity").notNull(),
    unit: text("unit").$type<Unit>().notNull(),
    /** Estimated people to serve (= meals needed). No personal data about recipients is stored. */
    people: integer("people").notNull(),
    area: text("area").notNull(),
    address: text("address"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    neededBy: timestamp("needed_by", { withTimezone: true }).notNull(),
    notes: text("notes"),
    status: text("status").$type<NeedStatus>().notNull().default("OPEN"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("food_needs_ngo_idx").on(t.ngoId, t.createdAt), index("food_needs_status_idx").on(t.status, t.neededBy)],
);

export const foodRequests = pgTable(
  "food_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    donationId: uuid("donation_id")
      .notNull()
      .references(() => donations.id, { onDelete: "cascade" }),
    ngoId: uuid("ngo_id")
      .notNull()
      .references(() => users.id),
    /** Set when the system matched this donation to one of the NGO's food requests. */
    needId: uuid("need_id").references(() => foodNeeds.id, { onDelete: "set null" }),
    quantity: real("quantity").notNull(),
    people: integer("people").notNull(),
    preferredAt: timestamp("preferred_at", { withTimezone: true }).notNull(),
    notes: text("notes"),
    status: text("status").$type<RequestStatus>().notNull().default("PENDING"),
    /** Straight-line km from the food to the delivery point when the match was proposed (null = unknown). */
    distanceKm: real("distance_km"),
    /** When the accepted quantity was reserved for the NGO and the pickup task created. */
    allocatedAt: timestamp("allocated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("food_requests_ngo_idx").on(t.ngoId, t.createdAt),
    index("food_requests_donation_idx").on(t.donationId),
    index("food_requests_need_idx").on(t.needId),
  ],
);

/**
 * Matching history: one row per status change of a food_requests row (written by a database
 * trigger, so no code path can forget it) plus an ALLOCATED row when the food is reserved.
 */
export const matchEvents = pgTable(
  "match_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => foodRequests.id, { onDelete: "cascade" }),
    donationId: uuid("donation_id")
      .notNull()
      .references(() => donations.id, { onDelete: "cascade" }),
    ngoId: uuid("ngo_id")
      .notNull()
      .references(() => users.id),
    needId: uuid("need_id"),
    status: text("status").$type<RequestStatus | "ALLOCATED">().notNull(),
    quantity: real("quantity"),
    people: integer("people"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("match_events_donation_idx").on(t.donationId, t.createdAt), index("match_events_ngo_idx").on(t.ngoId, t.createdAt)],
);

/**
 * A pickup task offered to one volunteer at a time (nearest first). OFFERED → ACCEPTED | DECLINED |
 * EXPIRED (no answer in time) | WITHDRAWN (task changed or volunteer went offline) | RELEASED (gave it back).
 * UNIQUE (donation, volunteer): nobody is offered the same task twice.
 */
export const OFFER_STATUSES = ["OFFERED", "ACCEPTED", "DECLINED", "EXPIRED", "WITHDRAWN", "RELEASED"] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

export const taskOffers = pgTable(
  "task_offers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    donationId: uuid("donation_id")
      .notNull()
      .references(() => donations.id, { onDelete: "cascade" }),
    volunteerId: uuid("volunteer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").$type<OfferStatus>().notNull().default("OFFERED"),
    distanceKm: real("distance_km"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (t) => [index("task_offers_donation_idx").on(t.donationId, t.status), index("task_offers_volunteer_idx").on(t.volunteerId, t.status)],
);

/** Outbox: one row per notification × outside channel the user opted into. Filled by a DB trigger. */
export const DELIVERY_STATUSES = ["PENDING", "SENT", "FAILED", "SKIPPED"] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const notificationDeliveries = pgTable(
  "notification_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    notificationId: uuid("notification_id")
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    channel: text("channel").$type<NotifyChannel>().notNull(),
    status: text("status").$type<DeliveryStatus>().notNull().default("PENDING"),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
  },
  (t) => [index("notification_deliveries_status_idx").on(t.status, t.createdAt)],
);

/** One assistant chat (Segment 16 UI): a title shown in the history sidebar, like a chat app. */
export const aiConversations = pgTable(
  "ai_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ai_conversations_user_idx").on(t.userId, t.updatedAt)],
);

/** Assistant conversation history (basic: the last few turns give the AI context). */
export const aiMessages = pgTable(
  "ai_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id").references(() => aiConversations.id, { onDelete: "cascade" }),
    role: text("role").$type<"user" | "assistant">().notNull(),
    content: text("content").notNull(),
    /** Structured extras returned with an assistant reply (draft, suggestions, sources). */
    data: text("data"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ai_messages_user_idx").on(t.userId, t.createdAt)],
);

/** Opt-in live position of one participant of an active delivery. Deleted when the delivery ends. */
export const liveLocations = pgTable(
  "live_locations",
  {
    donationId: uuid("donation_id")
      .notNull()
      .references(() => donations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    accuracy: real("accuracy"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.donationId, t.userId] })],
);

/**
 * A user's WhatsApp / Messenger account, linked with a one-time code (Segment 17). `externalId` is
 * the sender id n8n reports (phone number or page-scoped id). A pending chat draft waits here for
 * the user's YES before anything is created.
 */
export const channelLinks = pgTable(
  "channel_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    channel: text("channel").$type<ChatChannel>().notNull(),
    externalId: text("external_id"),
    /** sha256 of the one-time link code; cleared once linked. */
    codeHash: text("code_hash"),
    codeExpiresAt: timestamp("code_expires_at", { withTimezone: true }),
    linkedAt: timestamp("linked_at", { withTimezone: true }),
    pendingKind: text("pending_kind").$type<"donation" | "need">(),
    /** Everything the user has described so far for the pending draft (re-drafted on each message). */
    pendingText: text("pending_text"),
    /** The validated form values shown to the user, created as-is when they reply YES. */
    pendingDraft: text("pending_draft"),
    pendingAt: timestamp("pending_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("channel_links_user_channel_idx").on(t.userId, t.channel), uniqueIndex("channel_links_external_idx").on(t.channel, t.externalId)],
);

/** Admin actions (verify, suspend, edit, cancel…) for monitoring. Status changes live in donation_events. */
export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => users.id),
    action: text("action").notNull(),
    targetType: text("target_type").$type<"user" | "donation" | "request" | "need">().notNull(),
    targetId: uuid("target_id").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("activity_log_target_idx").on(t.targetId, t.createdAt),
    index("activity_log_created_idx").on(t.createdAt),
    index("activity_log_action_idx").on(t.action, t.createdAt),
  ],
);

export type User = typeof users.$inferSelect;
export type FoodRequest = typeof foodRequests.$inferSelect;
export type FoodNeed = typeof foodNeeds.$inferSelect;
export type ActivityLogEntry = typeof activityLog.$inferSelect;
export type Donation = typeof donations.$inferSelect;
export type DonationEvent = typeof donationEvents.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type MatchEvent = typeof matchEvents.$inferSelect;
export type TaskOffer = typeof taskOffers.$inferSelect;
export type ChannelLink = typeof channelLinks.$inferSelect;
export type AiConversation = typeof aiConversations.$inferSelect;
