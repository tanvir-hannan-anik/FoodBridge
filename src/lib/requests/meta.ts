import type { DonationStatus, FoodCategory, NeedStatus, Unit } from "@/db/schema";
import type { Stage } from "@/lib/ngo/meta";

/**
 * An NGO food request ("need") is the NGO's requirement: what food, how much, for how many
 * people, where and by when. Donations get attached to it, either by the system's matching
 * (NGO confirms) or through the NGO's own direct requests. Its stage rolls up the attached food.
 */
export type NeedAllocation = {
  /** food_requests.status */
  status: "PENDING" | "MATCHED" | "ACCEPTED" | "DECLINED" | "SKIPPED" | "CANCELLED" | "EXPIRED";
  donationStatus: DonationStatus;
  meals: number;
};

const IN_PROGRESS: DonationStatus[] = ["MATCHED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT"];
const DELIVERED: DonationStatus[] = ["DELIVERED", "COMPLETED"];

/** Accepted food that is still coming or already arrived (not cancelled or expired). */
function isLive(a: NeedAllocation) {
  return a.status === "ACCEPTED" && (IN_PROGRESS.includes(a.donationStatus) || DELIVERED.includes(a.donationStatus));
}

export function needProgress(people: number, allocations: NeedAllocation[]) {
  const live = allocations.filter(isLive);
  const matched = live.reduce((sum, a) => sum + a.meals, 0);
  const delivered = live.filter((a) => DELIVERED.includes(a.donationStatus)).reduce((sum, a) => sum + a.meals, 0);
  return { requested: people, matched, delivered, remaining: Math.max(0, people - matched) };
}

export type NeedProgress = ReturnType<typeof needProgress>;

export function needStage(need: { status: NeedStatus; neededBy: Date }, allocations: NeedAllocation[], now = new Date()): Stage {
  if (need.status === "CANCELLED") return "cancelled";
  const live = allocations.filter(isLive);
  if (live.some((a) => IN_PROGRESS.includes(a.donationStatus))) return "accepted";
  if (need.status === "OPEN" && need.neededBy > now && allocations.some((a) => a.status === "MATCHED")) return "matched";
  if (live.some((a) => a.donationStatus === "DELIVERED")) return "delivered";
  if (live.length) return "completed";
  return need.status === "OPEN" && need.neededBy > now ? "pending" : "cancelled";
}

/** NGOs may edit or cancel a request until food has been accepted for it. */
export function needEditable(need: { status: NeedStatus }, allocations: NeedAllocation[]) {
  return need.status === "OPEN" && !allocations.some((a) => a.status === "ACCEPTED");
}

/** Why a finished request shows as cancelled, when it wasn't cancelled explicitly. */
export function needClosedReason(need: { status: NeedStatus; neededBy: Date }, now = new Date()) {
  if (need.status === "CANCELLED") return "This request was cancelled.";
  if (need.status === "CLOSED") return "You closed this request.";
  if (need.neededBy <= now) return "The required time passed before food was found.";
  return null;
}

/** What a donor sees of an open NGO request (serialisable subset of OpenNeedForDonor). */
export type NeedCardData = {
  id: string;
  ngoName: string;
  foodType: string | null;
  category: FoodCategory | null;
  quantity: number;
  unit: Unit;
  people: number;
  area: string;
  neededBy: Date;
  notes: string | null;
  remaining: number;
  km: number | null;
  replies: number;
  myMessage: string | null;
  myDonationId: string | null;
};

/** Server → client: keep only what the card shows. */
export function toNeedCard(n: {
  id: string;
  ngoName: string;
  foodType: string | null;
  category: FoodCategory | null;
  quantity: number;
  unit: Unit;
  people: number;
  area: string;
  neededBy: Date;
  notes: string | null;
  progress: { remaining: number };
  km: number | null;
  replies: number;
  myMessage: string | null;
  myDonationId: string | null;
}): NeedCardData {
  return {
    id: n.id,
    ngoName: n.ngoName,
    foodType: n.foodType,
    category: n.category,
    quantity: n.quantity,
    unit: n.unit,
    people: n.people,
    area: n.area,
    neededBy: n.neededBy,
    notes: n.notes,
    remaining: n.progress.remaining,
    km: n.km,
    replies: n.replies,
    myMessage: n.myMessage,
    myDonationId: n.myDonationId,
  };
}
