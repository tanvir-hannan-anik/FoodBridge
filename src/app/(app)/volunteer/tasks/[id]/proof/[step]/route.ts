import { getCurrentUser } from "@/lib/auth/dal";
import { imageResponse } from "@/lib/image-response";
import { PROOF_STEPS, type ProofStep } from "@/lib/volunteer/meta";
import { getProofPhoto } from "@/lib/volunteer/service";

/** Serves the pickup or delivery proof photo to the volunteer who took it. */
export async function GET(_request: Request, ctx: RouteContext<"/volunteer/tasks/[id]/proof/[step]">) {
  const user = await getCurrentUser();
  if (!user || user.role !== "volunteer") return new Response("Unauthorized", { status: 401 });

  const { id, step } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !(step in PROOF_STEPS)) return new Response("Not found", { status: 404 });
  return imageResponse(await getProofPhoto(user.id, id, step as ProofStep));
}
