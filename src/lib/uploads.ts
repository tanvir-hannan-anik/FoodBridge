import "server-only";

import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/validation";

export type Photo = { data: Buffer; type: string };

/** The file's real type from its first bytes. The browser's `file.type` is only a claim. */
function sniffImageType(bytes: Uint8Array): string | null {
  const starts = (sig: number[], at = 0) => sig.every((b, i) => bytes[at + i] === b);
  if (starts([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  // "RIFF" …size… "WEBP"
  if (starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  return null;
}

/**
 * Reads an optional photo field. Empty → `{ photo: null }`. Otherwise checks the size and that the
 * content really is a JPG, PNG or WebP image (stored and served with the detected type).
 */
export async function readPhoto(value: FormDataEntryValue | undefined): Promise<{ photo: Photo | null } | { error: string }> {
  if (!(value instanceof File) || value.size === 0) return { photo: null };
  if (value.size > MAX_IMAGE_BYTES) return { error: "Photo must be 2 MB or smaller." };
  const data = Buffer.from(await value.arrayBuffer());
  const type = sniffImageType(data);
  if (!type || !IMAGE_TYPES.includes(type)) return { error: "Use a JPG, PNG or WebP photo." };
  return { photo: { data, type } };
}
