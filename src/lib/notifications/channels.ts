import "server-only";

import type { NotificationType, NotifyChannel, Role } from "@/db/schema";
import type { NotificationCategory } from "./meta";

/*
 * Outside notification channels. Each is an adapter with the same two methods, so adding a real
 * provider (SendGrid, Twilio, WhatsApp Cloud API, Messenger) means changing only this file.
 *
 * Out of the box each channel posts a small JSON message to a webhook when one is configured
 * (NOTIFY_EMAIL_WEBHOOK_URL, NOTIFY_SMS_WEBHOOK_URL, NOTIFY_WHATSAPP_WEBHOOK_URL,
 * NOTIFY_MESSENGER_WEBHOOK_URL). Point it at a bridge service (or Zapier/Make) to go live.
 * Without a URL the channel reports "not configured" and queued messages are skipped.
 */

export type OutboundMessage = {
  /** `chatId` is the linked WhatsApp/Messenger sender id (null for email/SMS or when not linked). */
  to: { name: string; email: string; phone: string; role: Role; chatId: string | null };
  category: NotificationCategory;
  type: NotificationType;
  text: string;
  donationId: string | null;
  createdAt: Date;
};

export interface NotificationChannel {
  id: NotifyChannel;
  isConfigured(): boolean;
  send(message: OutboundMessage): Promise<void>;
}

function webhookChannel(id: NotifyChannel, envVar: string, address: (m: OutboundMessage) => string): NotificationChannel {
  return {
    id,
    isConfigured: () => !!process.env[envVar],
    async send(message) {
      const url = process.env[envVar];
      if (!url) throw new Error(`${envVar} is not set`);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(process.env.NOTIFY_WEBHOOK_TOKEN && { Authorization: `Bearer ${process.env.NOTIFY_WEBHOOK_TOKEN}` }) },
        body: JSON.stringify({
          channel: id,
          to: address(message),
          name: message.to.name,
          subject: `FoodBridge: ${message.text.slice(0, 60)}`,
          text: message.text,
          category: message.category,
          type: message.type,
          donationId: message.donationId,
          sentAt: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`${id} webhook answered ${res.status}`);
    },
  };
}

export const CHANNELS: Record<NotifyChannel, NotificationChannel> = {
  email: webhookChannel("email", "NOTIFY_EMAIL_WEBHOOK_URL", (m) => m.to.email),
  sms: webhookChannel("sms", "NOTIFY_SMS_WEBHOOK_URL", (m) => m.to.phone),
  // Chat apps go through n8n (Segment 17): the address is the id the user linked from that app.
  whatsapp: webhookChannel("whatsapp", "NOTIFY_WHATSAPP_WEBHOOK_URL", (m) => m.to.chatId ?? ""),
  messenger: webhookChannel("messenger", "NOTIFY_MESSENGER_WEBHOOK_URL", (m) => m.to.chatId ?? ""),
};

export function configuredChannels(): NotifyChannel[] {
  return (Object.keys(CHANNELS) as NotifyChannel[]).filter((c) => CHANNELS[c].isConfigured());
}
