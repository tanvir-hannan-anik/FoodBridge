"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type NewsCard = {
  image: StaticImageData;
  /** A published news card (shown as is) rather than a photo we write the headline over. */
  poster: boolean;
  position?: string;
  headline: string;
  highlight?: string;
  text: string;
  source: string;
};

/**
 * News stories scrolling sideways on their own. Hovering or focusing the strip pauses it; clicking a
 * story stops it and opens the story with its text. Closing the story (×, Esc, the backdrop, or
 * moving the pointer off it) starts the strip again.
 */
export function NewsMarquee({ items, labels }: { items: NewsCard[]; labels: { hint: string; close: string } }) {
  const [open, setOpen] = useState<number | null>(null);
  const [hover, setHover] = useState(false);
  const paused = hover || open !== null;

  const card = (n: NewsCard, i: number, copy: boolean) => (
    <li key={`${copy ? "b" : "a"}${i}`} className={cn("shrink-0", copy && "motion-reduce:hidden")} aria-hidden={copy || undefined}>
      <button
        type="button"
        tabIndex={copy ? -1 : 0}
        onClick={() => setOpen(i)}
        className="group relative block h-80 w-60 overflow-hidden rounded-2xl bg-night-800 text-left ring-1 ring-white/10 transition-transform duration-300 hover:-translate-y-1 hover:ring-accent-400/60 focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none sm:w-64"
      >
        <Image
          src={n.image}
          alt={n.poster ? n.headline : ""}
          placeholder="blur"
          fill
          sizes="256px"
          style={n.position ? { objectPosition: n.position } : undefined}
          className={cn("object-cover transition-transform duration-700 group-hover:scale-105", n.poster ? "object-top" : "brightness-[0.55] saturate-[0.85]")}
        />
        {!n.poster && <DrawnCard n={n} />}
        <span className="absolute right-2 bottom-2 grid size-8 place-items-center rounded-full bg-night-950/80 text-accent-300 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
          <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-4">
            <path d="M15 3h6v6M10 14 21 3M9 21H3v-6" />
          </svg>
        </span>
      </button>
    </li>
  );

  return (
    <div>
      <p className="mt-1 text-xs text-mist-400">{labels.hint}</p>
      <div
        className="relative mt-4 -mx-4 overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] motion-reduce:overflow-x-auto sm:-mx-6"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
      >
        <ul
          className="flex w-max animate-[marquee_70s_linear_infinite] gap-4 px-4 sm:px-6"
          style={{ animationPlayState: paused ? "paused" : "running" }}
        >
          {items.map((n, i) => card(n, i, false))}
          {items.map((n, i) => card(n, i, true))}
        </ul>
      </div>
      {open !== null && <StoryPopup n={items[open]} close={() => setOpen(null)} label={labels.close} />}
    </div>
  );
}

function Headline({ n }: { n: NewsCard }) {
  const at = n.highlight ? n.headline.indexOf(n.highlight) : -1;
  if (at < 0) return <>{n.headline}</>;
  return (
    <>
      {n.headline.slice(0, at)}
      <span className="text-accent-300">{n.highlight}</span>
      {n.headline.slice(at + n.highlight!.length)}
    </>
  );
}

/** Our own news card: the photo darkened, the headline and its source written over it. */
function DrawnCard({ n }: { n: NewsCard }) {
  return (
    <span className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-night-950 via-night-950/50 to-transparent p-4">
      <span className="mb-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-accent-400 px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-night-950 uppercase">
        {n.source.split(" · ")[0]}
      </span>
      <span className="font-display text-xl leading-snug font-semibold text-cream-50">
        <Headline n={n} />
      </span>
      <span className="mt-2 block h-0.5 w-10 bg-accent-400" />
      <span className="mt-2 text-[11px] text-mist-300">{n.source}</span>
    </span>
  );
}

function StoryPopup({ n, close, label }: { n: NewsCard; close: () => void; label: string }) {
  const entered = useRef(false);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButton.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-night-950/75 p-4 backdrop-blur-sm" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={n.headline}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => (entered.current = true)}
        // Moving the pointer off the story closes it (once it has been over it).
        onMouseLeave={() => entered.current && close()}
        className="relative grid max-h-[90dvh] w-full max-w-3xl animate-pop overflow-hidden rounded-3xl border border-white/10 bg-night-900 shadow-[0_40px_100px_-30px_rgb(0_0_0/0.9)] sm:grid-cols-[0.9fr_1.1fr]"
      >
        <div className="relative min-h-56 bg-night-950 sm:min-h-96">
          <Image
            src={n.image}
            alt={n.poster ? n.headline : ""}
            placeholder="blur"
            fill
            sizes="(min-width: 640px) 340px, 100vw"
            style={n.position ? { objectPosition: n.position } : undefined}
            className={n.poster ? "object-contain" : "object-cover brightness-[0.85]"}
          />
        </div>
        <div className="flex flex-col overflow-y-auto p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-widest text-accent-300 uppercase">{n.source}</p>
          <h3 className="mt-3 font-display text-2xl leading-snug font-semibold text-cream-50 sm:text-3xl">
            <Headline n={n} />
          </h3>
          <p className="mt-4 leading-relaxed text-mist-200">{n.text}</p>
          <button
            ref={closeButton}
            type="button"
            onClick={close}
            className="mt-8 inline-flex h-11 w-fit items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-cream-50 hover:bg-white/10"
          >
            {label}
          </button>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label={label}
          className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-night-950/80 text-mist-200 backdrop-blur hover:text-cream-50"
        >
          <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
