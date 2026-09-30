"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ComponentProps } from "react";

/** A native <details> menu that closes itself on navigation and on outside click. */
export function MenuDetails(props: ComponentProps<"details">) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    ref.current?.removeAttribute("open");
  }, [pathname]);

  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) ref.current.removeAttribute("open");
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  // Hash links (/#impact) don't change the pathname, so also close when any link inside is clicked.
  return (
    <details
      ref={ref}
      onClick={(e) => (e.target as HTMLElement).closest("a") && ref.current?.removeAttribute("open")}
      {...props}
    />
  );
}
