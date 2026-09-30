"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { requireRole } from "@/lib/auth/dal";
import { createSession } from "@/lib/auth/session";
import { advanceDonationDemo } from "@/lib/donations/service";
import { cancelRequest, completeDonation, confirmReceived, createRequest } from "@/lib/ngo/service";
import { completeSchema, fieldErrors, foodRequestSchema, formValues, ngoProfileSchema, pin, type FormState } from "@/lib/validation";
import { isId } from "@/lib/utils";

/** Only verified (active) NGOs may request or handle food. */
async function requireVerifiedNgo() {
  const ngo = await requireRole("ngo");
  if (ngo.status !== "active") redirect("/ngo");
  return ngo;
}

function refresh() {
  revalidatePath("/ngo", "layout");
}

export async function requestFood(donationId: string, _: FormState, formData: FormData): Promise<FormState> {
  const ngo = await requireRole("ngo");
  if (!isId(donationId)) return { message: "This item is no longer available. Please refresh the page." };
  if (ngo.status !== "active") return { message: "Your NGO must be verified before you can request food." };

  const parsed = foodRequestSchema.safeParse(formValues(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };

  const error = await createRequest(ngo.id, donationId, parsed.data);
  if (error) return { message: error };
  refresh();
  redirect(`/ngo/donations/${donationId}?requested=1`);
}

export async function withdrawRequest(requestId: string, donationId: string) {
  const ngo = await requireRole("ngo");
  if (!isId(requestId, donationId)) return;
  await cancelRequest(ngo.id, requestId);
  refresh();
  redirect(`/ngo/donations/${donationId}`);
}

export async function markReceived(donationId: string) {
  const ngo = await requireVerifiedNgo();
  if (!isId(donationId)) return;
  await confirmReceived(ngo.id, donationId);
  refresh();
}

export async function markCompleted(donationId: string, _: FormState, formData: FormData): Promise<FormState> {
  const ngo = await requireVerifiedNgo();
  if (!isId(donationId)) return { message: "This item is no longer available. Please refresh the page." };
  const parsed = completeSchema.safeParse(formValues(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const ok = await completeDonation(ngo.id, donationId, parsed.data.mealsServed);
  if (!ok) return { message: "This donation can’t be completed yet." };
  refresh();
  return { success: "Marked as distributed. Thank you!" };
}

export async function advanceDemoAsNgo(donationId: string) {
  if (process.env.DEMO_MODE !== "true") return;
  const ngo = await requireVerifiedNgo();
  if (!isId(donationId)) return;
  await advanceDonationDemo({ ngoId: ngo.id }, donationId);
  refresh();
}

export async function updateNgoProfile(_: FormState, formData: FormData): Promise<FormState> {
  const ngo = await requireRole("ngo");
  const parsed = ngoProfileSchema.safeParse(formValues(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;

  const db = await getDb();
  await db
    .update(users)
    .set({
      organizationName: d.organizationName,
      ngoType: d.ngoType,
      registrationNo: d.registrationNo,
      name: d.name,
      phone: d.phone,
      address: d.address,
      area: d.area,
      capacity: d.capacity,
      description: d.description,
      ...pin(d.lat, d.lng),
      updatedAt: new Date(),
    })
    .where(eq(users.id, ngo.id));

  await createSession({ userId: ngo.id, role: "ngo", name: d.name, v: ngo.sessionVersion });
  revalidatePath("/", "layout");
  return { success: "Organisation profile saved." };
}
