"use client";
import { useState } from "react";
import type { DocsContent } from "@/lib/docs/model";
import Link from "next/link";
import Image from "next/image";

const field = "mt-1 w-full rounded-xl border border-brand-900/20 bg-white p-3 text-ink-900";
const localTime = (iso: string | null) => iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";
async function portrait(file: File) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 8 * 1024 * 1024) throw new Error("Choose a JPG, PNG or WebP image under 8 MB.");
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas"); canvas.width = 320; canvas.height = 320;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image processing unavailable.");
  const side = Math.min(bitmap.width, bitmap.height);
  context.fillStyle = "white"; context.fillRect(0, 0, 320, 320);
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 320, 320);
  bitmap.close(); return canvas.toDataURL("image/jpeg", 0.85);
}
export function DocsEditor({ initial }: { initial: { content: DocsContent; revision: number } }) {
  const [content, setContent] = useState(initial.content);
  const [revision, setRevision] = useState(initial.revision);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (patch: Partial<DocsContent>) => setContent((c) => ({ ...c, ...patch }));
  async function save() {
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/admin/docs", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, revision }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Save failed (${response.status}).`);
      setRevision(data.revision); setMessage("Saved. Public readers receive changes within 5 seconds.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Save failed."); }
    finally { setSaving(false); }
  }
  return <div className="space-y-8"><div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-semibold">Documentation studio</h1><div className="flex gap-4"><Link className="underline" href="/admin/docs/preview">Preview saved content</Link><Link className="underline" href="/docs">Public page</Link></div></div><p className="text-ink-600">Edit the story, publish team profiles and control access. Live figures and the source inventory update automatically. Team email addresses are public when published.</p>
    <form onSubmit={(event) => { event.preventDefault(); void save(); }} className="space-y-8">
      <fieldset disabled={saving} className="space-y-8 disabled:opacity-60">
        <section className="rounded-2xl border border-brand-900/15 bg-white p-6"><h2 className="text-xl font-semibold">Publishing & availability</h2><label className="mt-5 flex gap-3"><input type="checkbox" checked={content.enabled} onChange={(e) => update({ enabled: e.target.checked })}/>Public access ON</label><p className="mt-2 text-sm text-ink-600">OFF always returns 404, including outside the schedule. Empty dates mean no time restriction. End time is exclusive. Times use your browser timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).</p><div className="mt-4 grid gap-4 sm:grid-cols-2">{(["startsAt", "endsAt"] as const).map((key) => <label key={key}>{key === "startsAt" ? "Visible from" : "Visible until"}<input className={field} type="datetime-local" value={localTime(content[key])} onChange={(e) => update({ [key]: e.target.value ? new Date(e.target.value).toISOString() : null })}/></label>)}</div><div className="mt-5 flex flex-wrap gap-5">{(["showLive", "showTechnical", "showTeam"] as const).map((key) => <label key={key} className="flex gap-2"><input type="checkbox" checked={content[key]} onChange={(e) => update({ [key]: e.target.checked })}/>{ { showLive: "Live evidence", showTechnical: "Technical inventory", showTeam: "Team" }[key]}</label>)}</div></section>
        <section className="space-y-4"><h2 className="text-xl font-semibold">Opening pitch</h2><label className="block">Headline<input required maxLength={150} className={field} value={content.title} onChange={(e) => update({ title: e.target.value })}/></label><label className="block">Summary<textarea maxLength={300} className={field} value={content.tagline} onChange={(e) => update({ tagline: e.target.value })}/></label></section>
        <section className="space-y-4"><h2 className="text-xl font-semibold">Pitch & technical narrative</h2>{content.sections.map((section, index) => <details key={section.id} className="rounded-2xl border border-brand-900/15 bg-white p-5"><summary className="cursor-pointer font-semibold">{section.title}{!section.visible && " (hidden)"}</summary><div className="mt-4 space-y-4"><label className="flex gap-2"><input type="checkbox" checked={section.visible} onChange={(e) => update({ sections: content.sections.map((s, i) => i === index ? { ...s, visible: e.target.checked } : s) })}/>Show section</label><label className="block">Title<input required className={field} maxLength={120} value={section.title} onChange={(e) => update({ sections: content.sections.map((s, i) => i === index ? { ...s, title: e.target.value } : s) })}/></label><label className="block">Content (plain text)<textarea className={field} rows={7} maxLength={12000} value={section.body} onChange={(e) => update({ sections: content.sections.map((s, i) => i === index ? { ...s, body: e.target.value } : s) })}/></label><div className="flex gap-4"><button type="button" disabled={index === 0} onClick={() => { const sections = [...content.sections]; [sections[index - 1], sections[index]] = [sections[index], sections[index - 1]]; update({ sections }); }}>Move up</button><button type="button" onClick={() => update({ sections: content.sections.filter((_, i) => i !== index) })}>Remove section</button></div></div></details>)}<button type="button" disabled={content.sections.length >= 30} className="rounded-full border px-5 py-2" onClick={() => update({ sections: [...content.sections, { id: `section-${crypto.randomUUID()}`, title: "New section", body: "", visible: true }] })}>Add section</button></section>
        <section className="space-y-5"><h2 className="text-xl font-semibold">Team showcase</h2>{content.team.map((member, index) => <div key={member.id} className="grid gap-4 rounded-2xl border border-brand-900/15 bg-white p-5 sm:grid-cols-2">{(["name", "role", "email"] as const).map((key) => <label key={key} className="capitalize">{key}<input required type={key === "email" ? "email" : "text"} className={field} value={member[key]} onChange={(e) => update({ team: content.team.map((m, i) => i === index ? { ...m, [key]: e.target.value } : m) })}/></label>)}<label>Portrait (automatically cropped to 320 × 320)<input className={field} type="file" accept="image/jpeg,image/png,image/webp" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; try { const image = await portrait(file); setContent((c) => ({ ...c, team: c.team.map((m) => m.id === member.id ? { ...m, image } : m) })); } catch (error) { setMessage(String(error)); } }}/></label>{member.image && <div><Image unoptimized src={member.image} width={96} height={96} alt={`${member.name} preview`} className="rounded-xl"/></div>}<button type="button" onClick={() => update({ team: content.team.filter((m) => m.id !== member.id) })}>Remove member</button></div>)}<button type="button" disabled={content.team.length >= 20} className="rounded-full border px-5 py-2" onClick={() => update({ team: [...content.team, { id: crypto.randomUUID(), name: "", role: "", email: "", image: "" }] })}>Add team member</button></section>
      </fieldset><div className="sticky bottom-20 rounded-2xl border border-brand-900/15 bg-white p-4 shadow-lg"><button disabled={saving} className="rounded-full bg-brand-900 px-7 py-3 font-semibold text-white" type="submit">{saving ? "Saving…" : "Save changes"}</button><p role="status" className="mt-2 text-sm">{message}</p></div>
    </form>
  </div>;
}
