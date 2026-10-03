"use client";

import Link from "next/link";
import { startTransition, useActionState, useState, type FormEvent } from "react";
import { replyToNeed } from "@/app/actions/donations";
import { useI18n } from "@/components/i18n-provider";
import { Alert, Textarea } from "@/components/ui";
import { CATEGORY_LABEL, UNIT_LABEL } from "@/lib/donations/meta";
import { formatDistance } from "@/lib/geo";
import type { NeedCardData } from "@/lib/requests/meta";
import { cn } from "@/lib/utils";

/** Open NGO food requests near the donor, each with "I can help" (reply, or reply and post the food). */
export function NeedBoard({ needs, compact = false }: { needs: NeedCardData[]; compact?: boolean }) {
  return (
    <ul className={cn("grid gap-4", !compact && "md:grid-cols-2")}>
      {needs.map((n) => (
        <li key={n.id} id={`need-${n.id}`} className="scroll-mt-24">
          <NeedCard need={n} />
        </li>
      ))}
    </ul>
  );
}

function NeedCard({ need }: { need: NeedCardData }) {
  const { t, number, relative, dateTime } = useI18n();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(replyToNeed.bind(null, need.id), undefined);
  const away = formatDistance(need.km);

  // Keeps the clicked button's intent (reply only / reply and post food) and what was typed.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const data = new FormData(e.currentTarget, submitter);
    startTransition(() => action(data));
  }

  const food = need.foodType || t(need.category ? CATEGORY_LABEL[need.category] : "Any food");
  return (
    <article className="flex h-full flex-col rounded-card border border-cream-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-widest text-accent-700 uppercase">{need.ngoName}</p>
          <h3 className="mt-1 font-display text-xl leading-snug font-semibold text-brand-950">
            {t("{food} for {n} people", { food, n: number(need.remaining) })}
          </h3>
        </div>
        <span className="shrink-0 rounded-full bg-accent-100 px-2.5 py-1 text-xs font-semibold text-accent-800">
          {t("Needed {when}", { when: relative(need.neededBy) })}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <div>
          <dt className="text-xs text-ink-500">{t("Area")}</dt>
          <dd className="text-ink-800">
            {need.area}
            {away && <span className="text-ink-500"> · {t("{d} away", { d: away })}</span>}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-500">{t("Amount asked")}</dt>
          <dd className="text-ink-800">
            {number(need.quantity)} {t(UNIT_LABEL[need.unit])}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-ink-500">{t("Needed by")}</dt>
          <dd className="text-ink-800">{dateTime(need.neededBy)}</dd>
        </div>
      </dl>
      {need.notes && <p className="mt-3 rounded-xl bg-cream-50 px-3 py-2 text-sm text-ink-700">“{need.notes}”</p>}

      {need.myMessage && (
        <p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-900">
          <span className="font-semibold">{t("Your reply")}:</span> {need.myMessage}
        </p>
      )}

      <div className="mt-auto pt-4">
        {need.myDonationId ? (
          <Link href={`/donor/donations/${need.myDonationId}`} className="text-sm font-semibold text-brand-700 hover:underline">
            {t("You posted food for this request. Follow it →")}
          </Link>
        ) : open ? (
          <form action={action} onSubmit={onSubmit} className="space-y-3">
            {state?.message && <Alert tone="error">{state.message}</Alert>}
            {state?.success && <Alert tone="success">{state.success}</Alert>}
            <Textarea
              label="Your reply to the NGO"
              name="message"
              rows={2}
              maxLength={300}
              defaultValue={need.myMessage ?? ""}
              placeholder="e.g. I’ll have some food left soon. I can give this."
              error={state?.errors?.message}
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                name="intent"
                value="donate"
                disabled={pending}
                className="inline-flex h-11 items-center justify-center rounded-full bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {t("Send and post the food")}
              </button>
              <button
                type="submit"
                name="intent"
                value="reply"
                disabled={pending}
                className="inline-flex h-11 items-center justify-center rounded-full border border-brand-900/15 px-5 text-sm font-semibold text-brand-800 hover:bg-cream-100 disabled:opacity-60"
              >
                {t("Only send the reply")}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-11 items-center justify-center rounded-full bg-accent-400 px-5 text-sm font-semibold text-brand-950 hover:bg-accent-300"
            >
              {t(need.myMessage ? "Update my reply" : "I can help")}
            </button>
            <Link href={`/donor/donate?need=${need.id}`} className="text-sm font-semibold text-brand-700 hover:underline">
              {t("Post food for it")}
            </Link>
            {need.replies > 0 && (
              <span className="text-xs text-ink-500">
                {t(need.replies === 1 ? "{n} donor replied" : "{n} donors replied", { n: number(need.replies) })}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
