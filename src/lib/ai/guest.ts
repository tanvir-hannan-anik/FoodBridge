import "server-only";

import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import * as z from "zod";
import { translate, type Lang } from "@/lib/i18n";
import { SAFETY_RULES, safetyWindowIssue } from "@/lib/safety/meta";
import type { KnowledgeDoc } from "./knowledge";
import { aiEnabled, AiUnavailableError, askStructured, type ChatTurn } from "./provider";
import { retrieve } from "./rag";
import { donationDraftSchema, type DonationDraft } from "./schemas";

/*
 * The landing-page assistant for visitors (no account needed). Its main job is to help someone
 * donate: it collects the donation details one question at a time, checks them against the
 * food-safety rules, reads them back for confirmation, and then hands over a pre-filled donation
 * form (the visitor logs in or signs up, checks it and posts it themselves).
 *
 *   START → understand ─┬─ donate ───────→ verify → respond ─→ END
 *                       ├─ question ─────→ retrieve → answer ─→ END
 *                       └─ greeting/other → chat ────────────→ END
 *
 * `understand` reads the message and updates the draft; `verify` is plain code (what's missing,
 * what breaks a safety rule); `respond` writes the next friendly question. Like the signed-in
 * assistant it never writes to the database: the draft lives in the visitor's browser.
 */

export type GuestStep = "ask" | "fix" | "confirm" | "done";
export type GuestReply = {
  reply: string;
  intent: "greeting" | "question" | "donate" | "other";
  draft: DonationDraft | null;
  step: GuestStep | null;
  /** The detail asked for in this reply (lets the no-AI mode read the next answer). */
  asked: DraftField | null;
  sources?: string[];
  aiUsed: boolean;
};

export type DraftField = Exclude<keyof DonationDraft, "missing" | "instructions">;

/** What the donation form needs, in the order the assistant asks for it. */
const ASK_ORDER: { field: DraftField; label: string }[] = [
  { field: "foodType", label: "what food it is" },
  { field: "quantity", label: "how much there is" },
  { field: "unit", label: "the unit (plates, kg, packets…)" },
  { field: "category", label: "the kind of food (cooked, bakery, packaged…)" },
  { field: "preparedMinutesAgo", label: "when it was cooked or prepared" },
  { field: "condition", label: "its condition (fresh, good, or eat soon)" },
  { field: "bestBeforeInHours", label: "how long it stays good to eat" },
  { field: "pickupInMinutes", label: "when it can be picked up" },
  { field: "pickupAddress", label: "the pickup address or area" },
];

const EMPTY: DonationDraft = {
  foodType: null,
  category: null,
  quantity: null,
  unit: null,
  condition: null,
  preparedMinutesAgo: null,
  bestBeforeInHours: null,
  pickupInMinutes: null,
  pickupAddress: null,
  instructions: null,
  missing: [],
};

const State = Annotation.Root({
  input: Annotation<string>(),
  history: Annotation<ChatTurn[]>(),
  lang: Annotation<Lang>(),
  draft: Annotation<DonationDraft>(),
  confirmed: Annotation<boolean>(),
  intent: Annotation<GuestReply["intent"]>(),
  step: Annotation<GuestStep | null>(),
  asked: Annotation<DraftField | null>(),
  problems: Annotation<string[]>(),
  docs: Annotation<KnowledgeDoc[]>(),
  result: Annotation<{ reply: string; sources?: string[] } | null>(),
});
type S = typeof State.State;

const now = () =>
  new Intl.DateTimeFormat("en-GB", { timeZone: process.env.APP_TIMEZONE ?? "Asia/Dhaka", dateStyle: "full", timeStyle: "short" }).format(new Date());

const PERSONA = `You are "FoodBridge Helper", the friendly assistant on the FoodBridge website. FoodBridge is a free platform for all of Bangladesh: people and businesses with leftover or surplus food (homes, restaurants, wedding and community halls, shops, caterers) donate it, verified NGOs nearby confirm they can use it, and volunteers collect it and deliver it to people who need it. NGOs can also post what they need, and donors nearby can answer.
Personality: warm, kind, encouraging and natural, like a helpful neighbour. Thank people for wanting to share food. Keep replies short (2–4 sentences), simple and clear. Use at most one emoji, and only when it feels natural.
You never take actions or change anything; you collect details and prepare the donation form, which the person checks and posts themselves. You don't decide whether food is safe: the platform's safety rules do.`;

const persona = (lang: Lang) =>
  lang === "bn"
    ? `${PERSONA}
The visitor is using the Bangla site: reply in natural, simple, friendly Bangla (Bengali script) unless they clearly write in English. Keep food names, addresses and numbers as written.`
    : `${PERSONA}
Reply in the language the visitor writes in (English or Bangla). Use British spelling.`;

const conversation = (s: S): ChatTurn[] => [...s.history.slice(-10), { role: "user", content: s.input }];

/** Fields the model may have dropped stay as they were; new values win. */
function merge(old: DonationDraft, next: Partial<DonationDraft>): DonationDraft {
  const out = { ...old };
  for (const { field } of ASK_ORDER) {
    const v = next[field];
    if (v !== null && v !== undefined && v !== "") (out as Record<string, unknown>)[field] = v;
  }
  if (next.instructions) out.instructions = next.instructions;
  return out;
}

const draftShape = donationDraftSchema.omit({ missing: true });

/* ---------------------------------------------------------------- nodes */

async function understand(s: S): Promise<Partial<S>> {
  const inProgress = ASK_ORDER.some(({ field }) => s.draft[field] !== null);
  const out = await askStructured(
    z.object({
      intent: z.enum(["greeting", "question", "donate", "other"]),
      draft: draftShape,
      confirmed: z.boolean().describe("true only if the latest message confirms the summary of the donation is correct"),
    }),
    {
      system: `${persona(s.lang)}
Now: ${now()}.
Read the visitor's latest message.
1. intent: "donate" if they want to give food, are describing food to give, or are answering your questions about their donation${inProgress ? " (a donation is in progress, so short answers like \"2 hours\" or \"Mirpur 10\" are donate)" : ""}; "question" if they ask how FoodBridge works, about NGOs, volunteering, safety, accounts or anything about the platform; "greeting" for hello/thanks/small talk; "other" for anything unrelated.
2. draft: the donation details so far. Start from the current draft below and add or correct only what the visitor actually said. Never invent values. Convert times: "cooked an hour ago" → preparedMinutesAgo 60; "good till 10pm" → bestBeforeInHours from now; "pick up in 30 min"/"now" → pickupInMinutes. Infer category (cooked meals like rice, biryani, curry, khichuri = cooked) and unit (plates, kg, packets, boxes, litres, pieces) when obvious. condition: fresh (just made), good, or consume_soon (should be eaten within a few hours).
3. confirmed: true only when the visitor says the summary you read back is right (yes, ঠিক আছে, হ্যাঁ, correct…).
<current_draft>${JSON.stringify(s.draft)}</current_draft>`,
      messages: conversation(s),
      maxTokens: 1500,
    },
  );
  const draft = merge(s.draft, out.draft);
  // Agreeing to a summary only counts if they didn't also change something.
  const changed = ASK_ORDER.some(({ field }) => draft[field] !== s.draft[field]);
  return { intent: out.intent, draft, confirmed: out.confirmed && !changed };
}

/** Plain code: what's still missing and what breaks the safety rules. Decides the next step. */
function verify(s: S): Partial<S> {
  const d = s.draft;
  const missing = ASK_ORDER.filter(({ field }) => d[field] === null);
  const problems: string[] = [];
  if (d.bestBeforeInHours !== null && d.bestBeforeInHours * 60 < SAFETY_RULES.minListingMinutes) {
    problems.push(`The food must stay good for at least ${SAFETY_RULES.minListingMinutes} more minutes so a volunteer can collect it.`);
  }
  if (d.bestBeforeInHours !== null && d.pickupInMinutes !== null && d.pickupInMinutes + 30 > d.bestBeforeInHours * 60) {
    problems.push("The pickup time is too close to (or after) the time the food stops being good. It should be ready for pickup well before that.");
  }
  if (d.category && d.condition && d.preparedMinutesAgo !== null && d.bestBeforeInHours !== null) {
    const t = Date.now();
    const issue = safetyWindowIssue({
      category: d.category,
      condition: d.condition,
      preparedAt: new Date(t - d.preparedMinutesAgo * 60_000),
      expiresAt: new Date(t + d.bestBeforeInHours * 3_600_000),
    });
    if (issue) problems.push(issue);
  }
  const step: GuestStep = missing.length ? "ask" : problems.length ? "fix" : s.confirmed ? "done" : "confirm";
  return {
    step,
    problems,
    asked: step === "ask" ? missing[0].field : null,
    draft: { ...d, missing: missing.map((m) => m.label) },
  };
}

/** The closing message is fixed (one model call fewer, and it must never go wrong). */
const DONE_MESSAGE =
  "Thank you so much! 🙏 Your donation form is ready. Tap the button below, log in or create a free donor account (it takes a minute), check the details and post it. A verified NGO nearby will confirm it and a volunteer will collect it from you.";

/** Fixed messages follow what the visitor writes in (Bangla script → Bangla), else the site language. */
const replyLang = (input: string, lang: Lang): Lang => (/[ঀ-৿]/.test(input) ? "bn" : /[a-z]{3}/i.test(input) ? "en" : lang);

async function respond(s: S): Promise<Partial<S>> {
  if (s.step === "done") return { result: { reply: translate(replyLang(s.input, s.lang), DONE_MESSAGE) } };
  const next = ASK_ORDER.find((a) => a.field === s.asked);
  const task: Record<Exclude<GuestStep, "done">, string> = {
    ask: `Briefly acknowledge what they just told you (thank them warmly the first time), then ask ONLY for: ${next?.label}. One question, with a short example answer.${s.asked === "pickupAddress" ? " Ask for the area too (e.g. Mirpur 10, Dhaka or Agrabad, Chattogram)." : ""}`,
    fix: `Kindly explain this problem in simple words and ask them to adjust the detail: ${s.problems.join(" ")}`,
    confirm: `Read back a short summary of the donation as a few lines (food, amount, cooked, good until, pickup time, pickup place) and ask them to confirm it's correct or tell you what to change.`,
  };
  const out = await askStructured(z.object({ reply: z.string() }), {
    system: `${persona(s.lang)}
Now: ${now()}.
You are helping a visitor donate food, step by step.
<current_draft>${JSON.stringify({ ...s.draft, missing: undefined })}</current_draft>
Your task for this reply: ${task[s.step === "fix" || s.step === "confirm" ? s.step : "ask"]}
Never ask for more than one thing at a time. Don't mention field names or JSON.`,
    messages: conversation(s),
    maxTokens: 800,
  });
  return { result: { reply: out.reply } };
}

function retrieveDocs(s: S): Partial<S> {
  return { docs: retrieve(s.input, "donor") };
}

async function answer(s: S): Promise<Partial<S>> {
  const docs = s.docs.map((d, i) => `<doc index="${i}" title="${d.title}">\n${d.body}\n</doc>`).join("\n");
  const out = await askStructured(z.object({ answer: z.string(), usedDocs: z.array(z.number().int()) }), {
    system: `${persona(s.lang)}
Answer the visitor's question ONLY from these approved FoodBridge articles; if they don't cover it, say you're not sure and suggest support@foodbridge.local. Under 100 words. If it fits, end by offering to help them donate food right now. List the indexes of the articles you used in usedDocs.
<approved_docs>
${docs}
</approved_docs>`,
    messages: conversation(s),
  });
  const sources = [...new Set(out.usedDocs)].filter((i) => s.docs[i]).map((i) => s.docs[i].title);
  return { result: { reply: out.answer, sources } };
}

async function chat(s: S): Promise<Partial<S>> {
  const out = await askStructured(z.object({ reply: z.string() }), {
    system: `${persona(s.lang)}
Reply naturally to the visitor's greeting or message in 1–3 sentences. If it's unrelated to food donation, gently say you're here to help with donating food and FoodBridge. Offer to help: they can tell you about leftover food to donate, or ask how FoodBridge works.`,
    messages: conversation(s),
    maxTokens: 500,
  });
  return { result: { reply: out.reply } };
}

const graph = new StateGraph(State)
  .addNode("understand", understand)
  .addNode("verify", verify)
  .addNode("respond", respond)
  .addNode("retrieve", retrieveDocs)
  .addNode("answer", answer)
  .addNode("chat", chat)
  .addEdge(START, "understand")
  .addConditionalEdges("understand", (s: S) => s.intent, { donate: "verify", question: "retrieve", greeting: "chat", other: "chat" })
  .addEdge("verify", "respond")
  .addEdge("respond", END)
  .addEdge("retrieve", "answer")
  .addEdge("answer", END)
  .addEdge("chat", END)
  .compile();

/* ------------------------------------------------------- no-AI help mode */

const QUESTION: Record<DraftField, string> = {
  foodType: "Lovely! What food would you like to donate? (e.g. chicken biryani, bread, rice and dal)",
  quantity: "How much is there? (e.g. 20 plates or 5 kg)",
  unit: "Is that in plates, kg, packets, boxes, litres or pieces?",
  category: "What kind of food is it: cooked, bakery, packaged, raw, fruits & vegetables, dairy or other?",
  preparedMinutesAgo: "When was it cooked or prepared? (e.g. 1 hour ago)",
  condition: "How is it now: fresh, good, or should it be eaten soon?",
  bestBeforeInHours: "For how many more hours will it stay good to eat? (e.g. 4 hours)",
  pickupInMinutes: "When can a volunteer pick it up? (e.g. in 30 minutes)",
  pickupAddress: "What’s the pickup address or area? (e.g. House 12, Road 5, Mirpur 10, Dhaka)",
};

const UNITS: [RegExp, DonationDraft["unit"]][] = [
  [/plate|প্লেট|থালা/i, "plates"],
  [/kg|kilo|কেজি/i, "kg"],
  [/packet|প্যাকেট/i, "packets"],
  [/box|বক্স/i, "boxes"],
  [/litre|liter|লিটার/i, "litres"],
  [/piece|pcs|পিস/i, "pieces"],
];
const CATEGORIES: [RegExp, DonationDraft["category"]][] = [
  [/bak|bread|cake|রুটি|কেক|পাউরুটি/i, "bakery"],
  [/pack|প্যাকেট/i, "packaged"],
  [/raw|কাঁচা/i, "raw"],
  [/fruit|veg|ফল|সবজি/i, "fruits_veg"],
  [/milk|dairy|দুধ|দই/i, "dairy"],
  [/cook|rice|biryani|curry|khichuri|ভাত|বিরিয়ানি|রান্না|খিচুড়ি|তরকারি/i, "cooked"],
  [/other|অন্য/i, "other"],
];

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
function firstNumber(text: string) {
  const plain = text.replace(/[০-৯]/g, (c) => String(BN_DIGITS.indexOf(c)));
  const m = plain.match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}
const minutesIn = (text: string) => {
  const n = firstNumber(text);
  if (/now|এখনই|এখন/i.test(text) && n === null) return 0;
  if (n === null) return null;
  return /min|মিনিট/i.test(text) ? n : n * 60;
};

/** Without an API key (or when every provider is busy): the same questions in order, reading each answer with simple rules. */
function runWithoutAi(input: string, draft: DonationDraft, asked: DraftField | null, siteLang: Lang): GuestReply {
  const text = input.trim();
  const lang = replyLang(text, siteLang);
  const wantsToDonate = /donat|leftover|surplus|give|দান|খাবার|বেঁচে/i.test(text);
  const d = { ...draft };
  const inProgress = ASK_ORDER.some(({ field }) => d[field] !== null);
  if (asked) {
    const n = firstNumber(text);
    switch (asked) {
      case "foodType":
        d.foodType = text.slice(0, 120);
        d.category ??= CATEGORIES.find(([re]) => re.test(text))?.[1] ?? null;
        break;
      case "quantity":
        if (n !== null && n > 0) d.quantity = n;
        d.unit ??= UNITS.find(([re]) => re.test(text))?.[1] ?? null;
        break;
      case "unit":
        d.unit = UNITS.find(([re]) => re.test(text))?.[1] ?? null;
        break;
      case "category":
        d.category = CATEGORIES.find(([re]) => re.test(text))?.[1] ?? null;
        break;
      case "condition":
        d.condition = /soon|তাড়াতাড়ি|শিগগির/i.test(text) ? "consume_soon" : /fresh|টাটকা|তাজা/i.test(text) ? "fresh" : "good";
        break;
      case "preparedMinutesAgo":
        d.preparedMinutesAgo = minutesIn(text);
        break;
      case "bestBeforeInHours": {
        const m = minutesIn(text);
        d.bestBeforeInHours = m === null ? null : m / 60;
        break;
      }
      case "pickupInMinutes":
        d.pickupInMinutes = minutesIn(text);
        break;
      case "pickupAddress":
        if (text.length >= 5) d.pickupAddress = text.slice(0, 250);
        break;
    }
  } else if (!wantsToDonate && !inProgress) {
    const [doc] = retrieve(text, "donor", 1);
    return { intent: "question", aiUsed: false, draft: null, step: null, asked: null, reply: `${doc.body.slice(0, 600)}${doc.body.length > 600 ? "…" : ""}`, sources: [doc.title] };
  }

  const missing = ASK_ORDER.filter(({ field }) => d[field] === null);
  if (missing.length) {
    const next = missing[0].field;
    return { intent: "donate", aiUsed: false, draft: { ...d, missing: missing.map((m) => m.label) }, step: "ask", asked: next, reply: translate(lang, QUESTION[next]) };
  }
  return {
    intent: "donate",
    aiUsed: false,
    draft: { ...d, missing: [] },
    step: "done",
    asked: null,
    reply: translate(lang, DONE_MESSAGE),
  };
}

/** One turn of the visitor assistant. `draft`/`asked` come back from the previous reply (kept in the browser). */
export async function runGuestAssistant(
  input: string,
  history: ChatTurn[],
  lang: Lang,
  state: { draft: DonationDraft | null; asked: DraftField | null },
): Promise<GuestReply> {
  const draft = { ...EMPTY, ...(state.draft ?? {}) };
  if (!aiEnabled()) return runWithoutAi(input, draft, state.asked, lang);
  let final: S;
  try {
    final = await graph.invoke(
      { input, history, lang, draft, confirmed: false, step: null, asked: null, problems: [], docs: [], result: null },
      { recursionLimit: 12 },
    );
  } catch (error) {
    // Every provider busy (e.g. free quota used up): keep a donation going with the rule-based questions.
    if (error instanceof AiUnavailableError && (state.asked || ASK_ORDER.some(({ field }) => draft[field] !== null))) {
      return runWithoutAi(input, draft, state.asked, lang);
    }
    throw error;
  }
  const donating = final.intent === "donate";
  const started = ASK_ORDER.some(({ field }) => final.draft[field] !== null);
  return {
    reply: final.result?.reply ?? translate(lang, "Sorry, I couldn’t work that out. Please try again."),
    intent: final.intent,
    // Keep a donation in progress even when they stop to ask a question.
    draft: started ? final.draft : null,
    step: donating ? final.step : null,
    asked: donating ? final.asked : state.asked,
    sources: final.result?.sources,
    aiUsed: true,
  };
}

export const DRAFT_FIELDS = ASK_ORDER.map((a) => a.field);
