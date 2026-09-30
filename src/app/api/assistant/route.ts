import * as z from "zod";
import { getCurrentUser } from "@/lib/auth/dal";
import { runAssistant } from "@/lib/ai/graph";
import { deleteConversations, latestConversationId, listConversations, loadConversation, renameConversation, saveTurn, toTurns } from "@/lib/ai/history";
import { aiEnabled, AiUnavailableError } from "@/lib/ai/provider";
import { rateLimited } from "@/lib/rate-limit";

/*
 * The AI assistant endpoint. Signed-in users only; the assistant sees only this user's own data
 * (through rule-based lookups) and can't change anything. Rate-limited per user.
 *
 *   GET    ?c=<id>|latest|new   chats list + the messages of one chat
 *   POST   { message, conversationId? }   one turn (starts a titled chat when no id)
 *   PATCH  { conversationId, title }      rename a chat
 *   DELETE ?c=<id>                        delete one chat (no id: every chat)
 */

const NO_STORE = { "Cache-Control": "no-store" };
const id = z.uuid();
const bodySchema = z.object({ message: z.string().trim().min(1).max(2000), conversationId: id.nullish() });
const renameSchema = z.object({ conversationId: id, title: z.string().trim().min(1).max(80) });

// Enough to stop runaway loops and abuse on a small deployment (see lib/rate-limit.ts).
const limited = (userId: string) => rateLimited(`assistant:${userId}`, 12, 60_000);

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const wanted = new URL(request.url).searchParams.get("c") ?? "latest";
  const conversationId = wanted === "new" ? null : wanted === "latest" ? await latestConversationId(user.id) : id.safeParse(wanted).success ? wanted : null;
  const [conversations, messages] = await Promise.all([
    listConversations(user.id),
    conversationId ? loadConversation(user.id, conversationId) : Promise.resolve([]),
  ]);
  return Response.json(
    { enabled: aiEnabled(), conversations, conversationId: messages ? conversationId : null, messages: messages ?? [] },
    { headers: NO_STORE },
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Please type a message (up to 2000 characters)." }, { status: 400 });
  if (limited(user.id)) return Response.json({ error: "You’re sending messages quickly. Please wait a moment." }, { status: 429 });

  try {
    const { message, conversationId } = parsed.data;
    const history = conversationId ? ((await loadConversation(user.id, conversationId, 16)) ?? []) : [];
    const reply = await runAssistant(user, message, toTurns(history));
    const conversation = await saveTurn(user.id, conversationId ?? null, message, reply);
    return Response.json({ ...reply, conversation }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof AiUnavailableError) return Response.json({ error: error.message }, { status: 503 });
    console.error("assistant failed", error);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const parsed = renameSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Give the chat a name (up to 80 characters)." }, { status: 400 });
  const ok = await renameConversation(user.id, parsed.data.conversationId, parsed.data.title);
  return ok ? new Response(null, { status: 204 }) : Response.json({ error: "Chat not found." }, { status: 404 });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const wanted = new URL(request.url).searchParams.get("c");
  if (wanted && !id.safeParse(wanted).success) return Response.json({ error: "Chat not found." }, { status: 404 });
  await deleteConversations(user.id, wanted ?? undefined);
  return new Response(null, { status: 204 });
}
