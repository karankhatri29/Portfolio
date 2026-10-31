import { neon } from "@neondatabase/serverless";

import { CircuitBreaker, retry } from "@/lib/resilience";
import type { RetryOptions } from "@/lib/resilience";

export function sqlClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  return neon(connectionString);
}

// Neon's free tier can take a second or two to wake from suspension, so wait a little longer on each retry.
// More failed attempts in a row than one request makes (3) opens the circuit, so a real outage fails fast.
export const neonBreaker = new CircuitBreaker("neon", { failureThreshold: 4, cooldownMs: 20_000 });

/**
 * Runs a read, retrying when Neon cannot be reached (a suspended database waking up, a network blip).
 * Only for reads: a write that failed after reaching the database could be applied twice.
 */
export function retryRead<T>(read: () => Promise<T>, options: Pick<RetryOptions, "onRecovered" | "sleep"> = {}): Promise<T> {
  return retry(() => neonBreaker.run(read), { delaysMs: [300, 1000], ...options });
}
