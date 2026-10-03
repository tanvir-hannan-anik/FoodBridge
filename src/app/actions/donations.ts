"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/dal";
import {
  advanceDonationDemo,
  cancelDonation as cancelDonationService,
  createDonation as createDonationService,
} from "@/lib/donations/service";
import { acceptRequest, declineRequest } from "@/lib/ngo/service";
import { matchOpenNeeds, proposeDonationToNeed, respondToNeed } from "@/lib/requests/service";
import { readPhoto } from "@/lib/uploads";
import { cancelSchema, donationSchema, fieldErrors, formValues, needResponseSchema, type FormState } from "@/lib/validation";
import { isId } from "@/lib/utils";

export async function createDonation(_: FormState, formData: FormData): Promise<FormState> {
  const donor = await requireRole("donor");

  const { image, ...fields } = formValues(formData);
  const parsed = donationSchema.safeParse(fields);
  const errors = parsed.success ? {} : fieldErrors(parsed.error);

  const upload = await readPhoto(image);
  if ("error" in upload) errors.image = [upload.error];

  if (!parsed.success || "error" in upload) {
    return { errors, message: "Please fix the highlighted fields." };
  }

  const id = await createDonationService(donor.id, parsed.data, upload.photo);
  // Posted for a specific NGO request: offer it to that NGO first (they still confirm it).
  const needId = fields.needId;
  if (typeof needId === "string" && isId(needId)) await proposeDonationToNeed(donor.id, id, needId);
  // Offer the new food to NGOs whose open requests it fits.
  await matchOpenNeeds();
  revalidatePath("/donor", "layout");
  redirect(`/donor/donations/${id}?created=1`);
}

export async function cancelDonation(donationId: string, formData: FormData) {
  const donor = await requireRole("donor");
  if (!isId(donationId)) return;
  const parsed = cancelSchema.safeParse(formValues(formData));
  await cancelDonationService(donor.id, donationId, parsed.success ? parsed.data.reason : undefined);
  revalidatePath("/donor", "layout");
}

export async function advanceDemo(donationId: string) {
  if (process.env.DEMO_MODE !== "true") return;
  const donor = await requireRole("donor");
  if (!isId(donationId)) return;
  await advanceDonationDemo({ donorId: donor.id }, donationId);
  revalidatePath("/donor", "layout");
}

export async function acceptFoodRequest(requestId: string) {
  const donor = await requireRole("donor");
  if (!isId(requestId)) return;
  await acceptRequest(donor.id, requestId);
  // A partly allocated donation leaves a remainder that open food requests may want.
  await matchOpenNeeds();
  revalidatePath("/", "layout");
}

export async function declineFoodRequest(requestId: string) {
  const donor = await requireRole("donor");
  if (!isId(requestId)) return;
  await declineRequest(donor.id, requestId);
  revalidatePath("/donor", "layout");
}

/**
 * A donor answers an NGO food request with a short comment ("I’ll have food left tonight, I can
 * give this"). With intent=donate they go on to post the food, pre-filled from the request.
 */
export async function replyToNeed(needId: string, _: FormState, formData: FormData): Promise<FormState> {
  const donor = await requireRole("donor");
  if (!isId(needId)) return { message: "This request is no longer open." };
  const values = formValues(formData);
  const parsed = needResponseSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const error = await respondToNeed(donor.id, needId, parsed.data.message);
  if (error) return { message: error };
  revalidatePath("/donor", "layout");
  if (values.intent === "donate") redirect(`/donor/donate?need=${needId}`);
  return { success: "Sent. The NGO can see your reply." };
}
