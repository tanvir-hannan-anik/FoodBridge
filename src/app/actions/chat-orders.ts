"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/dal";
import {
  assignChatOrder,
  confirmChatDelivery,
  confirmChatPickup,
  handBackChatOrder,
  syncChatOrders,
  unassignChatOrder,
} from "@/lib/chat-orders/service";
import { chatAssignSchema, fieldErrors, formValues, type FormState } from "@/lib/validation";
import { isId } from "@/lib/utils";

const GONE = "This item is no longer available. Please refresh the page.";

function refresh() {
  revalidatePath("/ngo/chat-orders");
  revalidatePath("/volunteer", "layout");
}

async function verifiedNgo() {
  const ngo = await requireRole("ngo");
  return ngo.status === "active" ? { id: ngo.id, name: ngo.organizationName ?? ngo.name } : null;
}

/** Assign (or, before pickup, reassign) a chat order to a volunteer. */
export async function assignChatOrderAction(orderId: string, _: FormState, formData: FormData): Promise<FormState> {
  const ngo = await verifiedNgo();
  if (!ngo) return { message: "Your NGO must be verified before you can assign orders." };
  if (!isId(orderId)) return { message: GONE };
  const parsed = chatAssignSchema.safeParse(formValues(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const result = await assignChatOrder(ngo, orderId, parsed.data.volunteerId);
  refresh();
  if (result !== true) return { message: result };
  return { success: "Volunteer assigned. They’ve been notified." };
}

export async function unassignChatOrderAction(orderId: string) {
  const ngo = await verifiedNgo();
  if (!ngo || !isId(orderId)) return;
  await unassignChatOrder(ngo, orderId);
  refresh();
}

export async function receiveChatOrderAction(orderId: string) {
  const ngo = await verifiedNgo();
  if (!ngo || !isId(orderId)) return;
  await confirmChatDelivery({ id: ngo.id, role: "ngo" }, orderId);
  refresh();
}

/** "Check for new messages" on the NGO page. */
export async function refreshChatOrdersAction() {
  await requireRole("ngo");
  await syncChatOrders({ force: true });
  refresh();
}

export async function chatPickupAction(orderId: string) {
  const volunteer = await requireRole("volunteer");
  if (!isId(orderId)) return;
  await confirmChatPickup(volunteer.id, orderId);
  refresh();
}

export async function chatDeliveryAction(orderId: string) {
  const volunteer = await requireRole("volunteer");
  if (!isId(orderId)) return;
  await confirmChatDelivery({ id: volunteer.id, role: "volunteer" }, orderId);
  refresh();
}

export async function chatHandBackAction(orderId: string) {
  const volunteer = await requireRole("volunteer");
  if (!isId(orderId)) return;
  await handBackChatOrder({ id: volunteer.id, name: volunteer.name }, orderId);
  refresh();
}
