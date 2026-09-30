import type { CSSProperties, ReactNode } from "react";

/**
 * Animated hero illustration: a restaurant and a community kitchen joined by a bridge,
 * with a delivery van crossing it. Pure SVG + CSS (SMIL for the path motion) — no client JS.
 * With prefers-reduced-motion the van is shown parked mid-bridge instead.
 */

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

const INK = "#11422f";
const CREAM = "#fdfbf6";
const WATER = "#cde8ea";
const ROAD = "M190 414 Q300 318 410 414";

export function HeroScene() {
  return (
    <div className="relative mx-auto aspect-[600/540] w-full max-w-[560px]">
      {/* soft dotted halo behind the scene */}
      <div
        aria-hidden
        className="dots absolute inset-[6%] rounded-full text-brand-900/10 [mask-image:radial-gradient(closest-side,black,transparent)]"
      />

      <svg
        viewBox="0 0 600 540"
        role="img"
        aria-label="Illustration: a delivery van carries food across a bridge from a restaurant to a community kitchen."
        className="relative h-full w-full animate-rise"
        style={d(150)}
      >
        <defs>
          <clipPath id="scene-window">
            <circle cx="300" cy="280" r="232" />
          </clipPath>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fbf1dc" />
            <stop offset="1" stopColor="#f8f3e7" />
          </linearGradient>
          <path id="road" d={ROAD} />
        </defs>

        {/* rotating dashed orbit */}
        <g className="origin-center animate-spin-slow [transform-box:view-box]">
          <circle cx="300" cy="280" r="258" fill="none" stroke="#e3d4b3" strokeWidth="2" strokeDasharray="2 12" />
        </g>

        <g clipPath="url(#scene-window)">
          <rect x="0" y="0" width="600" height="540" fill="url(#sky)" />

          {/* sun */}
          <g className="animate-float-slow">
            <circle cx="438" cy="138" r="52" fill="#fcd68b" opacity="0.45" />
            <circle cx="438" cy="138" r="34" fill="#f6b13a" />
          </g>

          {/* clouds */}
          <g className="animate-float" style={d(0)}>
            <path d="M120 150c0-14 12-24 26-22 6-12 24-14 32-2 14-2 24 10 20 24H120Z" fill="#fff" opacity="0.95" />
          </g>
          <g className="animate-float-slow">
            <path d="M300 102c0-10 9-17 19-15 5-9 18-10 24-1 10-1 17 7 14 16h-57Z" fill="#fff" opacity="0.8" />
          </g>

          {/* birds */}
          <g fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" className="animate-float" style={d(0)}>
            <path d="M360 178q6-6 12 0q6-6 12 0" />
            <path d="M388 196q4-4 8 0q4-4 8 0" opacity="0.7" />
          </g>

          {/* hills */}
          <path d="M40 400C110 330 190 340 250 380S420 320 560 372V540H40Z" fill="#b3e6c8" />
          <path d="M40 420h180l30 14h100l30-14h180V540H40Z" fill="#d8f3e2" />

          {/* trees */}
          <g>
            <rect x="55" y="372" width="6" height="30" rx="3" fill={INK} />
            <circle cx="58" cy="364" r="20" fill="#4bb780" />
            <rect x="540" y="370" width="6" height="30" rx="3" fill={INK} />
            <circle cx="543" cy="360" r="22" fill="#289b63" />
          </g>

          {/* river under the bridge */}
          <path d="M210 434h180l-8 106H218Z" fill={WATER} />
          <g fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeDasharray="12 12">
            <path d="M232 462h136" className="animate-flow" />
            <path d="M226 490h148" className="animate-flow" style={{ animationDuration: "2s" }} />
          </g>

          {/* ---------- restaurant (donor) ---------- */}
          <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
            <rect x="78" y="300" width="124" height="122" rx="6" fill={CREAM} />
            <rect x="70" y="276" width="140" height="30" rx="8" fill="#1a7d4f" />
            {/* awning */}
            <path d="M78 306h124v22H78Z" fill={CREAM} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <path key={i} d={`M${78 + i * 20.6} 306h20.6v22h-20.6Z`} fill={i % 2 ? CREAM : "#f6b13a"} strokeWidth="0" />
            ))}
            <path
              d="M78 328a10.3 7 0 0 0 20.6 0a10.3 7 0 0 0 20.6 0a10.3 7 0 0 0 20.6 0a10.3 7 0 0 0 20.6 0a10.3 7 0 0 0 20.6 0a10.3 7 0 0 0 20.6 0"
              fill="#f6b13a"
            />
            <rect x="92" y="346" width="46" height="38" rx="5" fill={WATER} />
            <path d="M115 346v38M92 365h46" strokeWidth="2" />
            <rect x="152" y="352" width="36" height="70" rx="5" fill="#289b63" />
            <circle cx="180" cy="390" r="2.5" fill={CREAM} strokeWidth="0" />
          </g>
          <text x="140" y="296" textAnchor="middle" fontSize="13" fontWeight="800" letterSpacing="3" fill={CREAM}>
            KITCHEN
          </text>

          {/* ---------- community kitchen (NGO) ---------- */}
          <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
            <rect x="404" y="322" width="120" height="100" rx="6" fill={CREAM} />
            <path d="M392 328 464 262l72 66Z" fill="#e5573d" />
            <rect x="447" y="362" width="34" height="60" rx="5" fill="#f6b13a" />
            <rect x="416" y="346" width="22" height="22" rx="4" fill={WATER} />
            <rect x="490" y="346" width="22" height="22" rx="4" fill={WATER} />
          </g>
          <path
            d="M464 316c-9-7-15-11-15-17a7 7 0 0 1 15-3 7 7 0 0 1 15 3c0 6-6 10-15 17Z"
            fill={CREAM}
            className="origin-center animate-beat [transform-box:fill-box]"
          />

          {/* ---------- bridge ---------- */}
          <g fill="none" stroke={INK} strokeLinecap="round">
            <path d="M214 446Q300 366 386 446" strokeWidth="6" />
            <path d="M247 386 257 412M300 374v26M353 386l-10 26" strokeWidth="3" />
            <path d="M206 420v26M394 420v26" strokeWidth="6" />
          </g>
          <use href="#road" fill="none" stroke={INK} strokeWidth="16" strokeLinecap="round" />
          <use
            href="#road"
            fill="none"
            stroke="#f6b13a"
            strokeWidth="2.5"
            strokeDasharray="10 14"
            className="animate-flow"
          />

          {/* ---------- delivery van ---------- */}
          <g className="motion-only">
            <g opacity="0">
              <Van />
              <animateMotion
                dur="7s"
                repeatCount="indefinite"
                rotate="auto"
                keyPoints="0;0;1;1"
                keyTimes="0;0.12;0.82;1"
                calcMode="spline"
                keySplines="0 0 1 1;0.45 0 0.55 1;0 0 1 1"
              >
                <mpath href="#road" />
              </animateMotion>
              <animate
                attributeName="opacity"
                values="0;1;1;1;0"
                keyTimes="0;0.06;0.5;0.9;1"
                dur="7s"
                repeatCount="indefinite"
              />
            </g>
          </g>
          <g className="motion-static" transform="translate(300 366)">
            <Van />
          </g>

          {/* steaming bowl above the restaurant */}
          <g className="animate-float" style={{ animationDelay: "-2s" }}>
            <g fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" opacity="0.6">
              <path d="M126 214q-6-8 0-16t0-16" className="animate-steam" />
              <path d="M140 212q-6-8 0-16t0-16" className="animate-steam" style={{ animationDelay: "0.8s" }} />
              <path d="M154 214q-6-8 0-16t0-16" className="animate-steam" style={{ animationDelay: "1.6s" }} />
            </g>
            <ellipse cx="140" cy="226" rx="36" ry="9" fill="#80d2a6" stroke={INK} strokeWidth="3" />
            <path d="M104 226a36 30 0 0 0 72 0Z" fill="#f6b13a" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
            <path d="M126 252h28" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          </g>

          {/* hearts rising from the community kitchen */}
          <Heart x={430} y={226} delay="-1s" size={0.9} />
          <Heart x={494} y={214} delay="-3s" size={1.2} />
        </g>
      </svg>

      {/* floating status chips */}
      <Chip className="top-[9%] left-0 sm:-left-4" delay={700}>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-100 text-accent-700">
          <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
            <path d="M3 12h18a9 9 0 0 1-18 0ZM8 8c0-1.5 1-2 1-3.5M12 8c0-1.5 1-2 1-3.5M16 8c0-1.5 1-2 1-3.5" strokeLinecap="round" />
          </svg>
        </span>
        <span>
          <span className="block text-sm font-semibold text-ink-900">Donation posted</span>
          <span className="block text-xs text-ink-500">40 plates · Biryani</span>
        </span>
      </Chip>

      <Chip className="top-[79%] left-0 max-sm:hidden sm:-left-6" delay={1100} floatDelay="-3s">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
          <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className="size-4">
            <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z" />
          </svg>
        </span>
        <span>
          <span className="block text-sm font-semibold text-ink-900">Picked up</span>
          <span className="block text-xs text-ink-500">Volunteer · 8 min away</span>
        </span>
      </Chip>

      <div aria-hidden className="absolute right-[2%] bottom-[2%]">
        <div className="animate-pop" style={d(1500)}>
          <div className="flex items-center gap-2 rounded-full bg-brand-950 py-2 pr-4 pl-2 text-sm font-semibold text-cream-50 shadow-raised">
            <span className="grid size-7 place-items-center rounded-full bg-accent-400 text-brand-950">
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-4 animate-beat">
                <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
              </svg>
            </span>
            +40 meals saved
          </div>
        </div>
      </div>
    </div>
  );
}

function Van() {
  return (
    <g stroke={INK} strokeWidth="2.2" strokeLinejoin="round">
      <rect x="-26" y="-32" width="32" height="24" rx="3" fill={CREAM} />
      <path d="M-10 -24c-3-2.5-5-4-5-6a2.4 2.4 0 0 1 5-1 2.4 2.4 0 0 1 5 1c0 2-2 3.5-5 6Z" fill="#e5573d" strokeWidth="0" />
      <path d="M6 -26h10l8 9v9H6Z" fill="#1a7d4f" />
      <path d="M10 -22h5l5 6h-10Z" fill={WATER} strokeWidth="1.6" />
      <circle cx="-15" cy="-6" r="5.5" fill={INK} />
      <circle cx="15" cy="-6" r="5.5" fill={INK} />
      <circle cx="-15" cy="-6" r="1.8" fill={CREAM} strokeWidth="0" />
      <circle cx="15" cy="-6" r="1.8" fill={CREAM} strokeWidth="0" />
    </g>
  );
}

function Heart({ x, y, delay, size }: { x: number; y: number; delay: string; size: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`}>
      <g className="animate-float" style={{ animationDelay: delay }}>
        <path d="M0 10C-8 4-12 1-12-4a6 6 0 0 1 12-2.5A6 6 0 0 1 12-4c0 5-4 8-12 14Z" fill="#e5573d" />
      </g>
    </g>
  );
}

function Chip({
  className,
  delay,
  floatDelay = "0s",
  children,
}: {
  className: string;
  delay: number;
  floatDelay?: string;
  children: ReactNode;
}) {
  return (
    <div aria-hidden className={`absolute ${className}`}>
      <div className="animate-pop" style={d(delay)}>
        <div className="animate-float" style={{ animationDelay: floatDelay }}>
          <div className="flex items-center gap-3 rounded-2xl border border-cream-200 bg-white/95 py-2.5 pr-4 pl-2.5 shadow-raised backdrop-blur">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
