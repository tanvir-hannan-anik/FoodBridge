import "server-only";

import { and, desc, eq, inArray, notInArray } from "drizzle-orm";
import { getDb } from "@/db";
import { aiConversations, aiMessages } from "@/db/schema";
import type { ChatTurn } from "./provider";
import type { AssistantReply } from "./schemas";

/*
 * Assistant chats, like a chat app: each conversation has a title (from its first message) and
 * shows in the history sidebar. Only the last few turns of the open chat go to the AI as context.
 * Everything is scoped to the user in the query itself.
 */

/** Messages kept per chat and chats kept per user; older ones are trimmed. */
const KEEP_MESSAGES = 60;
const KEEP_CONVERSATIONS = 50;

export type StoredMessage = { id: string; role: "user" | "assistant"; content: string; data: Omit<AssistantReply, "reply"> | null; createdAt: Date };
export type ConversationSummary = { id: string; title: string; updatedAt: Date };

/** A short title from the first message: first line, cut at a word boundary. */
export function titleFrom(text: string) {
  const line = text.replace(/\s+/g, " ").trim();
  if (line.length <= 48) return line || "New chat";
  const cut = line.slice(0, 48);
  const space = cut.lastIndexOf(" ");
  return `${(space > 24 ? cut.slice(0, space) : cut).replace(/[,.;:!?-]+$/, "")}…`;
}

export async function listConversations(userId: string, limit = KEEP_CONVERSATIONS): Promise<ConversationSummary[]> {
  const db = await getDb();
  return db
    .select({ id: aiConversations.id, title: aiConversations.title, updatedAt: aiConversations.updatedAt })
    .from(aiConversations)
    .where(eq(aiConversations.userId, userId))
    .orderBy(desc(aiConversations.updatedAt))
    .limit(limit);
}

/** The conversation's messages, oldest first, or null if it isn't this user's. */
export async function loadConversation(userId: string, conversationId: string, limit = KEEP_MESSAGES): Promise<StoredMessage[] | null> {
  const db = await getDb();
  const [owned] = await db
    .select({ id: aiConversations.id })
    .from(aiConversations)
    .where(and(eq(aiConversations.id, conversationId), eq(aiConversations.userId, userId)));
  if (!owned) return null;
  const rows = await db
    .select()
    .from(aiMessages)
    .where(eq(aiMessages.conversationId, conversationId))
    .orderBy(desc(aiMessages.createdAt))
    .limit(limit);
  return rows.reverse().map((r) => ({
    id: r.id,
    role: r.role,
    content: r.content,
    createdAt: r.createdAt,
    data: r.data ? (JSON.parse(r.data) as StoredMessage["data"]) : null,
  }));
}

export const toTurns = (messages: StoredMessage[]): ChatTurn[] => messages.map((m) => ({ role: m.role, content: m.content }));

/**
 * Stores one question and answer. Without a conversation id (or with one that isn't the user's) a
 * new chat is started and titled from the question. Returns the conversation it was saved to.
 */
export async function saveTurn(userId: string, conversationId: string | null, input: string, reply: AssistantReply): Promise<ConversationSummary> {
  const db = await getDb();
  const { reply: text, ...data } = reply;
  const now = Date.now();
  return db.transaction(async (tx) => {
    let conversation: ConversationSummary | undefined;
    if (conversationId) {
      [conversation] = await tx
        .update(aiConversations)
        .set({ updatedAt: new Date(now + 1) })
        .where(and(eq(aiConversations.id, conversationId), eq(aiConversations.userId, userId)))
        .returning({ id: aiConversations.id, title: aiConversations.title, updatedAt: aiConversations.updatedAt });
    }
    if (!conversation) {
      [conversation] = await tx
        .insert(aiConversations)
        .values({ userId, title: titleFrom(input), createdAt: new Date(now), updatedAt: new Date(now + 1) })
        .returning({ id: aiConversations.id, title: aiConversations.title, updatedAt: aiConversations.updatedAt });
    }
    await tx.insert(aiMessages).values([
      { userId, conversationId: conversation.id, role: "user", content: input, createdAt: new Date(now) },
      { userId, conversationId: conversation.id, role: "assistant", content: text, data: JSON.stringify(data), createdAt: new Date(now + 1) },
    ]);

    const oldMessages = await tx
      .select({ id: aiMessages.id })
      .from(aiMessages)
      .where(eq(aiMessages.conversationId, conversation.id))
      .orderBy(desc(aiMessages.createdAt))
      .offset(KEEP_MESSAGES);
    if (oldMessages.length) await tx.delete(aiMessages).where(inArray(aiMessages.id, oldMessages.map((o) => o.id)));

    const keep = tx
      .select({ id: aiConversations.id })
      .from(aiConversations)
      .where(eq(aiConversations.userId, userId))
      .orderBy(desc(aiConversations.updatedAt))
      .limit(KEEP_CONVERSATIONS);
    await tx.delete(aiConversations).where(and(eq(aiConversations.userId, userId), notInArray(aiConversations.id, keep)));
    return conversation;
  });
}

export async function renameConversation(userId: string, conversationId: string, title: string) {
  const db = await getDb();
  const rows = await db
    .update(aiConversations)
    .set({ title: title.replace(/\s+/g, " ").trim().slice(0, 80) || "Untitled chat" })
    .where(and(eq(aiConversations.id, conversationId), eq(aiConversations.userId, userId)))
    .returning({ id: aiConversations.id });
  return rows.length > 0;
}

/** Deletes one chat (with its messages), or every chat when no id is given. */
export async function deleteConversations(userId: string, conversationId?: string) {
  const db = await getDb();
  await db
    .delete(aiConversations)
    .where(and(eq(aiConversations.userId, userId), conversationId ? eq(aiConversations.id, conversationId) : undefined));
}

/** The most recent chat, used when the floating panel opens. */
export async function latestConversationId(userId: string) {
  const db = await getDb();
  const [row] = await db
    .select({ id: aiConversations.id })
    .from(aiConversations)
    .where(eq(aiConversations.userId, userId))
    .orderBy(desc(aiConversations.updatedAt))
    .limit(1);
  return row?.id ?? null;
}

