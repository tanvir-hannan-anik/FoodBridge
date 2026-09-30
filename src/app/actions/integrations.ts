"use server";

import { revalidatePath } from "next/cache";
import { CHAT_CHANNELS, type ChatChannel } from "@/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { createLinkCode, unlinkChannel } from "@/lib/integrations/service";

const isChannel = (c: string): c is ChatChannel => (CHAT_CHANNELS as readonly string[]).includes(c);

/** A one-time code the user sends from WhatsApp/Messenger ("LINK 123456") to link that chat. */
export async function getChatLinkCode(channel: string): Promise<{ code: string; expires: string } | null> {
  const user = await requireUser();
  if (!isChannel(channel) || !process.env.INTEGRATION_SECRET) return null;
  const { code, expires } = await createLinkCode(user.id, channel);
  return { code, expires: expires.toISOString() };
}

export async function unlinkChat(channel: string) {
  const user = await requireUser();
  if (!isChannel(channel)) return;
  await unlinkChannel(user.id, channel);
  revalidatePath("/profile");
}
