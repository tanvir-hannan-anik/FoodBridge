import "server-only";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { User } from "@/db/schema";
import { createFoodBridgeMcpServer } from "./server";

/** SDK protocol connection scoped to a user already authenticated by the assistant route. */
export async function withFoodBridgeMcp<T>(user: User, callback: (client: Client) => Promise<T>): Promise<T> {
  const server = createFoodBridgeMcpServer(user);
  const client = new Client({ name: "foodbridge-langgraph", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    return await callback(client);
  } finally {
    await client.close();
    await server.close();
  }
}
