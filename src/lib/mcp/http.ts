import "server-only";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { User } from "@/db/schema";
import { createFoodBridgeMcpServer } from "./server";

/** Authenticated by the route before entering the protocol handler. */
export async function handleMcpRequest(request: Request, user: User) {
  const server = createFoodBridgeMcpServer(user);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store");
    const body = await response.arrayBuffer();
    return new Response(response.status === 202 || response.status === 204 ? null : body, { status: response.status, headers });
  } catch {
    console.error("[mcp] HTTP request failed");
    return Response.json({ error: "MCP request failed" }, { status: 500 });
  } finally { await server.close(); }
}
