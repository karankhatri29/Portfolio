export const DEFAULT_HOURLY_LIMIT = 10;
export const DEFAULT_DAILY_LIMIT = 300;

/** Reads a positive whole number from an environment value, falling back when it is missing or invalid. */
export function readLimit(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export type LimitHit = "hourly" | "daily" | null;

export function limitHit(counts: { hourly: number; daily: number }, max: { hourly: number; daily: number }): LimitHit {
  if (counts.daily >= max.daily) return "daily";
  if (counts.hourly >= max.hourly) return "hourly";
  return null;
}

export const LIMIT_MESSAGES: Record<Exclude<LimitHit, null>, string> = {
  hourly: "That's a lot of questions! Please try again in a little while, or email Karan directly.",
  daily: "The assistant has reached its limit for today. Please email Karan directly.",
};
