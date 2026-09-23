const WORDS_PER_MINUTE = 220;

export type Heading = { id: string; text: string; level: 2 | 3 };

export function readingMinutes(markdown: string): number {
  const words = markdown.replace(/```[\s\S]*?```/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function plainHeadingText(raw: string): string {
  return raw
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .trim();
}

// Skips fenced code so a "# comment" inside a code block never becomes a heading.
export function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  let fence: string | null = null;

  for (const line of markdown.split(/\r?\n/)) {
    const marker = /^\s*(```|~~~)/.exec(line)?.[1];
    if (marker) {
      fence = fence === null ? marker : fence === marker ? null : fence;
      continue;
    }
    if (fence) continue;

    const match = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;

    const text = plainHeadingText(match[2]);
    const id = slugifyHeading(text);
    if (text && id) headings.push({ id, text, level: match[1].length as 2 | 3 });
  }

  return headings;
}

export function normalizeTag(raw: string): string {
  return raw.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
}

export function isValidPostDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function formatPostDate(value: string): string {
  if (!isValidPostDate(value)) return value;
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}
