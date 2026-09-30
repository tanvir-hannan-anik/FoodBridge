import "server-only";

import type { User } from "@/db/schema";
import { listUsers } from "@/lib/admin/service";
import { listDonorDonations } from "@/lib/donations/service";
import { listNgoRequests } from "@/lib/ngo/service";
import { listNotifications } from "@/lib/notifications/service";
import { listNeeds } from "@/lib/requests/service";
import { getSafetyOverview } from "@/lib/safety/service";
import { remainingLabel, safetyStatus } from "@/lib/safety/meta";
import { listOpenTasks, listVolunteerTasks } from "@/lib/volunteer/service";
import type { Suggestion } from "./schemas";

/*
 * The assistant's read-only "tools": rule-based lookups of what needs this user's attention.
 * The AI only summarises and orders these; every item and link comes from here, never from the model.
 */

export type ContextItem = Suggestion & { id: string };
export type UserContext = { items: ContextItem[]; unread: { message: string; at: Date }[] };

export async function getUserContext(user: User): Promise<UserContext> {
  const items: ContextItem[] = [];
  const add = (item: Omit<ContextItem, "id">) => items.push({ ...item, id: `a${items.length + 1}` });
  const unread = (await listNotifications(user.id, { unreadOnly: true, limit: 12 })).map((n) => ({ message: n.message, at: n.createdAt }));

  if (user.role === "donor") {
    const active = await listDonorDonations(user.id, "active", 30);
    for (const d of active) {
      const status = safetyStatus(d);
      if (d.status === "PENDING" && d.pendingRequests > 0) {
        add({ title: `Review ${d.pendingRequests} NGO request${d.pendingRequests > 1 ? "s" : ""} for “${d.foodType}”`, detail: "Accept one NGO so a volunteer can collect it.", href: `/donor/donations/${d.id}`, priority: "high" });
      }
      if (status === "expiring_soon") add({ title: `“${d.foodType}” is expiring soon`, detail: remainingLabel(d.expiresAt), href: `/donor/donations/${d.id}`, priority: "high" });
      if (status === "flagged") add({ title: `“${d.foodType}” is paused for a safety check`, detail: "Check the note from FoodBridge, or cancel it if the food isn’t safe.", href: `/donor/donations/${d.id}`, priority: "high" });
      if (["ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(d.status)) add({ title: `“${d.foodType}” is being delivered`, detail: "Follow it on the map.", href: `/donor/donations/${d.id}`, priority: "normal" });
    }
    if (!active.length) add({ title: "Post surplus food", detail: "Tell me what you have and I’ll fill in the donation form.", href: "/donor/donate", priority: "normal" });
  }

  if (user.role === "ngo") {
    const [requests, needs] = await Promise.all([listNgoRequests(user.id), listNeeds(user.id)]);
    for (const r of requests) {
      if (r.status === "MATCHED") add({ title: `Accept or reject the match “${r.foodType}”`, detail: `From ${r.donorName}. Expires ${remainingLabel(r.expiresAt)}.`, href: `/ngo/donations/${r.donationId}`, priority: "high" });
      if (r.status === "ACCEPTED" && r.donationStatus === "IN_TRANSIT") add({ title: `“${r.foodType}” is on its way`, detail: "Confirm when it arrives.", href: `/ngo/donations/${r.donationId}`, priority: "normal" });
      if (r.status === "ACCEPTED" && r.donationStatus === "DELIVERED") add({ title: `Mark “${r.foodType}” as distributed`, detail: "Enter how many meals you served.", href: `/ngo/donations/${r.donationId}`, priority: "high" });
    }
    for (const n of needs) {
      if (n.stage === "pending") add({ title: `No food found yet for “${n.foodType || "your request"}”`, detail: `${n.progress.remaining} meals still needed. Try any food type or a later time.`, href: `/ngo/requests/${n.id}`, priority: "normal" });
    }
    if (user.status !== "active") add({ title: "Your NGO is awaiting verification", detail: "You can request food once FoodBridge verifies you.", href: "/profile", priority: "normal" });
  }

  if (user.role === "volunteer") {
    if (user.status !== "active") add({ title: "Your account is awaiting verification", detail: "Complete your profile meanwhile.", href: "/profile", priority: "normal" });
    else {
      const [current, open] = await Promise.all([listVolunteerTasks(user, "current"), user.available ? listOpenTasks(user, 10) : Promise.resolve([])]);
      for (const t of open.filter((t) => t.offerStatus === "OFFERED")) {
        add({ title: `Pickup assigned to you: “${t.foodType}”`, detail: "Accept or decline soon; it moves on if you don’t reply.", href: `/volunteer/tasks/${t.id}`, priority: "high" });
      }
      for (const t of current) {
        const next = t.status === "ASSIGNED" ? "Collect it and confirm pickup." : t.status === "PICKED_UP" ? "Start the delivery." : "Deliver it and confirm delivery.";
        add({ title: `Your task: “${t.foodType}”`, detail: next, href: `/volunteer/tasks/${t.id}`, priority: "high" });
      }
      const pool = open.filter((t) => t.offerStatus !== "OFFERED").length;
      if (pool) add({ title: `${pool} open pickup${pool > 1 ? "s" : ""} nearby`, detail: "Anyone can take these.", href: "/volunteer", priority: "normal" });
      if (!user.available) add({ title: "You’re offline", detail: "Switch to Available to get pickups.", href: "/volunteer", priority: "normal" });
      if (user.lat === null) add({ title: "Set your location", detail: "So the nearest pickups come to you first.", href: "/volunteer", priority: "normal" });
    }
  }

  if (user.role === "admin") {
    const [pending, safety] = await Promise.all([listUsers({ status: "pending" }, 50), getSafetyOverview()]);
    const verify = pending.filter((u) => u.role !== "donor");
    if (verify.length) add({ title: `Verify ${verify.length} partner account${verify.length > 1 ? "s" : ""}`, detail: "NGOs and volunteers waiting for review.", href: "/admin/users?status=pending", priority: "high" });
    for (const d of safety.flagged) add({ title: `Finish the safety check for “${d.foodType}”`, detail: d.safetyNote ?? d.donorName, href: `/admin/donations/${d.id}`, priority: "high" });
    for (const d of safety.expiring) add({ title: `“${d.foodType}” expires ${remainingLabel(d.expiresAt)}`, detail: `${d.donorName} · ${d.status.toLowerCase().replace("_", " ")}`, href: `/admin/donations/${d.id}`, priority: d.status === "PENDING" ? "normal" : "high" });
  }

  return { items: items.slice(0, 20), unread };
}
