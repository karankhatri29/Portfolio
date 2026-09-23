export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export type ImageType = { mime: string; ext: string };

// Decides from the file's own bytes, never from the name or the browser's claim. SVG is excluded on purpose (it can carry scripts).
export function detectImageType(bytes: Uint8Array): ImageType | null {
  const startsWith = (signature: number[], offset = 0) => signature.every((value, index) => bytes[offset + index] === value);

  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: "image/png", ext: "png" };
  if (startsWith([0xff, 0xd8, 0xff])) return { mime: "image/jpeg", ext: "jpg" };
  if (startsWith([0x47, 0x49, 0x46, 0x38])) return { mime: "image/gif", ext: "gif" };
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) return { mime: "image/webp", ext: "webp" };
  return null;
}

export function safeUploadName(originalName: string, ext: string): string {
  const base = (originalName.split(/[\\/]/).pop() ?? "").replace(/\.[^.]*$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "image";
  return `uploads/${base}.${ext}`;
}
