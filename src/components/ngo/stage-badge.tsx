import { Badge } from "@/components/ui";
import { STAGE_META, type Stage } from "@/lib/ngo/meta";

export function StageBadge({ stage }: { stage: Stage }) {
  const meta = STAGE_META[stage];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
