import * as z from "zod";
import { CHAT_CHANNELS } from "@/db/schema";
import { hasBearerSecret } from "@/lib/auth/bearer";
import { handleInbound } from "@/lib/integrations/service";

/*
 * Incoming WhatsApp / Messenger messages, forwarded by n8n (Segment 17).
 *   POST { channel: "whatsapp" | "messenger", from: "<sender id>", text: "<message>" }
 *   Authorization: Bearer <INTEGRATION_SECRET>
 * Answers { reply } for n8n to send back to the sender. Disabled when INTEGRATION_SECRET is unset.
 */

const bodySchema = z.object({
  channel: z.enum(CHAT_CHANNELS),
  from: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(/^[\w+.:@-]+$/),
  text: z.string().trim().min(1).max(2000),
  messageId: z.string().max(200).optional(),
});

function authorised(request: Request) {
  return hasBearerSecret(request, process.env.INTEGRATION_SECRET);
}

export async function POST(request: Request) {
  if (!process.env.INTEGRATION_SECRET) return Response.json({ error: "Chat integration is not enabled." }, { status: 503 });
  if (!authorised(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid message", issues: z.flattenError(parsed.error).fieldErrors }, { status: 400 });

  try {
    const reply = await handleInbound(parsed.data);
    return Response.json({ reply }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("chat inbound failed", error);
    return Response.json({ reply: "Sorry, something went wrong on our side. Please try again in a moment." }, { status: 500 });
  }
}
