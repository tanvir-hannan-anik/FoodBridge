import { getCurrentUser } from "@/lib/auth/dal";
import { docsSchema } from "@/lib/docs/model";
import { readDocs, writeDocs } from "@/lib/docs/service";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin" || user.status !== "active") return new Response("Forbidden", { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) return new Response("Forbidden", { status: 403 });
  const raw = await request.text();
  if (raw.length > 11000000) return new Response("Content too large", { status: 413 });
  let body;
  try { body = JSON.parse(raw); } catch { return new Response("Invalid JSON", { status: 400 }); }
  const parsed = z.object({ content: docsSchema, revision: z.number().int().nonnegative() }).safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.issues.map((i) => i.message).join(" ") }, { status: 400 });
  for (const member of parsed.data.content.team) {
    if (member.image && !Buffer.from(member.image.split(",")[1], "base64").subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return Response.json({ error: "Invalid JPEG image." }, { status: 400 });
  }
  if (!await writeDocs(parsed.data.content, parsed.data.revision)) return Response.json({ error: "Another admin saved changes. Reload before editing again." }, { status: 409 });
  revalidatePath("/docs");
  revalidatePath("/admin/docs");
  return Response.json(await readDocs(), { headers: { "Cache-Control": "no-store" } });
}
