import type { ReactNode } from "react";
import { Badge, Card } from "@/components/ui";
import type { ChatOrderSource, ChatOrderStatus } from "@/db/schema";
import { CHAT_STATUS_META, isStale } from "@/lib/chat-orders/meta";
import { mapSearchUrl } from "@/lib/geo";
import { getI18n } from "@/lib/i18n-server";

export type ChatOrderView = {
  id: string;
  source: ChatOrderSource;
  name: string | null;
  phone: string | null;
  location: string | null;
  food: string | null;
  quantity: string | null;
  goodFor: string | null;
  place: string | null;
  timeText: string | null;
  receivedAt: Date;
  status: ChatOrderStatus;
};

/** Where to search on the map: the pickup/delivery point plus the area it's in. */
export function placeQuery(o: Pick<ChatOrderView, "place" | "location">) {
  return [o.place, o.location].filter(Boolean).join(", ");
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-ink-500">{label}</dt>
      <dd className="text-sm break-words text-ink-800">{children}</dd>
    </div>
  );
}

/**
 * One message received over chat, shown exactly as the sender wrote it. `children` holds the
 * actions for the viewer (assign, confirm pickup…); `footer` extra facts such as the volunteer.
 */
export async function ChatOrderCard({ order: o, children, footer }: { order: ChatOrderView; children?: ReactNode; footer?: ReactNode }) {
  const { t, dateTime, relative } = await getI18n();
  const offer = o.source === "donation";
  const meta = CHAT_STATUS_META[o.status];
  const where = placeQuery(o);
  const stale = o.status === "NEW" && isStale(o.receivedAt);

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wider text-ink-500 uppercase">{t(offer ? "Food offer" : "Food request")}</p>
          <h3 className="mt-1 font-display text-lg font-semibold break-words text-brand-950">
            {o.food || t("Food")}
            {o.quantity && <span className="font-sans text-base font-medium text-ink-600"> · {o.quantity}</span>}
          </h3>
          <p className="mt-0.5 text-sm text-ink-600">
            {o.name || t(offer ? "Unnamed shop" : "Unnamed NGO")}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {stale && <Badge tone="danger">Older message</Badge>}
          <Badge tone={meta.tone}>{meta.label}</Badge>
        </div>
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {o.phone && (
          <Fact label={t("Phone")}>
            <a href={`tel:${o.phone.replace(/[^\d+]/g, "")}`} className="font-semibold text-brand-700 underline-offset-2 hover:underline">
              {o.phone}
            </a>
          </Fact>
        )}
        {o.location && <Fact label={t(offer ? "Shop location" : "NGO location")}>{o.location}</Fact>}
        {o.place && (
          <Fact label={t(offer ? "Pickup point" : "Deliver to")}>
            {o.place}
          </Fact>
        )}
        {o.goodFor && <Fact label={t("Food stays good for")}>{o.goodFor}</Fact>}
        {o.timeText && <Fact label={t(offer ? "Pick up before" : "Needed by")}>{o.timeText}</Fact>}
        <Fact label={t("Received")}>
          <time dateTime={o.receivedAt.toISOString()} title={dateTime(o.receivedAt)}>
            {relative(o.receivedAt)}
          </time>
        </Fact>
      </dl>

      {where && (
        <a
          href={mapSearchUrl(null, where)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex text-sm font-semibold text-brand-700 underline-offset-2 hover:underline"
        >
          {t("Open in Google Maps")}
        </a>
      )}
      {stale && <p className="mt-3 text-sm text-red-700">{t("This message is more than a day old. Call before sending anyone.")}</p>}
      {footer && <div className="mt-4 border-t border-cream-200 pt-4">{footer}</div>}
      {children && <div className="mt-4 border-t border-cream-200 pt-4">{children}</div>}
    </Card>
  );
}
