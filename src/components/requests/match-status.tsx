import Link from "next/link";
import { Badge } from "@/components/ui";
import { UNIT_SHORT } from "@/lib/donations/meta";
import { MATCH_EVENT_LABEL, MATCH_FLOW, MATCH_STAGE_META, type MatchStage } from "@/lib/matching/meta";
import type { MatchHistoryItem } from "@/lib/matching/service";
import { cn, formatDateTime } from "@/lib/utils";

export function MatchBadge({ stage }: { stage: MatchStage }) {
  const meta = MATCH_STAGE_META[stage];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

/** Pending → Matched → Accepted → Allocated, with the current step highlighted. */
export function MatchStepper({ stage }: { stage: MatchStage }) {
  const index = MATCH_FLOW.indexOf(stage as (typeof MATCH_FLOW)[number]);
  const off = index === -1;
  return (
    <ol aria-label="Match status" className="grid grid-cols-4 gap-1.5">
      {MATCH_FLOW.map((step, i) => {
        const done = !off && (i < index || stage === "allocated");
        const current = !off && i === index && stage !== "allocated";
        return (
          <li key={step} aria-current={current ? "step" : undefined}>
            <span className={cn("block h-1.5 rounded-full", done ? "bg-brand-600" : current ? "bg-accent-400" : "bg-cream-200")} />
            <span className={cn("mt-1.5 block text-xs", current ? "font-semibold text-brand-900" : done ? "text-ink-700" : "text-ink-500")}>
              {MATCH_STAGE_META[step].label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** "Which donation went to which NGO": every match step, newest first. */
export function MatchHistory({ items, hrefFor, showNgo }: { items: MatchHistoryItem[]; hrefFor?: (donationId: string) => string; showNgo?: boolean }) {
  if (!items.length) return <p className="px-6 py-8 text-center text-sm text-ink-500">No matching activity yet.</p>;
  return (
    <ol className="divide-y divide-cream-200">
      {items.map((e) => (
        <li key={e.id} className="flex gap-3 px-6 py-3 text-sm">
          <span
            aria-hidden
            className={cn(
              "mt-1.5 size-2 shrink-0 rounded-full",
              e.status === "ALLOCATED" ? "bg-brand-600" : e.status === "MATCHED" || e.status === "ACCEPTED" ? "bg-sky-500" : "bg-ink-300",
            )}
          />
          <div className="min-w-0 flex-1">
            <p className="text-brand-950">
              <span className="font-semibold">{MATCH_EVENT_LABEL[e.status]}</span> ·{" "}
              {hrefFor ? (
                <Link href={hrefFor(e.donationId)} className="hover:text-brand-700 hover:underline">
                  {e.foodType}
                </Link>
              ) : (
                e.foodType
              )}
              {e.quantity !== null && (
                <span className="text-ink-600">
                  {" "}
                  · {e.quantity} {UNIT_SHORT[e.unit]}
                  {e.people ? ` for ${e.people} people` : ""}
                </span>
              )}
              {showNgo && <span className="text-ink-600"> · {e.ngoName}</span>}
            </p>
            <p className="text-xs text-ink-500">
              {formatDateTime(e.createdAt)}
              {e.note && <> · {e.note}</>}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
