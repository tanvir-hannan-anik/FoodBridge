import * as z from "zod";
import { getCurrentUser } from "@/lib/auth/dal";
import { getDeliveryView, shareLivePosition, stopLivePosition } from "@/lib/location/service";

/*
 * Opt-in live location for one delivery. Only its donor, NGO, volunteer (and admins, read-only)
 * can use it. Each person shares only after allowing location in their browser and switching
 * sharing on; positions are kept while the delivery is under way and deleted when it ends.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NO_STORE = { "Cache-Control": "no-store" };

const positionSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(100_000).nullable().default(null),
});

async function authorize(ctx: RouteContext<"/api/deliveries/[id]/location">) {
  const user = await getCurrentUser();
  const { id } = await ctx.params;
  return { user, id: UUID.test(id) ? id : null };
}

/** Current map data: fixed points plus fresh live positions. Polled by the map every few seconds. */
export async function GET(_request: Request, ctx: RouteContext<"/api/deliveries/[id]/location">) {
  const { user, id } = await authorize(ctx);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const view = id ? await getDeliveryView(user, id) : null;
  if (!view) return new Response("Not found", { status: 404 });
  return Response.json(view, { headers: NO_STORE });
}

/** Share (or refresh) my live position for this delivery. */
export async function POST(request: Request, ctx: RouteContext<"/api/deliveries/[id]/location">) {
  const { user, id } = await authorize(ctx);
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!id) return new Response("Not found", { status: 404 });
  const parsed = positionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response("Invalid position", { status: 400 });
  const ok = await shareLivePosition(user, id, parsed.data);
  if (!ok) return new Response("Live sharing isn’t available for this delivery.", { status: 409 });
  return new Response(null, { status: 204 });
}

/** Stop sharing: my position is deleted straight away. */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/deliveries/[id]/location">) {
  const { user, id } = await authorize(ctx);
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (id) await stopLivePosition(user.id, id);
  return new Response(null, { status: 204 });
}
