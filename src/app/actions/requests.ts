"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/dal";
import { cancelMatch } from "@/lib/matching/service";
import { acceptMatch, createNeed, endNeed, matchOpenNeeds, skipMatch, updateNeed } from "@/lib/requests/service";
import { fieldErrors, formValues, needSchema, taskReasonSchema, type FormState } from "@/lib/validation";
import { isId } from "@/lib/utils";

/** Only verified (active) NGOs can post food requests or accept matches. */
async function requireVerifiedNgo() {
  const ngo = await requireRole("ngo");
  if (ngo.status !== "active") redirect("/ngo");
  return ngo;
}

function refresh() {
  revalidatePath("/ngo", "layout");
  revalidatePath("/donor", "layout");
}

export async function createNeedAction(_: FormState, formData: FormData): Promise<FormState> {
  const ngo = await requireRole("ngo");
  if (ngo.status !== "active") return { message: "Your NGO must be verified before you can post food requests." };
  const parsed = needSchema.safeParse(formValues(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };

  const id = await createNeed(ngo.id, parsed.data);
  refresh();
  redirect(`/ngo/requests/${id}?created=1`);
}

export async function updateNeedAction(needId: string, _: FormState, formData: FormData): Promise<FormState> {
  const ngo = await requireVerifiedNgo();
  if (!isId(needId)) return { message: "This item is no longer available. Please refresh the page." };
  const parsed = needSchema.safeParse(formValues(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };

  const ok = await updateNeed(ngo.id, needId, parsed.data);
  if (!ok) return { message: "This request can’t be changed any more: food has already been accepted for it." };
  refresh();
  redirect(`/ngo/requests/${needId}?updated=1`);
}

export async function cancelNeedAction(needId: string) {
  const ngo = await requireVerifiedNgo();
  if (!isId(needId)) return;
  await endNeed(needId, "cancel", { ngoId: ngo.id });
  refresh();
}

/** "We have enough": stop matching more food to this request. */
export async function closeNeedAction(needId: string) {
  const ngo = await requireVerifiedNgo();
  if (!isId(needId)) return;
  await endNeed(needId, "close", { ngoId: ngo.id });
  refresh();
}

export async function acceptMatchAction(requestId: string, donationId: string): Promise<FormState> {
  const ngo = await requireRole("ngo");
  if (!isId(requestId, donationId)) return { message: "This item is no longer available. Please refresh the page." };
  if (ngo.status !== "active") return { message: "Your NGO must be verified before you can accept food." };
  const error = await acceptMatch(requestId, { ngoId: ngo.id, actorId: ngo.id });
  if (error) {
    refresh();
    return { message: error };
  }
  refresh();
  redirect(`/ngo/donations/${donationId}?accepted=1`);
}

/** Reject a proposed match; matching looks for other food. */
export async function skipMatchAction(requestId: string) {
  const ngo = await requireVerifiedNgo();
  if (!isId(requestId)) return;
  await skipMatch(ngo.id, requestId);
  refresh();
}

/** Cancel an allocated match before pickup: the food goes back to the pool and matching runs again. */
export async function cancelMatchAction(requestId: string, _: FormState, formData: FormData): Promise<FormState> {
  const ngo = await requireVerifiedNgo();
  if (!isId(requestId)) return { message: "This item is no longer available. Please refresh the page." };
  const parsed = taskReasonSchema.safeParse(formValues(formData));
  const error = await cancelMatch(requestId, { actorId: ngo.id, ngoId: ngo.id, reason: parsed.success ? parsed.data.reason : null });
  if (error) return { message: error };
  await matchOpenNeeds();
  revalidatePath("/", "layout");
  return { success: "Match cancelled. The food is available to other NGOs again." };
}
