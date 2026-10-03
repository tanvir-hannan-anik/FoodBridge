import * as z from "zod";
import { DRAFT_FIELDS, runGuestAssistant, type DraftField } from "@/lib/ai/guest";
import { AiUnavailableError } from "@/lib/ai/provider";
import { donationDraftSchema } from "@/lib/ai/schemas";
import { getLang } from "@/lib/i18n-server";
import { clientIp, rateLimited } from "@/lib/rate-limit";

/*
 * The landing-page assistant for visitors (no account). Stateless: the browser sends the recent
 * turns and the donation draft so far, and gets the next reply and the updated draft back.
 * Nothing is stored, nothing is written. Rate-limited per IP.
 *
 *   POST { message, history?, draft?, asked? } → { reply, intent, draft, step, asked, sources?, aiUsed }
 */

const NO_STORE = { "Cache-Control": "no-store" };
const turn = z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) });
const bodySchema = z.object({
  message: z.string().trim().min(1).max(1000),
  history: z.array(turn).max(20).default([]),
  draft: donationDraftSchema.nullish(),
  asked: z.enum(DRAFT_FIELDS as [string, ...string[]]).nullish(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Please type a message (up to 1000 characters)." }, { status: 400 });
  if (rateLimited(`guest-assistant:${await clientIp()}`, 15, 60_000)) {
    return Response.json({ error: "You’re sending messages quickly. Please wait a moment." }, { status: 429 });
  }
  try {
    const { message, history, draft, asked } = parsed.data;
    // The model expects the conversation to start with the visitor (the greeting is the page's own).
    const first = history.findIndex((t) => t.role === "user");
    const turns = first === -1 ? [] : history.slice(first);
    const reply = await runGuestAssistant(message, turns, await getLang(), { draft: draft ?? null, asked: (asked ?? null) as DraftField | null });
    return Response.json(reply, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof AiUnavailableError) return Response.json({ error: error.message }, { status: 503 });
    console.error("guest assistant failed", error);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
