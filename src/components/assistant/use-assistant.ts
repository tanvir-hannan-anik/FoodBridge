"use client";

import { useCallback, useEffect, useState } from "react";
import type { AssistantReply } from "@/lib/ai/schemas";

export type ChatMessage = { id: string; role: "user" | "assistant"; content: string; data?: Omit<AssistantReply, "reply"> | null; error?: boolean };
export type ChatSummary = { id: string; title: string; updatedAt: string };

type Loaded = { enabled: boolean; conversations: ChatSummary[]; conversationId: string | null; messages: ChatMessage[] };

async function load(c: string): Promise<Loaded | null> {
  return fetch(`/api/assistant?c=${encodeURIComponent(c)}`, { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
}

/**
 * State for one assistant view (floating panel or full screen): the chat list, the open chat and
 * sending. `initial` is a chat id, "latest" or "new".
 */
export function useAssistant(initial: string) {
  const [enabled, setEnabled] = useState(true);
  const [conversations, setConversations] = useState<ChatSummary[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const apply = useCallback((data: Loaded | null) => {
    if (data) {
      setEnabled(data.enabled);
      setConversations(data.conversations);
      setConversationId(data.conversationId);
      setMessages(data.messages);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load(initial).then(apply);
  }, [initial, apply]);

  const open = useCallback(
    (id: string) => {
      setLoading(true);
      load(id).then(apply);
    },
    [apply],
  );

  const newChat = useCallback(() => {
    setConversationId(null);
    setMessages([]);
  }, []);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setBusy(true);
    setMessages((m) => [...m, { id: `u${Date.now()}`, role: "user", content: message }]);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, conversationId }),
      });
      const data = await res.json().catch(() => ({ error: "Something went wrong." }));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      const { reply, conversation, ...rest } = data as AssistantReply & { conversation: ChatSummary };
      setMessages((m) => [...m, { id: `a${Date.now()}`, role: "assistant", content: reply, data: rest }]);
      setConversationId(conversation.id);
      setConversations((list) => [conversation, ...list.filter((c) => c.id !== conversation.id)]);
    } catch (error) {
      setMessages((m) => [
        ...m,
        { id: `e${Date.now()}`, role: "assistant", content: error instanceof Error ? error.message : "Something went wrong.", error: true },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function rename(id: string, title: string) {
    const clean = title.trim();
    if (!clean) return;
    setConversations((list) => list.map((c) => (c.id === id ? { ...c, title: clean } : c)));
    await fetch("/api/assistant", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: id, title: clean }) }).catch(
      () => {},
    );
  }

  async function remove(id?: string) {
    await fetch(id ? `/api/assistant?c=${id}` : "/api/assistant", { method: "DELETE" }).catch(() => {});
    setConversations((list) => (id ? list.filter((c) => c.id !== id) : []));
    if (!id || id === conversationId) newChat();
  }

  return { enabled, conversations, conversationId, messages, loading, busy, send, open, newChat, rename, remove };
}
