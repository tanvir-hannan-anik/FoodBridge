import { Badge } from "@/components/ui";
import type { DonationStatus } from "@/db/schema";
import { STATUS_META } from "@/lib/donations/meta";

export function StatusBadge({ status }: { status: DonationStatus }) {
  const meta = STATUS_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
