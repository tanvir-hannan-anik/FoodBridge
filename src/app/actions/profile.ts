"use server";

import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { recordActivity } from "@/lib/admin/log";
import { requireUser } from "@/lib/auth/dal";
import { createSession } from "@/lib/auth/session";
import { fieldErrors, formValues, passwordChangeSchema, pin, profileSchema, type FormState } from "@/lib/validation";

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(formValues(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;

  const db = await getDb();
  await db
    .update(users)
    .set({
      name: d.name,
      phone: d.phone,
      organizationName: user.donorType === "individual" ? null : d.organizationName || user.organizationName,
      address: d.address || null,
      area: d.area || null,
      ...pin(d.lat, d.lng),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  // Keep the name shown in the navbar in sync.
  await createSession({ userId: user.id, role: user.role, name: d.name, v: user.sessionVersion });
  revalidatePath("/", "layout");
  return { success: "Profile saved." };
}

export async function changePassword(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = passwordChangeSchema.safeParse(formValues(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  if (!(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
    return { errors: { currentPassword: ["Current password is incorrect."] } };
  }
  const db = await getDb();
  // A new session version signs out every other device; this one gets a fresh cookie.
  const [row] = await db
    .update(users)
    .set({
      passwordHash: await bcrypt.hash(parsed.data.newPassword, 12),
      sessionVersion: sql`${users.sessionVersion} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning({ v: users.sessionVersion });
  await createSession({ userId: user.id, role: user.role, name: user.name, v: row.v });
  await recordActivity({ actorId: user.id, action: "password_change", targetType: "user", targetId: user.id });
  return { success: "Password updated. Other devices have been signed out." };
}
