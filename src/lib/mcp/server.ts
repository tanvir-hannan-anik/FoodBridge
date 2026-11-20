import "server-only";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { User } from "@/db/schema";
import { getDonorDonation } from "@/lib/donations/service";
import { getNgoDonation, listAvailableDonations, listNgoRequests } from "@/lib/ngo/service";
import { getVolunteerTask, listVolunteerTasks } from "@/lib/volunteer/service";

// Explicit projections prevent contacts, coordinates, photos and internal notes leaking.
function project(row: { id: string; foodType: string; quantity: number; unit: string; status: string; pickupAt: Date; expiresAt: Date; deliverBy?: Date | null }) {
  return { id: row.id, foodType: row.foodType, quantity: row.quantity, unit: row.unit,
    status: row.status, availableAt: row.pickupAt.toISOString(), expiresAt: row.expiresAt.toISOString(),
    deliverBy: row.deliverBy?.toISOString() ?? null };
}

const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const result = (data: Record<string, unknown>) => ({ content: [{ type: "text" as const, text: JSON.stringify(data) }], structuredContent: data });
const denied = () => ({ ...result({ error: "Not available or not permitted." }), isError: true });

/** One server per authenticated caller. Never share a server between user sessions. */
export function createFoodBridgeMcpServer(user: User) {
  const server = new McpServer({ name: "foodbridge", version: "1.0.0" });
  const guarded = async (read: () => Promise<ReturnType<typeof result>>) => {
    if (user.status !== "active") return denied();
    try { return await read(); } catch {
      console.error("[mcp] Backend read failed");
      return { ...result({ error: "FoodBridge data is temporarily unavailable." }), isError: true };
    }
  };
  server.registerTool("get_available_donations", {
    description: "Available unexpired food for verified NGOs. Pickup location is an area, never a private address.",
    inputSchema: { limit: z.number().int().min(1).max(50).default(20) }, annotations,
  }, ({ limit }) => guarded(async () => {
    if (user.role !== "ngo") return denied();
    const rows = await listAvailableDonations(user.id, {}, limit);
    return result({ donations: rows.map((r) => ({ ...project(r), pickupLocation: r.donorArea })), limit });
  }));
  server.registerTool("get_donation_status", {
    description: "Read a donation visible to the current donor, NGO or volunteer by its UUID.",
    inputSchema: { donationId: z.string().uuid() }, annotations,
  }, ({ donationId }) => guarded(async () => {
    const row = user.role === "donor" ? await getDonorDonation(user.id, donationId)
      : user.role === "ngo" ? await getNgoDonation(user.id, donationId)
      : user.role === "volunteer" ? await getVolunteerTask(user, donationId) : null;
    if (!row) return denied();
    return result({ donation: { ...project(row),
      events: "events" in row ? row.events.map((e) => ({ status: e.status, at: e.createdAt.toISOString() }))
        : [row.pickup, row.transit, row.delivery].filter((e) => e !== null).map((e) => ({ status: e.status, at: e.createdAt.toISOString() })) } });
  }));
  server.registerTool("get_volunteer_assignments", {
    description: "Current or completed assignments for this volunteer, or accepted deliveries for this NGO. No other user's assignments.",
    inputSchema: { view: z.enum(["current", "completed"]).default("current"), limit: z.number().int().min(1).max(50).default(20) }, annotations,
  }, ({ view, limit }) => guarded(async () => {
    if (user.role === "volunteer") return result({ assignments: (await listVolunteerTasks(user, view, limit)).map(project), limit });
    if (user.role !== "ngo") return denied();
    const statuses = view === "current" ? ["ASSIGNED", "PICKED_UP", "IN_TRANSIT"] : ["DELIVERED", "COMPLETED"];
    const rows = (await listNgoRequests(user.id)).filter((r) => r.status === "ACCEPTED" && statuses.includes(r.donationStatus)).slice(0, limit);
    return result({ assignments: rows.map((r) => ({ id: r.donationId, foodType: r.foodType, quantity: r.quantity, unit: r.unit, status: r.donationStatus })), limit });
  }));
  return server;
}
