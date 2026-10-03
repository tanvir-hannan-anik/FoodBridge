"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { recordActivity } from "@/lib/admin/log";
import { safeRedirectFor } from "@/lib/auth/roles";
import { createSession, deleteSession } from "@/lib/auth/session";
import { clearRateLimit, clientIp, isRateLimited, rateLimited } from "@/lib/rate-limit";
import {
  donorRegisterSchema,
  fieldErrors,
  loginSchema,
  ngoRegisterSchema,
  volunteerRegisterSchema,
  formValues,
  type FormState,
} from "@/lib/validation";

// Compared against when the email is unknown, so response time doesn't reveal which emails exist.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= bcrypt.hash("not-a-real-password", 12));

/** Failed sign-ins allowed per account and per connection before a 15-minute pause. */
const LOGIN_LIMIT = { perEmail: 5, perIp: 20, windowMs: 15 * 60_000 };
/** New accounts per connection per hour (a campus or office may share one address). */
const SIGNUP_LIMIT = { perIp: 10, windowMs: 60 * 60_000 };
const TOO_MANY_LOGINS = "Too many sign-in attempts. Please wait 15 minutes and try again.";

async function signupLimited() {
  return rateLimited(`signup:${await clientIp()}`, SIGNUP_LIMIT.perIp, SIGNUP_LIMIT.windowMs);
}
const TOO_MANY_SIGNUPS = { message: "Too many new accounts from this connection. Please try again in an hour." };

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(formValues(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const emailKey = `login:${parsed.data.email}`;
  const ipKey = `login-ip:${await clientIp()}`;
  const { perEmail, perIp, windowMs } = LOGIN_LIMIT;
  if (isRateLimited(emailKey, perEmail, windowMs) || isRateLimited(ipKey, perIp, windowMs)) return { message: TOO_MANY_LOGINS };

  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  const ok = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !ok) {
    rateLimited(emailKey, perEmail, windowMs);
    rateLimited(ipKey, perIp, windowMs);
    // This failure used up the account's tries: worth a line in the admin activity log.
    if (user && isRateLimited(emailKey, perEmail, windowMs)) {
      await recordActivity({ actorId: null, action: "login_locked", targetType: "user", targetId: user.id, note: `${perEmail} failed sign-ins` });
    }
    return { message: "Email or password is incorrect." };
  }
  if (user.status === "suspended") return { message: "This account is suspended. Please contact support." };
  if (user.status === "deactivated") return { message: "This account has been deactivated. Please contact support to reopen it." };

  clearRateLimit(emailKey);
  await createSession({ userId: user.id, role: user.role, name: user.name, v: user.sessionVersion });
  redirect(safeRedirectFor(user.role, formData.get("next")?.toString()));
}

export async function registerDonor(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = donorRegisterSchema.safeParse(formValues(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  if (await signupLimited()) return TOO_MANY_SIGNUPS;

  const db = await getDb();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, d.email)).limit(1);
  if (existing) return { errors: { email: ["An account with this email already exists. Try logging in."] } };

  const [user] = await db
    .insert(users)
    .values({
      role: "donor",
      name: d.name,
      email: d.email,
      phone: d.phone,
      passwordHash: await bcrypt.hash(d.password, 12),
      donorType: d.donorType,
      organizationName: d.donorType === "individual" ? null : d.organizationName,
      address: d.address,
      area: d.area || null,
    })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id });
  if (!user) return { errors: { email: ["An account with this email already exists. Try logging in."] } };

  await createSession({ userId: user.id, role: "donor", name: d.name });
  // Straight on to the donation form the assistant filled in, when they came from there.
  const next = formData.get("next")?.toString();
  redirect(next?.startsWith("/donor/donate") ? safeRedirectFor("donor", next) : "/donor?welcome=1");
}

/** NGOs can sign up themselves; the account stays "pending" (browse only) until an admin verifies it. */
export async function registerNgo(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = ngoRegisterSchema.safeParse(formValues(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  if (await signupLimited()) return TOO_MANY_SIGNUPS;

  const db = await getDb();
  const [user] = await db
    .insert(users)
    .values({
      role: "ngo",
      status: "pending",
      name: d.name,
      email: d.email,
      phone: d.phone,
      passwordHash: await bcrypt.hash(d.password, 12),
      organizationName: d.organizationName,
      ngoType: d.ngoType,
      registrationNo: d.registrationNo,
      address: d.address,
      area: d.area,
      capacity: d.capacity,
    })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id });
  if (!user) return { errors: { email: ["An account with this email already exists. Try logging in."] } };

  await createSession({ userId: user.id, role: "ngo", name: d.name });
  redirect("/ngo?welcome=1");
}

/**
 * Volunteers can sign up themselves. They see donor and NGO addresses and phone numbers,
 * so the account stays "pending" (dashboard and profile only) until an admin verifies it.
 */
export async function registerVolunteer(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = volunteerRegisterSchema.safeParse(formValues(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  if (await signupLimited()) return TOO_MANY_SIGNUPS;

  const db = await getDb();
  const [user] = await db
    .insert(users)
    .values({
      role: "volunteer",
      status: "pending",
      name: d.name,
      email: d.email,
      phone: d.phone,
      passwordHash: await bcrypt.hash(d.password, 12),
      area: d.area,
    })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id });
  if (!user) return { errors: { email: ["An account with this email already exists. Try logging in."] } };

  await createSession({ userId: user.id, role: "volunteer", name: d.name });
  redirect("/volunteer?welcome=1");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
