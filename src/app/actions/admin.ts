"use server";

import { revalidatePath } from "next/cache";
import {
  adminCancelClaim,
  adminCancelDonation,
  adminCancelNeed,
  adminCompleteDonation,
  adminConfirmDelivery,
  adminOfferToVolunteer,
  adminReleaseVolunteer,
  setUserStatus,
  updateDonationDetails,
  type UserAction,
} from "@/lib/admin/service";
import { requireRole } from "@/lib/auth/dal";
import { adminAcceptMatch, adminCancelMatch, adminRejectMatch } from "@/lib/admin/matching";
import { clearSafetyFlag, disableDonation, flagDonation } from "@/lib/safety/service";
import {
  adminDeliverySchema,
  adminDonationSchema,
  adminOfferSchema,
  completeSchema,
  fieldErrors,
  formValues,
  reasonSchema,
  type FormState,
} from "@/lib/validation";
import { isId } from "@/lib/utils";

const USER_ACTIONS: UserAction[] = ["approve", "suspend", "deactivate", "reactivate"];

function reason(formData?: FormData) {
  const parsed = reasonSchema.safeParse(formData ? formValues(formData) : {});
  return parsed.success ? parsed.data.reason : null;
}

function refresh() {
  // Admin changes show up in every portal (status, notifications, lists).
  revalidatePath("/", "layout");
}

export async function changeUserStatus(userId: string, action: UserAction, formData?: FormData) {
  const admin = await requireRole("admin");
  if (!isId(userId)) return;
  if (!USER_ACTIONS.includes(action)) return;
  await setUserStatus(admin.id, userId, action, reason(formData));
  refresh();
}

export async function editDonation(donationId: string, _: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("admin");
  if (!isId(donationId)) return { message: "This item is no longer available. Please refresh the page." };
  const parsed = adminDonationSchema.safeParse(formValues(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const result = await updateDonationDetails(admin.id, donationId, parsed.data);
  if (result !== true) return { message: result };
  refresh();
  return { success: "Donation updated." };
}

export async function cancelDonationAsAdmin(donationId: string, formData: FormData) {
  const admin = await requireRole("admin");
  if (!isId(donationId)) return;
  await adminCancelDonation(admin.id, donationId, reason(formData));
  refresh();
}

export async function releaseVolunteer(donationId: string) {
  const admin = await requireRole("admin");
  if (!isId(donationId)) return;
  await adminReleaseVolunteer(admin.id, donationId);
  refresh();
}

export async function cancelRequestAsAdmin(requestId: string) {
  const admin = await requireRole("admin");
  if (!isId(requestId)) return;
  await adminCancelClaim(admin.id, requestId);
  refresh();
}

export async function acceptMatchAsAdmin(requestId: string) {
  const admin = await requireRole("admin");
  if (!isId(requestId)) return;
  await adminAcceptMatch(admin.id, requestId);
  refresh();
}

export async function rejectMatchAsAdmin(requestId: string) {
  const admin = await requireRole("admin");
  if (!isId(requestId)) return;
  await adminRejectMatch(admin.id, requestId);
  refresh();
}

export async function cancelMatchAsAdmin(requestId: string, formData?: FormData) {
  const admin = await requireRole("admin");
  if (!isId(requestId)) return;
  await adminCancelMatch(admin.id, requestId, reason(formData));
  refresh();
}

/** Food safety: pause for a check, lift the pause, or withdraw the food as unsafe. */
export async function flagDonationAsAdmin(donationId: string, formData: FormData) {
  const admin = await requireRole("admin");
  if (!isId(donationId)) return;
  await flagDonation(admin.id, donationId, reason(formData));
  refresh();
}

export async function clearSafetyFlagAsAdmin(donationId: string) {
  const admin = await requireRole("admin");
  if (!isId(donationId)) return;
  await clearSafetyFlag(admin.id, donationId);
  refresh();
}

export async function disableDonationAsAdmin(donationId: string, formData: FormData) {
  const admin = await requireRole("admin");
  if (!isId(donationId)) return;
  await disableDonation(admin.id, donationId, reason(formData));
  refresh();
}

export async function cancelNeedAsAdmin(needId: string, formData: FormData) {
  const admin = await requireRole("admin");
  if (!isId(needId)) return;
  await adminCancelNeed(admin.id, needId, reason(formData));
  refresh();
}

/* Resolving stuck work: each keeps the normal workflow (and its notices) and is written to the activity log. */

const GONE = "This item is no longer available. Please refresh the page.";

export async function offerToVolunteerAsAdmin(donationId: string, _: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("admin");
  if (!isId(donationId)) return { message: GONE };
  const parsed = adminOfferSchema.safeParse(formValues(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const result = await adminOfferToVolunteer(admin.id, donationId, parsed.data.volunteerId);
  if (result !== true) return { message: result };
  refresh();
  return { success: "Pickup offered. They’ll be asked to accept or decline." };
}

export async function confirmDeliveryAsAdmin(donationId: string, _: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("admin");
  if (!isId(donationId)) return { message: GONE };
  const parsed = adminDeliverySchema.safeParse(formValues(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const ok = await adminConfirmDelivery(admin.id, donationId, parsed.data.reason);
  if (!ok) return { message: "Only food that has been picked up can be marked as delivered." };
  refresh();
  return { success: "Delivery recorded." };
}

export async function completeAsAdmin(donationId: string, _: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("admin");
  if (!isId(donationId)) return { message: GONE };
  const parsed = completeSchema.safeParse(formValues(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const ok = await adminCompleteDonation(admin.id, donationId, parsed.data.mealsServed);
  if (!ok) return { message: "Only delivered food can be marked as distributed." };
  refresh();
  return { success: "Meals served recorded." };
}
