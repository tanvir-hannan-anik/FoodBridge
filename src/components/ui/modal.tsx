"use client";

import { useId, useRef, type ReactNode } from "react";
import { buttonStyles, type ButtonVariant } from "./button";

/**
 * Accessible modal built on the native <dialog> element (focus trap, Esc and backdrop
 * handled by the browser). Children can be server-rendered, e.g. a form with a server action.
 */
export function Modal({
  triggerLabel,
  triggerVariant = "outline",
  title,
  description,
  children,
}: {
  triggerLabel: string;
  triggerVariant?: ButtonVariant;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  return (
    <>
      <button type="button" className={buttonStyles({ variant: triggerVariant })} onClick={() => ref.current?.showModal()}>
        {triggerLabel}
      </button>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onClick={(e) => e.target === ref.current && ref.current?.close()}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-card bg-white p-0 shadow-raised backdrop:bg-ink-900/40"
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-ink-900">
                {title}
              </h2>
              {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => ref.current?.close()}
              className="-m-1 rounded-full p-1 text-ink-500 hover:bg-ink-100"
            >
              <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className="size-5">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>
          <div className="mt-4">{children}</div>
        </div>
      </dialog>
    </>
  );
}
