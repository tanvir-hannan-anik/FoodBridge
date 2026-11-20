import { chatDeliveryAction, chatHandBackAction, chatPickupAction } from "@/app/actions/chat-orders";
import { ChatOrderCard, placeQuery } from "@/components/chat-orders/chat-order-card";
import { SubmitButton } from "@/components/ui";
import type { VolunteerChatOrder } from "@/lib/chat-orders/service";
import { directionsUrl, toPoint } from "@/lib/geo";
import { getI18n } from "@/lib/i18n-server";

/** Chat orders an NGO assigned to this volunteer: shop → NGO, with the next step as a button. */
export async function ChatOrderList({ items }: { items: VolunteerChatOrder[] }) {
  const { t, dateTime } = await getI18n();
  return (
    <div className="space-y-4">
      {items.map((o) => {
        const route = directionsUrl({
          destination: { point: toPoint(o.ngoLat, o.ngoLng), address: o.ngoAddress ?? o.ngoArea },
          waypoints: o.status === "ASSIGNED" ? [{ point: null, address: placeQuery(o) }] : [],
        });
        return (
          <ChatOrderCard
            key={o.id}
            order={o}
            footer={
              <div className="space-y-1 text-sm">
                <p className="text-xs font-medium text-ink-500">{t("Bring it to")}</p>
                <p className="font-semibold text-brand-950">{o.ngoName ?? t("The NGO")}</p>
                {(o.ngoAddress || o.ngoArea) && <p className="text-ink-700">{o.ngoAddress ?? o.ngoArea}</p>}
                {o.ngoPhone && (
                  <a href={`tel:${o.ngoPhone.replace(/[^\d+]/g, "")}`} className="font-semibold text-brand-700 hover:underline">
                    {o.ngoPhone}
                  </a>
                )}
                {o.status !== "DELIVERED" && (
                  <a href={route} target="_blank" rel="noreferrer" className="block font-semibold text-brand-700 underline-offset-2 hover:underline">
                    {t("Directions in Google Maps")}
                  </a>
                )}
                {o.deliveredAt && <p className="text-ink-600">{t("Delivered {time}", { time: dateTime(o.deliveredAt) })}</p>}
              </div>
            }
          >
            {o.status === "ASSIGNED" && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <form action={chatPickupAction.bind(null, o.id)} className="flex-1">
                  <SubmitButton block size="lg" pendingLabel="Saving…" className="rounded-full">
                    Confirm pickup
                  </SubmitButton>
                </form>
                <form action={chatHandBackAction.bind(null, o.id)}>
                  <SubmitButton variant="ghost" block size="lg" pendingLabel="Handing back…" className="rounded-full text-red-700 hover:bg-red-50">
                    I can’t do this
                  </SubmitButton>
                </form>
              </div>
            )}
            {o.status === "PICKED_UP" && (
              <form action={chatDeliveryAction.bind(null, o.id)}>
                <SubmitButton block size="lg" pendingLabel="Saving…" className="rounded-full">
                  Confirm delivery
                </SubmitButton>
              </form>
            )}
          </ChatOrderCard>
        );
      })}
    </div>
  );
}
