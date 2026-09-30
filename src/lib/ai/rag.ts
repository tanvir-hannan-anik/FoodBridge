import type { Role } from "@/db/schema";
import { KNOWLEDGE, type KnowledgeDoc } from "./knowledge";

/*
 * Retrieval for the assistant: BM25 keyword search over the approved knowledge base, in memory.
 * The corpus is small, so this is instant and needs no embeddings service. The interface
 * (retrieve → ranked docs) stays the same if it's replaced by vector search later.
 */

const STOP = new Set(
  "a an and are as at be by can do does for from how i if in is it its me my of on or our so that the this to we what when where which who why will with you your".split(" "),
);

function tokens(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9ঀ-৿]+/g, " ")
    .split(" ")
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map((t) => t.replace(/(ing|ed|es|s)$/, ""));
}

type Indexed = { doc: KnowledgeDoc; terms: Map<string, number>; length: number };

const INDEX: Indexed[] = KNOWLEDGE.map((doc) => {
  const terms = new Map<string, number>();
  const all = tokens(`${doc.title} ${doc.title} ${doc.body}`);
  for (const t of all) terms.set(t, (terms.get(t) ?? 0) + 1);
  return { doc, terms, length: all.length };
});
const AVG_LENGTH = INDEX.reduce((s, d) => s + d.length, 0) / INDEX.length;
const DOC_FREQ = new Map<string, number>();
for (const d of INDEX) for (const t of d.terms.keys()) DOC_FREQ.set(t, (DOC_FREQ.get(t) ?? 0) + 1);

/** Top `k` articles for a question, preferring ones written for this role. */
export function retrieve(query: string, role: Role, k = 3): KnowledgeDoc[] {
  const q = [...new Set(tokens(query))];
  const k1 = 1.2;
  const b = 0.75;
  const scored = INDEX.map((d) => {
    let score = 0;
    for (const t of q) {
      const f = d.terms.get(t);
      if (!f) continue;
      const n = DOC_FREQ.get(t) ?? 0;
      const idf = Math.log(1 + (INDEX.length - n + 0.5) / (n + 0.5));
      score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.length) / AVG_LENGTH)));
    }
    if (score > 0 && d.doc.audience === role) score *= 1.25;
    return { doc: d.doc, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b2) => b2.score - a.score);
  return (scored.length ? scored : INDEX.filter((d) => d.doc.id === "about").map((d) => ({ doc: d.doc, score: 0 }))).slice(0, k).map((s) => s.doc);
}
