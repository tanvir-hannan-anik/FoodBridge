import "server-only";

import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import * as z from "zod";
import type { User } from "@/db/schema";
import { translate } from "@/lib/i18n";
import { getUserContext, type UserContext } from "./context";
import type { KnowledgeDoc } from "./knowledge";
import { aiEnabled, askStructured, type ChatTurn } from "./provider";
import { retrieve } from "./rag";
import { donationDraftSchema, needDraftSchema, type AssistantIntent, type AssistantReply, type DonationDraft, type NeedDraft, type Suggestion } from "./schemas";

/*
 * The assistant as a LangGraph state machine:
 *
 *   START → classify ─┬─ question ──────→ retrieve → answer ─→ END
 *                     ├─ donation_form ─→ draft_donation ────→ END   (donors)
 *                     ├─ request_form ──→ draft_request ─────→ END   (NGOs)
 *                     └─ my_updates ────→ gather → organise ──→ END
 *
 * The AI only answers, drafts and prioritises. Matching, expiry, food safety and permissions stay
 * rule-based elsewhere; nothing here writes to the database or acts for the user. Links in
 * suggestions come from the rule-based context (gather), never from the model.
 */

const State = Annotation.Root({
  user: Annotation<User>(),
  input: Annotation<string>(),
  history: Annotation<ChatTurn[]>(),
  intent: Annotation<AssistantIntent>(),
  docs: Annotation<KnowledgeDoc[]>(),
  context: Annotation<UserContext | null>(),
  result: Annotation<Omit<AssistantReply, "intent" | "aiUsed"> | null>(),
  /** The user's interface language; replies follow it unless they clearly write in the other one. */
  lang: Annotation<"en" | "bn">(),
});
type S = typeof State.State;

const today = () =>
  new Intl.DateTimeFormat("en-GB", { timeZone: process.env.APP_TIMEZONE ?? "Asia/Dhaka", dateStyle: "full", timeStyle: "short" }).format(new Date());

const BASE = `You are the FoodBridge assistant for the FoodWasteZero initiative in Dhaka, a platform where donors give surplus food, NGOs receive it and volunteers deliver it.
Be brief, warm and practical. Use British spelling and plain words. Answer in the language the user writes in (English or Bangla).
You cannot take actions, change data, accept or allocate food, or decide whether food is safe; the platform's rules do that. If asked to, explain what the user can do instead.`;

/** The shared instructions, plus a language hint for people using FoodBridge in Bangla. */
const base = (lang: "en" | "bn" = "en") =>
  lang === "bn"
    ? `${BASE}
The user is using FoodBridge in Bangla: reply in natural, simple Bangla (Bengali script) unless they clearly write in English. Keep food names, addresses and numbers as written.`
    : BASE;

const conversation = (s: S): ChatTurn[] => [...s.history.slice(-8), { role: "user", content: s.input }];

/* ---------------------------------------------------------------- nodes */

async function classify(s: S): Promise<Partial<S>> {
  const { intent } = await askStructured(
    z.object({ intent: z.enum(["question", "donation_form", "request_form", "my_updates"]) }),
    {
      system: `${base(s.lang)}
Classify the user's latest message:
- donation_form: they describe food they want to donate, or ask to fill/post a donation
- request_form: an NGO describing food it needs, or asking to create a food request
- my_updates: they ask what to do next, for a summary of their alerts, notifications, tasks or status
- question: anything else (how the platform works, rules, help)`,
      messages: conversation(s),
      maxTokens: 1000,
    },
  );
  // Forms are role-specific: anything else falls back to a normal answer.
  const allowed = (intent === "donation_form" && s.user.role !== "donor") || (intent === "request_form" && s.user.role !== "ngo") ? "question" : intent;
  return { intent: allowed };
}

function retrieveDocs(s: S): Partial<S> {
  const lastUser = s.history.filter((t) => t.role === "user").at(-1)?.content ?? "";
  return { docs: retrieve(`${s.input} ${lastUser}`, s.user.role) };
}

async function answer(s: S): Promise<Partial<S>> {
  const docs = s.docs.map((d, i) => `<doc index="${i}" title="${d.title}">\n${d.body}\n</doc>`).join("\n");
  const out = await askStructured(z.object({ answer: z.string(), usedDocs: z.array(z.number().int()) }), {
    system: `${base(s.lang)}
The user is a ${s.user.role} called ${s.user.name.split(" ")[0]}. Today is ${today()}.
Answer platform questions ONLY from these approved FoodWasteZero articles. If they don't cover it, say you're not sure and suggest contacting support@foodbridge.local. Keep it under 120 words; use short steps when explaining how to do something. List the indexes of the articles you used in usedDocs.
<approved_docs>
${docs}
</approved_docs>`,
    messages: conversation(s),
  });
  const sources = [...new Set(out.usedDocs)].filter((i) => s.docs[i]).map((i) => s.docs[i].title);
  return { result: { reply: out.answer, sources } };
}

/** Donation form draft from a donor's own words. Also used by the WhatsApp/Messenger integration. */
export async function draftDonationFrom(messages: ChatTurn[], lang: "en" | "bn" = "en") {
  return askStructured(z.object({ reply: z.string(), draft: donationDraftSchema }), {
    system: `${base(lang)}
Turn the donor's description into a donation form draft. Today is ${today()}. Only fill fields the user actually stated or that follow directly (e.g. "cooked this morning" → preparedMinutesAgo). Use null when unknown; never invent quantities, times or addresses. Pick the closest category, unit and condition.
List the required fields that are still missing in "missing" (food type, category, quantity, condition, prepared time, best-before, pickup time, pickup address).
In "reply", summarise the draft in one or two sentences and ask for the missing details, reminding them to check the form before posting. Do not judge whether the food is safe; the form checks the safety rules.`,
    messages,
  });
}

/** Food request draft from an NGO's own words. Also used by the WhatsApp/Messenger integration. */
export async function draftNeedFrom(messages: ChatTurn[], lang: "en" | "bn" = "en") {
  return askStructured(z.object({ reply: z.string(), draft: needDraftSchema }), {
    system: `${base(lang)}
Turn the NGO's description of what it needs into a food request draft. Today is ${today()}. Only fill what the user stated; null when unknown. category null means any food is fine. Never ask for or include names or personal details of the people being served.
List missing required fields (quantity, people to serve, area, needed-by time) in "missing". In "reply", summarise and ask for what's missing, reminding them to check the form before posting.`,
    messages,
  });
}

async function draftDonation(s: S): Promise<Partial<S>> {
  const out = await draftDonationFrom(conversation(s), s.lang);
  return { result: { reply: out.reply, donationDraft: out.draft satisfies DonationDraft } };
}

async function draftRequest(s: S): Promise<Partial<S>> {
  const out = await draftNeedFrom(conversation(s), s.lang);
  return { result: { reply: out.reply, needDraft: out.draft satisfies NeedDraft } };
}

async function gather(s: S): Promise<Partial<S>> {
  return { context: await getUserContext(s.user) };
}

async function organise(s: S): Promise<Partial<S>> {
  const ctx = s.context ?? { items: [], unread: [] };
  if (!ctx.items.length && !ctx.unread.length) {
    return { result: { reply: "You’re all caught up: nothing needs your attention right now.", suggestions: [] } };
  }
  const list = ctx.items.map((i) => `${i.id} [${i.priority}] ${i.title}: ${i.detail}`).join("\n");
  const alerts = ctx.unread.map((u) => `- ${u.message}`).join("\n");
  const out = await askStructured(z.object({ summary: z.string(), actionIds: z.array(z.string()) }), {
    system: `${base(s.lang)}
Help the user organise their work. Below are the things that need their attention (from the platform's rules) and their unread notifications. Write a short summary (max 80 words) of what's happening and what to do first. Then pick up to 5 action ids in the order they should be done (most urgent first, e.g. expiring food and waiting decisions first). Only use ids from the list.
<actions>
${list || "(none)"}
</actions>
<unread_notifications>
${alerts || "(none)"}
</unread_notifications>`,
    messages: conversation(s),
    maxTokens: 2000,
  });
  const byId = new Map(ctx.items.map((i) => [i.id, i]));
  const picked = out.actionIds.map((id) => byId.get(id)).filter((i): i is NonNullable<typeof i> => !!i);
  const suggestions: Suggestion[] = (picked.length ? picked : ctx.items.slice(0, 5)).map(({ title, detail, href, priority }) => ({ title, detail, href, priority }));
  return { result: { reply: out.summary, suggestions } };
}

/* ---------------------------------------------------------------- graph */

const graph = new StateGraph(State)
  .addNode("classify", classify)
  .addNode("retrieve", retrieveDocs)
  .addNode("answer", answer)
  .addNode("draft_donation", draftDonation)
  .addNode("draft_request", draftRequest)
  .addNode("gather", gather)
  .addNode("organise", organise)
  .addEdge(START, "classify")
  .addConditionalEdges("classify", (s: S) => s.intent, {
    question: "retrieve",
    donation_form: "draft_donation",
    request_form: "draft_request",
    my_updates: "gather",
  })
  .addEdge("retrieve", "answer")
  .addEdge("answer", END)
  .addEdge("draft_donation", END)
  .addEdge("draft_request", END)
  .addEdge("gather", "organise")
  .addEdge("organise", END)
  .compile();

/* ------------------------------------------------------- no-AI help mode */

/** Without an API key the assistant still helps: keyword routing, article excerpts and the rule-based to-do list. */
async function runWithoutAi(user: User, input: string, lang: "en" | "bn"): Promise<AssistantReply> {
  const text = input.toLowerCase();
  if (/(what should i do|next|summar|alert|notification|update|todo|to-do|task)/.test(text)) {
    const ctx = await getUserContext(user);
    return {
      intent: "my_updates",
      aiUsed: false,
      reply: translate(
        lang,
        ctx.items.length ? "Here’s what needs your attention:" : "You’re all caught up: nothing needs your attention right now.",
      ),
      suggestions: ctx.items.slice(0, 6).map(({ title, detail, href, priority }) => ({ title, detail, href, priority })),
    };
  }
  const [doc] = retrieve(input, user.role, 1);
  return {
    intent: "question",
    aiUsed: false,
    reply: `${doc.body.slice(0, 700)}${doc.body.length > 700 ? "…" : ""}`,
    sources: [doc.title],
  };
}

/** Runs one assistant turn for a signed-in user. */
export async function runAssistant(user: User, input: string, history: ChatTurn[], lang: "en" | "bn" = "en"): Promise<AssistantReply> {
  if (!aiEnabled()) return runWithoutAi(user, input, lang);
  const final = await graph.invoke({ user, input, history, docs: [], context: null, result: null, lang }, { recursionLimit: 12 });
  return { ...(final.result ?? { reply: "Sorry, I couldn’t work that out. Please try again." }), intent: final.intent, aiUsed: true };
}
