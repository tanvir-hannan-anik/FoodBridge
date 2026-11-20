import assert from "node:assert/strict";

// Read-only checks against a running app; no session credential is needed.
const url = new URL("/api/mcp", process.env.MCP_TEST_ORIGIN ?? "http://localhost:3000");
const post = (headers = {}) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: "{}" });
assert.equal((await post()).status, 401);
assert.equal((await post({ Cookie: "fb_session=invalid" })).status, 401);
assert.equal((await post({ Origin: "https://foreign.example" })).status, 403);
assert.equal((await fetch(url)).status, 405);
console.log("PASS: Next HTTP unauthenticated 401, invalid session 401, foreign Origin 403, GET 405");
