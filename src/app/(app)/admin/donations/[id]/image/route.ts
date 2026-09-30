import { getCurrentUser } from "@/lib/auth/dal";
import { getDonationImage } from "@/lib/donations/service";
import { imageResponse } from "@/lib/image-response";

/** Serves any donation photo to admins. */
export async function GET(_request: Request, ctx: RouteContext<"/admin/donations/[id]/image">) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return new Response("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  return imageResponse(await getDonationImage(id));
}
