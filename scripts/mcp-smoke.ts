import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function main() {
  // Never load .env.local: all writes are fixtures in an isolated local database.
  process.env.DATABASE_URL = "";
  process.env.POSTGRES_URL = "";
  process.env.VERCEL = "";
  process.env.DATABASE_DIR = mkdtempSync(join(tmpdir(), "foodbridge-mcp-"));
  process.env.DEMO_MODE = "false";
  process.env.AI_DISABLED = "true";
  const { getDb } = await import("../src/db");
  const { users, donations, foodRequests } = await import("../src/db/schema");
  const { withFoodBridgeMcp } = await import("../src/lib/mcp/client");
  const { runAssistant } = await import("../src/lib/ai/graph");
  const db = await getDb();
  const people = await db.insert(users).values([
    { role: "donor" as const, name: "Test donor", email: "donor@test.local", phone: "private-phone", passwordHash: "fixture", area: "Dhaka" },
    { role: "ngo" as const, name: "Test NGO", email: "ngo@test.local", phone: "private-phone", passwordHash: "fixture" },
    { role: "volunteer" as const, name: "Test volunteer", email: "vol@test.local", phone: "private-phone", passwordHash: "fixture" },
    { role: "donor" as const, name: "Other donor", email: "other@test.local", phone: "private-phone", passwordHash: "fixture" },
  ]).returning();
  const [donor, ngo, volunteer, other] = people;
  const base = { donorId: donor.id, foodType: "MCP rice", category: "cooked" as const, quantity: 12, unit: "plates" as const, mealsEstimate: 12, condition: "fresh" as const, preparedAt: new Date(), expiresAt: new Date(Date.now() + 3600000), pickupAt: new Date(), pickupAddress: "private-address", contactName: "private-name", contactPhone: "private-phone" };
  const [available, assigned] = await db.insert(donations).values([base, { ...base, status: "ASSIGNED", volunteerId: volunteer.id, ngoId: ngo.id }]).returning();
  await db.insert(donations).values([{ ...base, foodType: "expired fixture", expiresAt: new Date(Date.now() - 60000) }, { ...base, foodType: "held fixture", safetyFlag: "FLAGGED" }]);
  await db.insert(foodRequests).values({ donationId: assigned.id, ngoId: ngo.id, quantity: 12, people: 12, preferredAt: new Date(), status: "ACCEPTED" });
  await withFoodBridgeMcp(ngo, async (client) => {
    assert.equal((await client.listTools()).tools.length, 3);
    const response = await client.callTool({ name: "get_available_donations", arguments: {} });
    assert.ok(JSON.stringify(response).includes(available.id));
    assert.ok(!JSON.stringify(response).includes(assigned.id));
    assert.ok(!JSON.stringify(response).includes("private-"));
    assert.ok(!JSON.stringify(response).includes("expired fixture"));
    assert.ok(!JSON.stringify(response).includes("held fixture"));
    assert.ok(JSON.stringify(await client.callTool({ name: "get_volunteer_assignments", arguments: {} })).includes(assigned.id));
    assert.equal((await client.callTool({ name: "get_donation_status", arguments: { donationId: "bad" } })).isError, true);
    assert.equal((await client.callTool({ name: "get_donation_status", arguments: { donationId: "00000000-0000-4000-8000-000000000000" } })).isError, true);
    assert.equal((await client.callTool({ name: "get_available_donations", arguments: { limit: 1000 } })).isError, true);
  });
  await withFoodBridgeMcp(volunteer, async (client) => {
    const response = await client.callTool({ name: "get_volunteer_assignments", arguments: {} });
    assert.ok(JSON.stringify(response).includes(assigned.id));
    assert.ok(!JSON.stringify(response).includes("private-"));
  });
  for (const [person, forbidden] of [[donor, false], [other, true]] as const) {
    await withFoodBridgeMcp(person, async (client) => {
      const response = await client.callTool({ name: "get_donation_status", arguments: { donationId: available.id } });
      assert.equal(Boolean(response.isError), forbidden);
    });
  }
  await withFoodBridgeMcp({ ...ngo, status: "suspended" }, async (client) => {
    assert.equal((await client.callTool({ name: "get_available_donations", arguments: {} })).isError, true);
  });
  const answer = await runAssistant(ngo, "What food is available?", []);
  assert.equal(answer.intent, "live_data");
  assert.ok(answer.reply.includes(available.id));
  const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
  const { StreamableHTTPClientTransport } = await import("@modelcontextprotocol/sdk/client/streamableHttp.js");
  const { handleMcpRequest } = await import("../src/lib/mcp/http");
  const http = new Client({ name: "foodbridge-http-test", version: "1.0.0" });
  await http.connect(new StreamableHTTPClientTransport(new URL("http://localhost/api/mcp"), {
    fetch: async (url, init) => handleMcpRequest(new Request(url, init), ngo),
  }));
  try {
    assert.equal((await http.listTools()).tools.length, 3);
    assert.ok(JSON.stringify(await http.callTool({ name: "get_available_donations", arguments: {} })).includes(available.id));
  } finally { await http.close(); }
  console.log("PASS: Streamable HTTP SDK client initialization, discovery and tool call (local fetch adapter)");
  console.log("PASS: discovery, database reads, privacy projection, invalid input, ownership, suspended user, assistant MCP flow");
}
main().then(() => process.exit(0), (error) => { console.error(error); process.exit(1); });
