import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, relative } from "node:path";
const routes = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.name === "route.ts") {
      const source = readFileSync(path, "utf8");
      const methods = [...source.matchAll(/export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)|export\s+const\s+(GET|POST|PUT|PATCH|DELETE)/g)].map((m) => m[1] ?? m[2]);
      routes.push({ path: "/api/" + relative("src/app/api", dir).replaceAll("\\", "/"), methods });
    }
  }
}
walk("src/app/api");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const features = readdirSync("src/lib", { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
mkdirSync("src/lib/docs", { recursive: true });
writeFileSync("src/lib/docs/manifest.json", JSON.stringify({ generatedAt: new Date().toISOString(), routes, features, stack: pkg.dependencies }, null, 2) + "\n");
