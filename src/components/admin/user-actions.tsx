import { changeUserStatus } from "@/app/actions/admin";
import { SubmitButton } from "@/components/ui";
import type { Role, UserStatus } from "@/db/schema";
import { getI18n } from "@/lib/i18n-server";

const BLOCK_EFFECT: Record<Exclude<Role, "admin">, string> = {
  volunteer: "Assigned pickups go back to other volunteers.",
  ngo: "Open food requests are cancelled and pending requests withdrawn.",
  donor: "Donations nobody has matched yet are cancelled.",
};

/** Approve / suspend / deactivate / reactivate, depending on the account's current status. */
export async function UserActions({
  userId,
  role,
  status,
  compact,
}: {
  userId: string;
  role: Exclude<Role, "admin">;
  status: UserStatus;
  compact?: boolean;
}) {
  const size = compact ? "sm" : "md";
  const { t } = await getI18n();
  return (
    <div className="flex flex-wrap items-start gap-2">
      {status === "pending" && (
        <form action={changeUserStatus.bind(null, userId, "approve")}>
          <SubmitButton size={size} className="rounded-full px-4">
            {t(role === "donor" ? "Approve" : "Verify")}
          </SubmitButton>
        </form>
      )}
      {(status === "suspended" || status === "deactivated") && (
        <form action={changeUserStatus.bind(null, userId, "reactivate")}>
          <SubmitButton size={size} className="rounded-full px-4">
            {t("Reactivate")}
          </SubmitButton>
        </form>
      )}
      {compact ? (
        (status === "active" || status === "pending") && (
          <form action={changeUserStatus.bind(null, userId, "suspend")}>
            <SubmitButton size={size} variant="outline" className="rounded-full px-4">
              {t(status === "pending" ? "Reject" : "Suspend")}
            </SubmitButton>
          </form>
        )
      ) : (
        <>
          {(status === "active" || status === "pending") && (
            <BlockForm userId={userId} action="suspend" label={status === "pending" ? "Reject (suspend)" : "Suspend"} effect={BLOCK_EFFECT[role]} />
          )}
          {status !== "deactivated" && (
            <BlockForm userId={userId} action="deactivate" label="Deactivate" effect={BLOCK_EFFECT[role]} />
          )}
        </>
      )}
    </div>
  );
}

async function BlockForm({ userId, action, label: raw, effect }: { userId: string; action: "suspend" | "deactivate"; label: string; effect: string }) {
  const { t } = await getI18n();
  const label = t(raw);
  return (
    <details className="group rounded-2xl border border-cream-200 bg-white open:w-full open:p-4">
      <summary className="inline-flex h-11 cursor-pointer list-none items-center rounded-full border border-brand-900/15 px-4 text-sm font-semibold text-brand-950 group-open:hidden hover:bg-cream-100">
        {label}…
      </summary>
      <form action={changeUserStatus.bind(null, userId, action)} className="space-y-3">
        <p className="text-sm text-ink-700">
          <span className="font-semibold text-brand-950">{label}:</span> {t("the user can’t log in until reactivated.")} {t(effect)}
        </p>
        <label className="block text-sm font-semibold text-brand-950">
          {t("Reason")} <span className="font-normal text-ink-500">{t("(optional, kept in the admin log)")}</span>
          <input
            name="reason"
            maxLength={200}
            className="mt-1.5 block h-11 w-full rounded-field border border-cream-300 px-3 text-sm font-normal focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/25"
          />
        </label>
        <SubmitButton variant="danger" className="rounded-full px-5">
          {t("Confirm: {action}", { action: label.toLowerCase() })}
        </SubmitButton>
      </form>
    </details>
  );
}
