"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { requireRole } from "@/lib/auth/dal";
import { createSession } from "@/lib/auth/session";
import { setUserLocation } from "@/lib/location/service";
import { readPhoto } from "@/lib/uploads";
import {
  fieldErrors,
  formValues,
  pin,
  pinSchema,
  taskProofSchema,
  taskReasonSchema,
  volunteerProfileSchema,
  type FormState,
} from "@/lib/validation";
import {
  acceptTask as acceptTaskService,
  confirmDelivery,
  confirmPickup,
  declineTask,
  releaseTask,
  setAvailability,
  startDelivery,
} from "@/lib/volunteer/service";
import { isId } from "@/lib/utils";

function refresh() {
  // Donor and NGO pages show the same donation's progress.
  revalidatePath("/", "layout");
}

export async function acceptTask(donationId: string): Promise<FormState> {
  const volunteer = await requireRole("volunteer");
  if (!isId(donationId)) return { message: "This item is no longer available. Please refresh the page." };
  if (volunteer.status !== "active") return { message: "Your account must be verified before you can accept tasks." };
  if (!volunteer.available) return { message: "Switch to Available to accept new tasks." };

  const ok = await acceptTaskService(volunteer.id, donationId);
  if (!ok) return { message: "This task went to another volunteer, or the food is no longer available." };
  refresh();
  redirect(`/volunteer/tasks/${donationId}?accepted=1`);
}

function taskReason(formData?: FormData) {
  const parsed = taskReasonSchema.safeParse(formData ? formValues(formData) : {});
  return parsed.success ? parsed.data.reason : null;
}

/** Decline a task assigned to me: it goes to the next nearest volunteer. */
export async function declineTaskAction(donationId: string, formData?: FormData) {
  const volunteer = await requireRole("volunteer");
  if (!isId(donationId)) return;
  await declineTask(volunteer.id, donationId, taskReason(formData));
  refresh();
  redirect("/volunteer?declined=1");
}

/** Can't make it after accepting (before pickup): hand the task back so another volunteer gets it. */
export async function releaseTaskAction(donationId: string, formData?: FormData) {
  const volunteer = await requireRole("volunteer");
  if (!isId(donationId)) return;
  await releaseTask(volunteer.id, donationId, taskReason(formData));
  refresh();
  redirect("/volunteer?released=1");
}

/** "I’m on my way": Picked up → In transit. */
export async function startDeliveryAction(donationId: string) {
  const volunteer = await requireRole("volunteer");
  if (!isId(donationId)) return;
  await startDelivery(volunteer.id, donationId);
  refresh();
}

/** One-shot "use my current location" (no tracking): helps offer the nearest tasks. */
export async function saveMyLocation(lat: number, lng: number): Promise<FormState> {
  const volunteer = await requireRole("volunteer");
  const parsed = pinSchema.safeParse({ lat, lng });
  if (!parsed.success || parsed.data.lat === null) return { message: "That location doesn’t look right." };
  await setUserLocation(volunteer.id, parsed.data, true);
  revalidatePath("/volunteer", "layout");
  return { success: "Location updated." };
}

/** Shared by the pickup and delivery confirmations: optional note + optional photo. */
async function readProof(formData: FormData) {
  const { photo, ...fields } = formValues(formData);
  const parsed = taskProofSchema.safeParse(fields);
  const errors = parsed.success ? {} : fieldErrors(parsed.error);

  const upload = await readPhoto(photo);
  if ("error" in upload) errors.photo = [upload.error];
  if (!parsed.success || "error" in upload) return { errors } as const;
  return { note: parsed.data.note, image: upload.photo } as const;
}

export async function confirmTaskPickup(donationId: string, _: FormState, formData: FormData): Promise<FormState> {
  const volunteer = await requireRole("volunteer");
  if (!isId(donationId)) return { message: "This item is no longer available. Please refresh the page." };
  const proof = await readProof(formData);
  if ("errors" in proof) return { errors: proof.errors };

  const ok = await confirmPickup(volunteer.id, donationId, proof.note, proof.image);
  if (!ok) return { message: "This task can’t be marked as picked up. It may have been cancelled." };
  refresh();
  return { success: "Pickup confirmed. Now deliver it to the NGO." };
}

export async function confirmTaskDelivery(donationId: string, _: FormState, formData: FormData): Promise<FormState> {
  const volunteer = await requireRole("volunteer");
  if (!isId(donationId)) return { message: "This item is no longer available. Please refresh the page." };
  const proof = await readProof(formData);
  if ("errors" in proof) return { errors: proof.errors };

  const ok = await confirmDelivery(volunteer.id, donationId, proof.note, proof.image);
  if (!ok) return { message: "This task can’t be marked as delivered yet." };
  refresh();
  return { success: "Delivery completed. Thank you!" };
}

export async function toggleAvailability(available: boolean) {
  const volunteer = await requireRole("volunteer");
  await setAvailability(volunteer.id, available);
  revalidatePath("/volunteer", "layout");
  revalidatePath("/profile");
}

export async function updateVolunteerProfile(_: FormState, formData: FormData): Promise<FormState> {
  const volunteer = await requireRole("volunteer");
  const parsed = volunteerProfileSchema.safeParse(formValues(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;

  const db = await getDb();
  await db
    .update(users)
    .set({
      name: d.name,
      phone: d.phone,
      area: d.area,
      address: d.address,
      description: d.description,
      ...pin(d.lat, d.lng),
      updatedAt: new Date(),
    })
    .where(eq(users.id, volunteer.id));

  await createSession({ userId: volunteer.id, role: "volunteer", name: d.name, v: volunteer.sessionVersion });
  revalidatePath("/", "layout");
  return { success: "Profile saved." };
}
