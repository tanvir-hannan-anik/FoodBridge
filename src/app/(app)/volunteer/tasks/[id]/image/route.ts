import { getCurrentUser } from "@/lib/auth/dal";
import { getDonationImage } from "@/lib/donations/service";
import { imageResponse } from "@/lib/image-response";
import { canVolunteerSeeDonation } from "@/lib/volunteer/service";

/** Serves a donation photo to a volunteer who can see the task (open to accept, or theirs). */
export async function GET(_request: Request, ctx: RouteContext<"/volunteer/tasks/[id]/image">) {
  const user = await getCurrentUser();
  if (!user || user.role !== "volunteer" || user.status !== "active") return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !(await canVolunteerSeeDonation(user, id))) {
    return new Response("Not found", { status: 404 });
  }
  return imageResponse(await getDonationImage(id));
}
