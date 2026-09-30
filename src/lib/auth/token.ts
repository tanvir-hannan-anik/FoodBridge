import { jwtVerify, SignJWT } from "jose";
import type { Role } from "@/db/schema";
import { isRole } from "./roles";

/*
 * Stateless session: a signed (HS256) JWT stored in an httpOnly cookie.
 * Kept free of `next/headers` so the proxy can use it too.
 */

export const SESSION_COOKIE = "fb_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

/** `v` is the user's session version when the token was issued (older tokens without it count as 0). */
export type SessionPayload = { userId: string; role: Role; name: string; v?: number };

function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters (see .env.example).");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), { algorithms: ["HS256"] });
    if (typeof payload.userId !== "string" || !isRole(payload.role) || typeof payload.name !== "string") return null;
    const v = typeof payload.v === "number" ? payload.v : 0;
    return { userId: payload.userId, role: payload.role, name: payload.name, v };
  } catch {
    return null;
  }
}
