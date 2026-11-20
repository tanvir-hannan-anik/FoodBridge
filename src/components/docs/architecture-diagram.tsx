export function ArchitectureDiagram() {
  return <figure className="overflow-x-auto rounded-2xl border border-brand-900/15 bg-white p-4">
    <svg viewBox="0 0 720 280" className="min-w-[520px]" role="img" aria-labelledby="architecture-title architecture-description">
      <title id="architecture-title">FoodBridge system architecture</title>
      <desc id="architecture-description">Web clients pass through session checks into domain services and the database. LangGraph reaches the same services through MCP. n8n reaches them through the authenticated integration API.</desc>
      <defs><marker id="docs-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="#166534"/></marker></defs>
      <g stroke="#166534" strokeWidth="2" markerEnd="url(#docs-arrow)"><path d="M145 135 H195"/><path d="M345 135 H395"/><path d="M545 135 H595"/><path d="M270 65 V105"/><path d="M470 215 V165"/></g>
      {[
        { x: 5, y: 105, width: 140, label: "Web / portals" },
        { x: 195, y: 105, width: 150, label: "Auth + API routes" },
        { x: 395, y: 105, width: 150, label: "Domain services" },
        { x: 595, y: 105, width: 120, label: "Postgres" },
        { x: 195, y: 5, width: 150, label: "n8n integration" },
        { x: 365, y: 215, width: 210, label: "LangGraph → MCP reads" },
      ].map((node) => <g key={node.label}><rect x={node.x} y={node.y} width={node.width} height="60" rx="12" fill="#f0fdf4" stroke="#bbf7d0"/><text x={node.x + node.width / 2} y={node.y + 35} textAnchor="middle" fontSize="13" fill="#14532d">{node.label}</text></g>)}
    </svg><figcaption className="mt-2 text-sm text-ink-500">Services enforce the workflow. The assistant reads data; the application controls changes.</figcaption>
  </figure>;
}
