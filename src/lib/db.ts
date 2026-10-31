import { neon } from "@neondatabase/serverless";

export function sqlClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  return neon(connectionString);
}

const RETRY_DELAY_MS = 250;

function isNetworkFailure(error: unknown): boolean {
  return error instanceof Error && /fetch failed/i.test(error.message);
}

/**
 * Runs a read once more when Neon could not be reached (a suspended database waking up, a network blip).
 * Only for reads: a write that failed after reaching the database could be applied twice.
 */
export async function retryRead<T>(read: () => Promise<T>): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (!isNetworkFailure(error)) throw error;
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return read();
  }
}
