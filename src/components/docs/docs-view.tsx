"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { DocsContent } from "@/lib/docs/model";
import { isDocsPublic } from "@/lib/docs/model";
import type { docsMetrics } from "@/lib/docs/service";
import { ArchitectureDiagram } from "./architecture-diagram";
import manifest from "@/lib/docs/manifest.json";

type Snapshot = { content: DocsContent; revision: number; updatedAt: string | null; metrics: Awaited<ReturnType<typeof docsMetrics>> | null };
export function DocsView({ initial, preview = false }: { initial: Snapshot; preview?: boolean }) {
  const [snapshot, setSnapshot] = useState(initial);
  const [closed, setClosed] = useState(false);
  const [stale, setStale] = useState(false);
  useEffect(() => {
    if (preview) return;
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/docs", { cache: "no-store" });
        if (!active) return;
        if (response.status === 404) { setClosed(true); return; }
        if (!response.ok) throw new Error("Unavailable");
        const data = await response.json();
        if (active) { setSnapshot(data); setStale(false); setClosed(false); }
      } catch { if (active) setStale(true); }
    };
    const poll = setInterval(refresh, 5000);
    const expiry = setInterval(() => { if (!isDocsPublic(snapshot.content)) setClosed(true); }, 1000);
    return () => { active = false; clearInterval(poll); clearInterval(expiry); };
  }, [preview, snapshot.content]);
  if (closed) return <main className="p-12 text-center"><h1 className="text-3xl">Documentation is not available.</h1><Link href="/">Return to FoodBridge</Link></main>;
  const { content, metrics } = snapshot;
  const sections = content.sections.filter((s) => s.visible);
  return <main id="main" className="min-h-screen bg-cream-50 text-ink-900">
    <header className="border-b border-brand-900/10 bg-white px-6 py-5"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4"><Link href="/" className="text-xl font-bold text-brand-900">FoodBridge<span className="ml-3 text-sm font-normal text-ink-500">Field guide</span></Link><span className="text-sm">{preview ? "Admin preview · unpublished content" : "Product / Impact / Engineering"}</span></div></header>
    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-20">
      <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-brand-700">Food rescue, with accountability</p>
      <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">{content.title}</h1>
      <p className="mt-6 max-w-3xl text-lg leading-relaxed text-ink-600">{content.tagline}</p>
      <p className="mt-6 text-sm text-ink-500">Two minutes for the story. Ten minutes for the system.{snapshot.updatedAt && ` Updated ${new Date(snapshot.updatedAt).toLocaleDateString()}.`}</p>
      {stale && <p role="status" className="mt-4 text-amber-800">Live refresh unavailable. Showing the last successful snapshot.</p>}
      <div className="mt-12 grid gap-10 lg:grid-cols-[210px_1fr]">
        <nav aria-label="Documentation sections" className="lg:sticky lg:top-6 lg:self-start"><div className="flex gap-3 overflow-x-auto pb-3 lg:flex-col">{sections.map((s) => <a key={s.id} href={`#${s.id}`} className="shrink-0 text-sm text-brand-800 hover:underline">{s.title}</a>)}{content.showLive && <a href="#live">Live evidence</a>}{content.showTechnical && <a href="#technical">System reference</a>}{content.showTeam && <a href="#team">Team</a>}</div></nav>
        <div className="min-w-0 space-y-12">
          {sections.map((s) => <section key={s.id} id={s.id} className="scroll-mt-8 border-t border-brand-900/15 pt-7"><h2 className="text-2xl font-semibold sm:text-3xl">{s.title}</h2><p className="mt-5 whitespace-pre-wrap leading-8 text-ink-600">{s.body}</p></section>)}
          {content.showLive && metrics && <section id="live" className="rounded-3xl bg-brand-950 p-6 text-white sm:p-8"><h2 className="text-3xl font-semibold">Live evidence</h2><p className="mt-3 text-brand-100">Database snapshot · {new Date(metrics.at).toLocaleString()} · refreshes every 5 seconds</p><p className="mt-2 text-sm text-brand-100">{metrics.demo ? "Demo mode is enabled. These figures include seeded activity." : "Operational records; demo/test records may be present. Not independently audited."}</p><dl className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3">{Object.entries({ "Registered users": metrics.users, "Donations posted": metrics.donations, "Deliveries completed": metrics.delivered, "Meals recorded": metrics.meals, NGOs: metrics.ngos, Volunteers: metrics.volunteers }).map(([label, value]) => <div key={label}><dd className="text-4xl font-semibold">{value.toLocaleString()}</dd><dt className="mt-2 text-sm text-brand-100">{label}</dt></div>)}</dl><p className="mt-5 text-xs text-brand-100">Users exclude admins. Deliveries include delivered and distributed donations. Meals use NGO-reported counts where present, otherwise donation estimates for completed distributions.</p><h3 className="mt-8 font-semibold">Recent lifecycle events</h3><ul className="mt-3 space-y-2 text-sm">{metrics.events.length ? metrics.events.map((e, i) => <li key={i} className="flex justify-between gap-4"><span>{e.status.replaceAll("_", " ")}</span><time>{new Date(e.at).toLocaleString()}</time></li>) : <li>No lifecycle events recorded yet.</li>}</ul></section>}
          {content.showTechnical && <section id="technical" className="space-y-6"><h2 className="text-3xl font-semibold">System reference</h2><p className="text-sm text-ink-500">Generated from the deployed source at {new Date(manifest.generatedAt).toLocaleString()}. Regenerated on development start and production build.</p><h3 className="text-xl font-semibold">Architecture & data flow</h3><ArchitectureDiagram/><div role="img" aria-label="Browser to authenticated Next.js routes to domain services to Drizzle and Postgres. LangGraph uses MCP services; n8n uses integration routes." className="grid gap-3 rounded-2xl border border-brand-900/15 bg-white p-5 sm:grid-cols-2">{["Browser / role portals", "Next.js routes + session checks", "Domain services + validation", "Drizzle → PostgreSQL / PGlite", "LangGraph → MCP → scoped reads", "n8n → authenticated integration API"].map((label) => <div key={label} className="rounded-xl bg-cream-100 p-4 text-center font-medium">{label}</div>)}</div><p className="rounded-xl border border-brand-900/15 p-4 leading-8">Donation posted → NGO allocation → Volunteer assignment → Pickup → Delivery → NGO distribution</p><h3 className="text-xl font-semibold">Source modules</h3><div className="flex flex-wrap gap-2">{manifest.features.map((f) => <span key={f} className="rounded-full bg-brand-100 px-3 py-1 text-sm">{f}</span>)}</div><h3 className="text-xl font-semibold">API inventory</h3><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-3">Route</th><th className="p-3">Methods</th></tr></thead><tbody>{manifest.routes.map((r) => <tr key={r.path} className="border-t border-brand-900/10"><td className="p-3 font-mono">{r.path}</td><td className="p-3">{r.methods.join(", ")}</td></tr>)}</tbody></table></div><p className="text-sm text-ink-600">Listing an API does not grant access. Routes enforce their existing session, role or integration-secret requirements. MCP exposes three read-only tools; it does not authorise database mutations.</p><details><summary className="cursor-pointer font-semibold">Dependencies & versions</summary><dl className="mt-4 grid gap-2 text-sm">{Object.entries(manifest.stack).map(([key, version]) => <div key={key} className="flex justify-between gap-3"><dt>{key}</dt><dd>{version}</dd></div>)}</dl></details></section>}
          {content.showTeam && <section id="team"><h2 className="text-3xl font-semibold">The people behind FoodBridge</h2><div className="mt-6 grid gap-5 sm:grid-cols-2">{content.team.map((member) => <article key={member.id} className="rounded-2xl border border-brand-900/10 bg-white p-5"><Image unoptimized src={member.image || "/favicon.ico"} hidden={!member.image} alt={member.name} width={160} height={160} className="mb-4 aspect-square w-28 rounded-2xl object-cover"/><h3 className="text-xl font-semibold">{member.name}</h3><p className="text-ink-600">{member.role}</p><a className="mt-3 block break-all text-brand-700 underline" href={`mailto:${member.email}`}>{member.email}</a></article>)}</div>{!content.team.length && <p className="mt-4 text-ink-500">Team profiles have not been published yet.</p>}</section>}
        </div>
      </div>
    </div>
  </main>;
}
