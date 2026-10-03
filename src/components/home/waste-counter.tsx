"use client";

import { useEffect, useState } from "react";
import { formatCount, type Lang } from "@/lib/i18n";

/**
 * Kilograms of household food wasted in Bangladesh since the page opened, at the UNEP annual rate.
 * Only the number changes (no movement), so it also runs under prefers-reduced-motion.
 */
export function WasteCounter({ lang, kgPerSecond }: { lang: Lang; kgPerSecond: number }) {
  const [kg, setKg] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const id = window.setInterval(() => setKg(((performance.now() - start) / 1000) * kgPerSecond), 200);
    return () => window.clearInterval(id);
  }, [kgPerSecond]);

  return <span className="tabular-nums">{formatCount(Math.floor(kg), lang)}</span>;
}
