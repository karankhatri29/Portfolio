import { createHash } from "node:crypto";

export const CONTACT_TARGETS = ["email", "phone", "github", "linkedin", "booking"] as const;
export type ContactTarget = (typeof CONTACT_TARGETS)[number];

const botPattern = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pagespeed|gtmetrix|curl|wget|python-requests|httpx|node-fetch|axios|go-http-client|vercel/i;

export function isBot(userAgent: string | null | undefined): boolean {
  return !userAgent || botPattern.test(userAgent);
}

export function deviceType(userAgent: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet/i.test(userAgent)) return "tablet";
  if (/mobi|android|iphone/i.test(userAgent)) return "mobile";
  return "desktop";
}

export function browserName(userAgent: string): string {
  if (/edg(e|a|ios)?\//i.test(userAgent)) return "Edge";
  if (/opr\/|opera/i.test(userAgent)) return "Opera";
  if (/samsungbrowser/i.test(userAgent)) return "Samsung Internet";
  if (/firefox|fxios/i.test(userAgent)) return "Firefox";
  if (/chrome|crios|chromium/i.test(userAgent)) return "Chrome";
  if (/safari/i.test(userAgent)) return "Safari";
  return "Other";
}

export function clampInt(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  return rounded < min || rounded > max ? null : rounded;
}

export function normalizePath(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 200 || !raw.startsWith("/") || raw.startsWith("//")) return null;

  const path = raw.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (path === "/admin" || path.startsWith("/admin/") || path.startsWith("/api/")) return null;
  return path;
}

export function normalizeRefTag(raw: unknown): string {
  return typeof raw === "string" && /^[a-z0-9_-]{1,40}$/i.test(raw) ? raw.toLowerCase() : "";
}

export function referrerHost(referrer: unknown, siteHost: string): string {
  if (typeof referrer !== "string" || referrer.length === 0) return "";

  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
    return host === siteHost.toLowerCase().replace(/^www\./, "").split(":")[0] ? "" : host.slice(0, 100);
  } catch {
    return "";
  }
}

export function visitorHash(ip: string, userAgent: string, secret: string, now: Date = new Date()): string {
  const day = now.toISOString().slice(0, 10);
  return createHash("sha256").update(`${secret}|${day}|${ip}|${userAgent}`).digest("hex").slice(0, 32);
}

const knownSources: [RegExp, string][] = [
  [/(^|\.)linkedin\.com$|^lnkd\.in$/, "LinkedIn"],
  [/(^|\.)github\.com$/, "GitHub"],
  [/(^|\.)google\./, "Google"],
  [/(^|\.)bing\.com$|duckduckgo\.com$/, "Search engine"],
  [/(^|\.)(twitter\.com|x\.com|t\.co)$/, "X / Twitter"],
  [/(^|\.)(facebook\.com|instagram\.com)$/, "Facebook / Instagram"],
  [/(^|\.)(reddit\.com)$/, "Reddit"],
  [/(^|\.)(news\.ycombinator\.com)$/, "Hacker News"],
];

export function sourceLabel(source: string): string {
  if (source === "direct") return "Direct / unknown";
  for (const [pattern, label] of knownSources) {
    if (pattern.test(source)) return label;
  }
  return source.includes(".") ? source : `Campaign: ${source}`;
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export function groupSources(rows: { source: string; visits: number; visitors: number }[]): { label: string; visits: number; visitors: number }[] {
  const grouped = new Map<string, { label: string; visits: number; visitors: number }>();

  for (const row of rows) {
    const label = sourceLabel(row.source);
    const current = grouped.get(label) ?? { label, visits: 0, visitors: 0 };
    current.visits += row.visits;
    current.visitors += row.visitors;
    grouped.set(label, current);
  }

  return [...grouped.values()].sort((a, b) => b.visits - a.visits);
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}
