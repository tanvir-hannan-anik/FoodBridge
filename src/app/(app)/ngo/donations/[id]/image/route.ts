import { getCurrentUser } from "@/lib/auth/dal";
import { getDonationImage } from "@/lib/donations/service";
import { imageResponse } from "@/lib/image-response";
import { canNgoSeeDonation } from "@/lib/ngo/service";

/** Serves a donation photo to an NGO that can see the donation (open for requests, requested, or matched). */
export async function GET(_request: Request, ctx: RouteContext<"/ngo/donations/[id]/image">) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ngo") return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !(await canNgoSeeDonation(user.id, id))) {
    return new Response("Not found", { status: 404 });
  }
  return imageResponse(await getDonationImage(id));
}
