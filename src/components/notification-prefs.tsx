"use client";

import { updateNotificationPrefs } from "@/app/actions/notifications";
import { Alert, Button } from "@/components/ui";
import { useFormAction } from "@/components/ui/use-form-action";
import type { NotifyChannel } from "@/db/schema";
import { CHANNEL_LABEL } from "@/lib/notifications/meta";

// Keep the database schema module out of the client bundle.
const CHANNELS = Object.keys(CHANNEL_LABEL) as NotifyChannel[];

/**
 * In-app notifications are always on. Users can also opt into outside channels for important
 * updates; a channel FoodBridge hasn't connected yet is saved but only used once it's connected.
 */
export function NotificationPrefsForm({ selected, connected }: { selected: NotifyChannel[]; connected: NotifyChannel[] }) {
  const { state, action, onSubmit, pending } = useFormAction(updateNotificationPrefs);
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4">
      {state?.success && <Alert tone="success">{state.success}</Alert>}
      <p className="text-sm text-ink-600">
        You always get in-app notifications. Also send important updates (matches, pickups, deliveries, expiry warnings) by:
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {CHANNELS.map((c) => (
          <label key={c} className="flex items-start gap-3 rounded-2xl border border-cream-200 px-4 py-3 text-sm hover:bg-cream-50">
            <input type="checkbox" name="channels" value={c} defaultChecked={selected.includes(c)} className="mt-0.5 size-4 accent-brand-600" />
            <span>
              <span className="font-semibold text-brand-950">{CHANNEL_LABEL[c]}</span>
              <span className="block text-xs text-ink-500">{connected.includes(c) ? "Connected" : "Coming soon: saved for when it’s connected"}</span>
            </span>
          </label>
        ))}
      </div>
      <Button type="submit" variant="outline" loading={pending} className="rounded-full px-6">
        Save preferences
      </Button>
    </form>
  );
}
