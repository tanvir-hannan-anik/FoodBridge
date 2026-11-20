# FoodBridge MCP

## Purpose and implementation

`foodbridge` version `1.0.0` exposes existing FoodBridge donation and delivery information to authenticated callers. It uses the official `@modelcontextprotocol/sdk` (installed version 1.32.2), TypeScript, Zod validation, and Next.js App Router on Node.js. Production responses come from the existing backend services and database. No MCP tables or write tools were added.

**Counts:** one custom MCP server implementation, one HTTP endpoint (`/api/mcp`), three tools. FoodBridge uses this same server through its LangGraph client; it does not consume an additional third-party MCP server.

## Architecture

```text
Signed-in assistant request → existing authentication → LangGraph
  → SDK MCP client → in-process MCP transport → FoodBridge MCP server
  → existing scoped service reads → Drizzle → Postgres / local PGlite

Authenticated external SDK client → POST /api/mcp
  → existing authentication → Streamable HTTP transport
  → the same FoodBridge MCP server factory → existing services
```

The external transport is stateless Streamable HTTP with JSON responses. Each request gets a fresh server instance. GET and DELETE return 405; persistent SSE sessions are not offered. LangGraph uses the SDK's linked in-memory transport, including protocol initialization, discovery, and tool calls. This avoids deployment self-fetch configuration while keeping the same tool implementation.

## Tools and permissions

| Tool | Inputs | Access and output |
| --- | --- | --- |
| `get_available_donations` | `limit`: 1–50, default 20 | Active NGOs; pending, unexpired donations without safety holds. Food, quantity, unit, pickup area, availability time, expiry, status. |
| `get_donation_status` | `donationId`: UUID | Donor ownership, NGO visibility, or volunteer visibility through existing service checks. Status, pickup time, delivery deadline and permitted event timestamps. |
| `get_volunteer_assignments` | `view`: current/completed; `limit`: 1–50 | Volunteer’s own tasks, or accepted deliveries for the current NGO. Food, quantity and status. |

Inactive accounts are denied. Admin access is intentionally not exposed by these tools. Missing and inaccessible donations receive the same error. Lists are bounded snapshots, not total counts; NGO assignment candidates are limited by the existing 200-request service read. Contact details, private street addresses, coordinates, photos, notes, credentials and user records are excluded through explicit field projections.

## Client integration and security

The assistant's existing graph now has a `live_data` intent and `mcp_lookup` node. It discovers the tool catalog and selects a tool using the existing structured-output provider. Gemini/OpenRouter/Claude configuration and fallback remain in `provider.ts`. Recognised English/Bangla availability, status and assignment questions also work without an AI key. Missing donation IDs prompt for an ID; errors produce an unavailable/permission response. Existing drafts, knowledge retrieval, notifications and conversation storage remain in place.

The HTTP endpoint requires the existing `fb_session` cookie. The DAL checks the signed session, current database account status and session version. It rejects foreign Origin headers, applies the existing in-process rate limiter (60 requests/minute/user), and marks responses `no-store`. Internal callers must already be authenticated; never expose the server factory as an unauthenticated API. Logs contain generic failure messages rather than database errors or secrets.

External clients must support a Cookie request header; OAuth discovery and long-lived integration tokens are not implemented. Use HTTPS outside localhost and treat the session cookie as a credential. The n8n `INTEGRATION_SECRET` is not accepted for MCP.

## Setup and verification

Use the existing `.env.local` configuration (`SESSION_SECRET`, and `DATABASE_URL` for hosted Postgres or `DATABASE_DIR` for local PGlite). No new environment variables are required.

```sh
npm ci
npm run dev
# MCP is served at http://localhost:3000/api/mcp
npm run mcp:test
node scripts/mcp-http-check.mjs # running app at localhost:3000; override MCP_TEST_ORIGIN if needed
npx tsc --noEmit
npx eslint src scripts/mcp-smoke.ts
npm run build
```

`mcp:test` uses `tsx` via npx, consistent with the existing translation smoke command; first use may require registry access. It ignores hosted database URLs and creates an isolated temporary PGlite database containing test-only fixtures. Temporary folders are retained for inspection. Production tools never return those fixtures.

For an external SDK client, configure `StreamableHTTPClientTransport` with the endpoint URL and `requestInit.headers.Cookie = "fb_session=<your current session>"`, then call `connect`, `listTools`, and `callTool`. Do not save a real cookie in source control. Log out or change the password to invalidate access as defined by the existing session system.

## Executed tests and limitations

The automated smoke suite passed SDK initialization, discovery of exactly three tools, actual PGlite-backed availability/status/assignment reads, privacy projection, invalid UUID rejection, donor ownership denial, suspended-user denial, and the LangGraph MCP path with AI disabled. Streamable HTTP initialization, discovery and an availability call passed using the real SDK transport with a local fetch adapter. This transport test does not exercise a deployed reverse proxy or browser login.

The production build passed and includes `/api/mcp`; TypeScript and application-source ESLint checks passed. Against a temporary production server, `mcp-http-check.mjs` passed missing-session 401, invalid-session 401, foreign-Origin 403 and GET 405 checks. Earlier validation found a callback naming lint issue and an omitted required field in a test fixture; both were corrected. Initial SDK type errors occurred while dependency installation was still incomplete and cleared after installation. npm reported 11 dependency audit findings (7 moderate, 3 high, 1 critical); dependency remediation outside this integration was not performed.

The final expanded `npm run mcp:test` run also passed exclusion of expired and safety-held food, NGO assignment reads, missing-record handling, and limit validation. The final TypeScript check passed after these test additions.

Implementation files: `src/lib/mcp/{server,client,http}.ts`, `src/app/api/mcp/route.ts`, `src/lib/ai/mcp.ts`, `scripts/mcp-smoke.ts`, and `scripts/mcp-http-check.mjs`. Existing files changed: `src/lib/ai/graph.ts`, `src/lib/ai/schemas.ts`, `package.json`, and `package-lock.json`.

Live model calls, production Postgres, and external WhatsApp/Messenger delivery have not been exercised by these tests. Existing n8n inbound/outbox and Supabase chat-order workflows were reviewed and left unchanged; no n8n MCP integration or additional automation was added. End-to-end regression coverage of every portal is not claimed.

## Reuse and submission description

Verified clients are the FoodBridge assistant and the automated SDK HTTP test client. There is no verified reuse in another project or a deployed external client.

“We built FoodBridge MCP, a read-only server with three tools for available donations, donation status and volunteer assignments. Our LangGraph assistant discovers and calls these tools using existing role-scoped backend services. The same server is exposed through an authenticated Streamable HTTP endpoint, with validated inputs and privacy-filtered responses.”
