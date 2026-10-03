import { Fragment, type ReactNode } from "react";

/**
 * Puts React nodes into a translated sentence: rich(t("Wants {qty} by {time}."), { qty: <strong>…</strong> }).
 * Translate the whole sentence (word order differs between English and Bangla), then fill the slots.
 */
export function rich(text: string, nodes: Record<string, ReactNode>): ReactNode {
  return text.split(/(\{\w+\})/).map((part, i) => {
    const m = /^\{(\w+)\}$/.exec(part);
    return <Fragment key={i}>{m && m[1] in nodes ? nodes[m[1]] : part}</Fragment>;
  });
}
