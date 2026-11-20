import assert from "node:assert/strict";
const origin = process.env.DOCS_TEST_ORIGIN ?? "http://localhost:3000";
// Use a fresh instance with publishing OFF. This script never writes application data.
assert.equal((await fetch(new URL("/api/docs", origin))).status, 404);
assert.equal((await fetch(new URL("/docs", origin))).status, 404);
assert.equal((await fetch(new URL("/api/admin/docs", origin), { method: "PUT", headers: { "Content-Type": "application/json", Origin: origin }, body: "{}" })).status, 403);
const admin = await fetch(new URL("/admin/docs", origin), { redirect: "manual" });
assert.equal(admin.status, 307);
assert.ok(admin.headers.get("location")?.includes("/login"));
console.log("PASS: unpublished public page/API return 404; anonymous admin write denied; editor redirects to login");
