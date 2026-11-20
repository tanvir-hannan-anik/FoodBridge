import { z } from "zod";

export const sectionSchema = z.object({ id: z.string().regex(/^[a-z][a-z0-9-]{0,50}$/), title: z.string().min(1).max(120), body: z.string().max(12000), visible: z.boolean() });
export const docsSchema = z.object({
  enabled: z.boolean(), startsAt: z.string().datetime().nullable(), endsAt: z.string().datetime().nullable(),
  title: z.string().min(1).max(150), tagline: z.string().max(300),
  sections: z.array(sectionSchema).max(30),
  team: z.array(z.object({ id: z.string().uuid(), name: z.string().min(1).max(100), role: z.string().max(100), email: z.string().email(), image: z.string().max(500000).regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/).or(z.literal("")) })).max(20),
  showLive: z.boolean(), showTechnical: z.boolean(), showTeam: z.boolean(),
}).superRefine((value, ctx) => {
  if (value.startsAt && value.endsAt && value.startsAt >= value.endsAt) ctx.addIssue({ code: "custom", message: "End must be after start." });
  if (new Set(value.sections.map((s) => s.id)).size !== value.sections.length) ctx.addIssue({ code: "custom", message: "Section IDs must be unique." });
});
export type DocsContent = z.infer<typeof docsSchema>;
export function publicDocs(content: DocsContent): DocsContent {
  return { ...content, sections: content.sections.filter((s) => s.visible), team: content.showTeam ? content.team : [] };
}
export function isDocsPublic(content: DocsContent, now = new Date()) {
  return content.enabled && (!content.startsAt || now >= new Date(content.startsAt)) && (!content.endsAt || now < new Date(content.endsAt));
}
const section = (id: string, title: string, body: string) => ({ id, title, body, visible: true });
export const defaultDocs: DocsContent = {
  enabled: false, startsAt: null, endsAt: null, title: "Good food. A shorter path to people.",
  tagline: "FoodBridge connects surplus-food donors, NGOs and volunteers across Bangladesh in one accountable delivery workflow.",
  showLive: true, showTechnical: true, showTeam: true, team: [],
  sections: [
    section("problem", "Good food is lost. People still go hungry.", "Surplus food is time-sensitive. Donors need a reliable way to offer it, NGOs need visibility into availability, and volunteers need clear pickup and delivery tasks. Phone calls and scattered messages make coordination difficult."),
    section("solution", "One shared journey, from surplus to service.", "Donors post food with quantity and expiry. NGOs request available food or publish their needs. Matching considers expiry, distance and quantity. Volunteers collect and deliver; NGOs confirm distribution. Each step is recorded."),
    section("product", "Four roles. One accountable workflow.", "Donors track their donations. NGOs find food and record meals served. Volunteers manage pickup and delivery. Admins verify partners, review food-safety concerns and resolve stuck work. English and Bangla interfaces support local use."),
    section("market", "Start with the people moving food every day.", "FoodBridge serves restaurants, hotels, shops and households alongside NGOs and volunteer networks in Bangladesh. Market size and adoption forecasts have not been validated; no financial market estimate is claimed here."),
    section("traction", "Evidence before projections.", "The live dashboard below reads the application database. Seeded/demo records may be present and do not establish commercial traction. Meals are operational estimates or NGO-reported counts, not an independently audited impact measurement."),
    section("business", "A model to validate with partners.", "FoodBridge is currently a coordination platform. Revenue, pricing and unit economics have not been validated. Partner-supported operations and institutional programmes are hypotheses for discovery, not established revenue streams."),
    section("distribution", "Grow through trusted local partners.", "Proposed rollout: recruit a small group of verified donors and NGOs, establish reliable delivery coverage, review completion and expiry outcomes, then expand by service area. This is a rollout plan, not a claim of signed partnerships."),
    section("advantage", "Coordination with traceability.", "FoodBridge combines role-based access, expiry-aware matching, volunteer dispatch, proof of delivery and reporting in one workflow. The assistant supports questions and drafts; food-safety and allocation decisions remain controlled by application rules."),
    section("roadmap", "Prove reliability, then expand.", "Priorities include partner pilots, operational monitoring, resilient notification delivery and measured improvements to completion rates. Production scaling will require shared rate limiting, durable media storage and wider automated regression coverage."),
    section("ask", "Help us make the next delivery possible.", "We welcome pilot donors, NGO partners, volunteer coordinators and technical feedback. Contact the published team below to discuss participation. Funding targets and commitments have not been announced."),
    section("engineering", "Engineering and operating model", "Next.js serves the UI, authenticated Server Actions and API routes. Domain services enforce ownership, food safety and lifecycle transitions. Drizzle uses hosted Postgres in production and PGlite locally. JWT sessions are checked against account status and session version. LangGraph uses read-only MCP tools; n8n supports linked chat workflows. See MCP_DOCUMENTATION.md in the repository for verification limits."),
  ],
};
