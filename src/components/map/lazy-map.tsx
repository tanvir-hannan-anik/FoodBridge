"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";
import type { MapCanvasProps } from "./map-canvas";

// Leaflet (and its CSS) live in their own chunk, fetched only when a map is about to be seen.
const MapCanvas = dynamic(() => import("./map-canvas"), { ssr: false, loading: () => <MapPlaceholder label="Loading map…" /> });

function MapPlaceholder({ label }: { label: string }) {
  const { t } = useI18n();
  return (
    <div className="grid size-full place-items-center bg-cream-100 text-sm text-ink-500">
      <span className="flex items-center gap-2">
        <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5 text-ink-500">
          <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14" strokeLinejoin="round" />
        </svg>
        {t(label)}
      </span>
    </div>
  );
}

/** A map that loads Leaflet only once it's close to the viewport. */
export function LazyMap({ className, ...props }: MapCanvasProps) {
  const box = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = box.current;
    if (!node || visible) return;
    if (!("IntersectionObserver" in window)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- old browsers: just load it
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [visible]);

  return (
    <div ref={box} className={cn("relative isolate h-72 overflow-hidden rounded-2xl border border-cream-200 sm:h-80", className)}>
      {visible ? <MapCanvas {...props} className="size-full" /> : <MapPlaceholder label="Map" />}
    </div>
  );
}
