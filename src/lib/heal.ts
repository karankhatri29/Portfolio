import { recordHealEvent } from "@/lib/analytics/repository";

export type HealAction = "retried" | "served-last-good" | "fallback-model" | "fallback-answer" | "email-resent";

/**
 * Notes that the site recovered from a failure without anyone noticing, so the weekly digest can say how often it
 * happened. Best effort: when the database itself is the thing that failed there is nowhere to store it.
 */
export async function recordHeal(dependency: string, action: HealAction): Promise<void> {
  console.info("self-heal", dependency, action);
  if (!process.env.DATABASE_URL) return;

  try {
    await recordHealEvent(dependency, action);
  } catch {
    // Monitoring must never cause or mask a request error.
  }
}
