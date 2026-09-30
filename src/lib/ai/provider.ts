import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z from "zod";

/*
 * The only file that talks to an LLM. Everything else in lib/ai works with plain types, so the
 * provider or model can be swapped here without touching the graph, the knowledge base or the UI.
 *
 * Providers are tried in order; if one fails (quota, outage, bad JSON) the next one answers.
 * Config (env) — set at least one key, otherwise the assistant runs in a no-AI help mode:
 *   GEMINI_API_KEY      Google Gemini (free tier)      GEMINI_MODEL      comma list, default gemini-flash-latest,gemini-2.5-flash
 *   OPENROUTER_API_KEY  OpenRouter (free models)       OPENROUTER_MODEL  default openrouter/free
 *   ANTHROPIC_API_KEY   Claude (optional)              AI_MODEL / AI_EFFORT  default claude-opus-5 / low
 *   AI_DISABLED=true    turns the AI off everywhere
 */

const TIMEOUT_MS = 45_000;

export class AiUnavailableError extends Error {}

export type ChatTurn = { role: "user" | "assistant"; content: string };
type Request = {
  system: string;
  messages: ChatTurn[];
  maxTokens: number;
  schema: z.ZodType;
};

/** HTTP failure from a provider; the status decides the message the user sees. */
class ProviderError extends Error {
  constructor(
    readonly provider: string,
    readonly status: number,
    detail: string,
  ) {
    super(`${provider} ${status}: ${detail.slice(0, 300)}`);
  }
}

type Provider = {
  name: string;
  ready: () => boolean;
  ask: (req: Request) => Promise<unknown>;
};

/** JSON Schema for the prompt/response format (without the `$schema` key some APIs reject). */
function jsonSchema(schema: z.ZodType) {
  const out = z.toJSONSchema(schema) as Record<string, unknown>;
  delete out.$schema;
  return out;
}

/** Models without native structured output get the schema in the system prompt. */
function withSchema(system: string, schema: z.ZodType) {
  return `${system}\n\nReply with ONLY one JSON object (no markdown, no code fences) that matches this JSON Schema:\n${JSON.stringify(jsonSchema(schema))}`;
}

/** Parses a JSON reply, tolerating code fences or text around the object. */
function parseJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no JSON object in reply");
  return JSON.parse(text.slice(start, end + 1));
}

async function post(provider: string, url: string, headers: Record<string, string>, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new ProviderError(provider, res.status, await res.text().catch(() => ""));
  return res.json();
}

const gemini: Provider = {
  name: "gemini",
  ready: () => !!process.env.GEMINI_API_KEY,
  async ask(req) {
    // The free tier is often briefly overloaded (503/429) on one model, so try the next model first.
    const models = (process.env.GEMINI_MODEL || "gemini-flash-latest,gemini-2.5-flash")
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    let last: unknown = null;
    for (const model of models) {
      try {
        return await askGemini(model, req);
      } catch (error) {
        last = error;
        if (!(error instanceof ProviderError && (error.status === 429 || error.status >= 500))) throw error;
      }
    }
    throw last;
  },
};

async function askGemini(model: string, { system, messages, maxTokens, schema }: Request) {
  const data = await post(
    "gemini",
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    { "x-goog-api-key": process.env.GEMINI_API_KEY! },
    {
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseJsonSchema: jsonSchema(schema),
      },
    },
  );
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("");
  if (!text) throw new Error(`gemini returned no text (${data?.candidates?.[0]?.finishReason ?? data?.promptFeedback?.blockReason ?? "unknown"})`);
  return parseJson(text);
}

const openRouter: Provider = {
  name: "openrouter",
  ready: () => !!process.env.OPENROUTER_API_KEY,
  async ask({ system, messages, maxTokens, schema }) {
    const data = await post(
      "openrouter",
      "https://openrouter.ai/api/v1/chat/completions",
      {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "X-Title": "FoodBridge",
      },
      {
        model: process.env.OPENROUTER_MODEL || "openrouter/free",
        max_tokens: maxTokens,
        temperature: 0.2,
        messages: [{ role: "system", content: withSchema(system, schema) }, ...messages],
      },
    );
    const text: string | undefined = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error("openrouter returned no text");
    return parseJson(text);
  },
};

let anthropicClient: Anthropic | null = null;
const anthropic: Provider = {
  name: "anthropic",
  ready: () => !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN),
  async ask({ system, messages, maxTokens, schema }) {
    anthropicClient ??= new Anthropic({ timeout: 60_000, maxRetries: 1 });
    const effort = (["low", "medium", "high", "xhigh", "max"] as const).find((e) => e === process.env.AI_EFFORT) ?? "low";
    try {
      // Server-side fallbacks: a request declined by the primary model is retried on Anthropic's fallback model.
      const response = await anthropicClient.beta.messages.parse({
        model: process.env.AI_MODEL || "claude-opus-5",
        max_tokens: maxTokens,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        system,
        messages,
        output_config: { effort, format: betaZodOutputFormat(schema) },
      });
      if (response.stop_reason === "refusal") throw new Error("anthropic refused");
      if (!response.parsed_output) throw new Error(`anthropic incomplete (${response.stop_reason})`);
      return response.parsed_output;
    } catch (error) {
      if (error instanceof Anthropic.APIError) throw new ProviderError("anthropic", error.status ?? 500, error.message);
      throw error;
    }
  },
};

const PROVIDERS = [gemini, openRouter, anthropic];

export function aiEnabled() {
  return process.env.AI_DISABLED !== "true" && PROVIDERS.some((p) => p.ready());
}

/**
 * One structured call: the reply must validate against `schema`. Tries each configured provider
 * in order and returns the first valid answer; if every one fails, throws AiUnavailableError with
 * a message that's safe to show the user.
 */
export async function askStructured<S extends z.ZodType>(
  schema: S,
  { system, messages, maxTokens = 4000 }: { system: string; messages: ChatTurn[]; maxTokens?: number },
): Promise<z.infer<S>> {
  const ready = PROVIDERS.filter((p) => p.ready());
  if (!aiEnabled() || ready.length === 0) throw new AiUnavailableError("AI is not configured");

  let last: unknown = null;
  for (const provider of ready) {
    try {
      const parsed = schema.safeParse(await provider.ask({ system, messages, maxTokens, schema }));
      if (parsed.success) return parsed.data;
      last = new Error(`${provider.name}: reply didn’t match the schema`);
    } catch (error) {
      last = error;
    }
    console.warn("assistant provider failed, trying the next one:", last instanceof Error ? last.message : last);
  }

  if (last instanceof ProviderError && last.status === 429) throw new AiUnavailableError("The assistant is busy right now. Please try again in a minute.");
  if (last instanceof ProviderError && (last.status === 401 || last.status === 403)) {
    throw new AiUnavailableError("The assistant isn’t set up correctly (API key). Please tell the FoodBridge team.");
  }
  throw new AiUnavailableError("The assistant is unavailable right now. Please try again.");
}
