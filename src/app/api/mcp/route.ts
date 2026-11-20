import { getCurrentUser } from "@/lib/auth/dal";
import { handleMcpRequest } from "@/lib/mcp/http";
import { rateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return new Response("Forbidden", { status: 403 });
  const user = await getCurrentUser();
  if (!user) return new Response("Authentication required", { status: 401 });
  if (user.status !== "active") return new Response("Forbidden", { status: 403 });
  if (rateLimited(`mcp:${user.id}`, 60, 60_000)) return new Response("Too many requests", { status: 429 });
  return handleMcpRequest(request, user);
}

export function GET() { return new Response("Streaming sessions are not supported", { status: 405, headers: { Allow: "POST" } }); }
export const DELETE = GET;
