"use client";

import { useState, useTransition } from "react";
import { getChatLinkCode, unlinkChat } from "@/app/actions/integrations";
import { useI18n } from "@/components/i18n-provider";
import type { ChatChannel } from "@/db/schema";
import { CHAT_CHANNEL_LABEL, LINK_CODE_MINUTES } from "@/lib/integrations/meta";

type Link = { channel: ChatChannel; linked: boolean };

/** Profile card body: link or unlink WhatsApp / Messenger with a one-time code. */
export function ChatLinks({ links, enabled, whatsappNumber, messengerPage }: { links: Link[]; enabled: boolean; whatsappNumber?: string; messengerPage?: string }) {
  const { t } = useI18n();
  if (!enabled) {
    return (
      <p className="text-sm text-ink-500">
        {t("Chat apps aren’t switched on for FoodBridge yet. You’ll be able to link WhatsApp and Messenger here once they are.")}
      </p>
    );
  }
  return (
    <ul className="divide-y divide-cream-200">
      {links.map((l) => (
        <ChatLinkRow key={l.channel} link={l} whatsappNumber={whatsappNumber} messengerPage={messengerPage} />
      ))}
    </ul>
  );
}

function ChatLinkRow({ link, whatsappNumber, messengerPage }: { link: Link; whatsappNumber?: string; messengerPage?: string }) {
  const [code, setCode] = useState<{ code: string; expires: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const { t, number } = useI18n();
  const label = t(CHAT_CHANNEL_LABEL[link.channel]);
  const open =
    code && link.channel === "whatsapp" && whatsappNumber
      ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(`LINK ${code.code}`)}`
      : code && link.channel === "messenger" && messengerPage
        ? `https://m.me/${encodeURIComponent(messengerPage)}`
        : null;

  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-brand-950">{label}</p>
          <p className="text-sm text-ink-500">
            {t(link.linked ? "Linked. You get key updates here and can post by chat." : "Post food or requests and get key updates by chat.")}
          </p>
        </div>
        {link.linked ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => start(() => unlinkChat(link.channel))}
            className="h-9 rounded-full border border-brand-900/15 px-4 text-sm font-semibold text-brand-900 hover:bg-cream-100 disabled:opacity-50"
          >
            {t("Unlink")}
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await getChatLinkCode(link.channel);
                if (result) {
                  setCode(result);
                  setError(null);
                } else setError(t("Couldn’t create a code. Please try again."));
              })
            }
            className="h-9 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {code ? t("New code") : t("Link {app}", { app: label })}
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      {code && !link.linked && (
        <div className="mt-3 rounded-2xl bg-cream-50 p-4 text-sm text-ink-700">
          <p>{t("Send this message to FoodBridge on {app} within {n} minutes:", { app: label, n: number(LINK_CODE_MINUTES) })}</p>
          <p className="mt-2 font-mono text-2xl font-semibold tracking-widest text-brand-950">LINK {code.code}</p>
          {open && (
            <a href={open} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex h-9 items-center rounded-full bg-brand-950 px-4 text-sm font-semibold text-cream-50">
              {t("Open {app}", { app: label })}
            </a>
          )}
          <p className="mt-2 text-xs text-ink-500">{t("Never share this code. Refresh the page after linking.")}</p>
        </div>
      )}
    </li>
  );
}
