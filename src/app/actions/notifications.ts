"use server";

import { revalidatePath } from "next/cache";
import { NOTIFY_CHANNELS, type NotifyChannel } from "@/db/schema";
import { requireUser } from "@/lib/auth/dal";
import { markAllRead, setNotifyChannels, setRead } from "@/lib/notifications/service";
import type { FormState } from "@/lib/validation";
import { isId } from "@/lib/utils";

/** Shared by every portal's notifications page. */
export async function markNotificationsRead() {
  const user = await requireUser();
  await markAllRead(user.id);
  revalidatePath("/", "layout");
}

export async function toggleNotificationRead(notificationId: string, read: boolean) {
  const user = await requireUser();
  if (!isId(notificationId)) return;
  await setRead(user.id, notificationId, read);
  revalidatePath("/", "layout");
}

/** Outside channels (email, SMS, WhatsApp, Messenger) for important updates. */
export async function updateNotificationPrefs(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const picked = formData.getAll("channels").filter((c): c is NotifyChannel => NOTIFY_CHANNELS.includes(c as NotifyChannel));
  await setNotifyChannels(user.id, [...new Set(picked)]);
  revalidatePath("/profile");
  return { success: "Notification preferences saved." };
}
