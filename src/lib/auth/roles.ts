import type { Role } from "@/db/schema";

export const ROLE_HOME: Record<Role, string> = {
  donor: "/donor",
  ngo: "/ngo",
  volunteer: "/volunteer",
  admin: "/admin",
};

export const ROLE_LABEL: Record<Role, string> = {
  donor: "Donor",
  ngo: "NGO",
  volunteer: "Volunteer",
  admin: "Admin",
};

/**
 * Who can create their own account.
 * - donor:     yes, active immediately.
 * - ngo:       yes, account starts "pending" (browse only) until an admin verifies it.
 * - volunteer: yes, account starts "pending" (dashboard and profile only) until an admin verifies it.
 * - admin:     never; admins are created by another admin or seeded.
 * Only roles with `open: true` show a working form.
 */
export const SELF_REGISTRATION: Record<Exclude<Role, "admin">, { open: boolean }> = {
  donor: { open: true },
  ngo: { open: true },
  volunteer: { open: true },
};

export function isRole(value: unknown): value is Role {
  return value === "donor" || value === "ngo" || value === "volunteer" || value === "admin";
}

/** Only allow same-site relative redirects, and only into the user's own area (or /profile). */
export function safeRedirectFor(role: Role, next: string | null | undefined) {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    if (next === "/profile" || next === ROLE_HOME[role] || next.startsWith(`${ROLE_HOME[role]}/`)) return next;
  }
  return ROLE_HOME[role];
}
