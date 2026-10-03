// Lists English text that has no Bangla translation yet.
//   node scripts/i18n-check.mjs            missing dictionary keys for t("…") calls
//   node scripts/i18n-check.mjs --raw      also English text in JSX / props that isn't wrapped in t()
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/(\w:)/, "$1");
const SRC = join(ROOT, "src");
const showRaw = process.argv.includes("--raw");

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(tsx?|mts)$/.test(name)) out.push(path);
  }
  return out;
}

const files = walk(SRC);
const dictFiles = files.filter((f) => f.includes(join("lib", "bn")));

// Dictionary entries are one per line: "English": "Bangla",
const ENTRY = /^\s*("(?:[^"\\]|\\.)*")\s*:\s*("(?:[^"\\]|\\.)*"),?\s*$/gm;
const dict = new Map();
for (const f of dictFiles) {
  for (const m of readFileSync(f, "utf8").matchAll(ENTRY)) {
    const key = JSON.parse(m[1]);
    if (dict.has(key)) console.log(`duplicate key: ${JSON.stringify(key)} (${relative(ROOT, f)})`);
    dict.set(key, JSON.parse(m[2]));
  }
}

// t("…") / t('…') / t(`…`) with a literal first argument.
const CALL = /\bt\(\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`$]*`)/g;
const missing = new Map();
const raw = new Map();
for (const f of files) {
  if (dictFiles.includes(f)) continue;
  // Ignore comments (examples in doc comments aren't real keys).
  const src = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  for (const m of src.matchAll(CALL)) {
    const lit = m[1];
    const key = lit.startsWith("`") ? lit.slice(1, -1) : lit.startsWith("'") ? lit.slice(1, -1).replace(/\\'/g, "'") : JSON.parse(lit);
    if (!dict.has(key)) missing.set(key, relative(ROOT, f));
  }
  // Text props that the UI primitives translate themselves (Input label, CardHeader title, …), plus
  // string children of self-translating components (SubmitButton, Badge, Alert): these must be keys too.
  if (f.endsWith(".tsx") && !f.includes(`${join("(site)", "page.tsx")}`)) {
    for (const m of src.matchAll(/\b(label|title|description|placeholder|hint|triggerLabel|pendingLabel|eyebrow|submitLabel|searchPlaceholder|statusLabel|anyStatusLabel|metricLabel)="([^"]*[A-Za-z]{2,}[^"]*)"/g)) {
      if (!dict.has(m[2])) missing.set(m[2], `${relative(ROOT, f)} (${m[1]}=)`);
    }
    for (const m of src.matchAll(/<(SubmitButton|Badge|Alert)\b[^>]*>\s*([^<>{}\n]*[A-Za-z]{2,}[^<>{}\n]*?)\s*<\/\1>/g)) {
      if (!dict.has(m[2])) missing.set(m[2], `${relative(ROOT, f)} (<${m[1]}>)`);
    }
    for (const m of src.matchAll(/\{ (?:value: [^}]*?, )?label: "([^"]*[A-Za-z]{2,}[^"]*)"/g)) {
      if (!dict.has(m[1])) missing.set(m[1], `${relative(ROOT, f)} (label:)`);
    }
  }
  if (showRaw && f.endsWith(".tsx")) {
    const hits = [];
    // JSX text between tags that contains a real word.
    for (const m of src.matchAll(/>([^<>{}\n]*[A-Za-z]{3,}[^<>{}\n]*)</g)) {
      const text = m[1].trim();
      if (text && !/^[\w.-]+$/.test(text) && !/=>|&&|\|\||\(\)/.test(text)) hits.push(text);
    }
    for (const m of src.matchAll(/\b(label|placeholder|title|aria-label|description|hint|alt)="([^"]*[A-Za-z]{3,}[^"]*)"/g)) {
      hits.push(`${m[1]}="${m[2]}"`);
    }
    if (hits.length) raw.set(relative(ROOT, f), hits);
  }
}

console.log(`dictionary: ${dict.size} entries`);
if (missing.size) {
  console.log(`\nmissing translations (${missing.size}):`);
  for (const [key, file] of missing) console.log(`  ${JSON.stringify(key)}  ← ${file}`);
} else console.log("all t() keys are translated");
if (showRaw) {
  console.log(`\nunwrapped English text (${[...raw.values()].reduce((n, h) => n + h.length, 0)}):`);
  for (const [file, hits] of raw) {
    console.log(`  ${file}`);
    for (const h of hits) console.log(`    ${h}`);
  }
}
process.exitCode = missing.size ? 1 : 0;
