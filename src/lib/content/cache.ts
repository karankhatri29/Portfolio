import { revalidateTag, unstable_cache } from "next/cache";

import { recordHeal } from "@/lib/heal";
import { retryRead } from "@/lib/db";

export type ContentTag = "projects" | "skills" | "highlights" | "posts";

// Edits made through the admin routes invalidate immediately; this only bounds staleness for changes made outside the app.
const TTL_SECONDS = 300;

// The last result each read returned successfully, kept per server instance. If Neon is unreachable the site keeps
// showing this instead of empty sections. It is dropped whenever that content is edited, so deleted items never return.
const lastGood = new Map<string, unknown>();

/**
 * Caches a public list read so page views do not each hit the database. A failing read is retried, and if it still
 * fails the last good result is served rather than an error.
 */
export function cachedRead<Args extends unknown[], Result>(tag: ContentTag, read: (...args: Args) => Promise<Result>): (...args: Args) => Promise<Result> {
  const cached = unstable_cache(
    (...args: Args) => retryRead(() => read(...args), { onRecovered: () => void recordHeal("database", "retried") }),
    [`content-${tag}`],
    { tags: [tag], revalidate: TTL_SECONDS },
  );

  return async (...args: Args) => {
    const key = `${tag}:${JSON.stringify(args)}`;
    try {
      const value = await cached(...args);
      lastGood.set(key, value);
      return value;
    } catch (error) {
      if (!lastGood.has(key)) throw error;

      void recordHeal("database", "served-last-good");
      return lastGood.get(key) as Result;
    }
  };
}

/** Call after any create, update or delete so the next read (including the admin's own) sees the change. */
export function invalidateContent(tag: ContentTag): void {
  revalidateTag(tag, { expire: 0 });
  for (const key of [...lastGood.keys()]) if (key.startsWith(`${tag}:`)) lastGood.delete(key);
}
