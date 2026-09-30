/** Minimal CSV writer (RFC 4180) for admin exports. */

type Cell = string | number | boolean | Date | null | undefined;

function cell(value: Cell) {
  if (value === null || value === undefined) return "";
  let text = value instanceof Date ? value.toISOString() : String(value);
  // Spreadsheet formula injection: a leading = + - @ (or tab/CR) would run as a formula in Excel.
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(columns: string[], rows: Cell[][]) {
  // BOM so Excel opens UTF-8 (Bangla text) correctly.
  return "﻿" + [columns, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}
