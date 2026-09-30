import { getCurrentUser } from "@/lib/auth/dal";
import { getDonationImage, isDonationOwner } from "@/lib/donations/service";
import { imageResponse } from "@/lib/image-response";

/** Serves a donation photo only to the donor who owns it. */
export async function GET(_request: Request, ctx: RouteContext<"/donor/donations/[id]/image">) {
  const user = await getCurrentUser();
  if (!user || user.role !== "donor") return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !(await isDonationOwner(user.id, id))) {
    return new Response("Not found", { status: 404 });
  }
  return imageResponse(await getDonationImage(id));
}
