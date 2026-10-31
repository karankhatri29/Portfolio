import { revalidateTag, unstable_cache } from "next/cache";

export type ContentTag = "projects" | "skills" | "highlights" | "posts";

// Edits made through the admin routes invalidate immediately; this only bounds staleness for changes made outside the app.
const TTL_SECONDS = 300;

/** Caches a public list read so page views do not each hit the database. */
export function cachedRead<Args extends unknown[], Result>(tag: ContentTag, read: (...args: Args) => Promise<Result>) {
  return unstable_cache(read, [`content-${tag}`], { tags: [tag], revalidate: TTL_SECONDS });
}

/** Call after any create, update or delete so the next read (including the admin's own) sees the change. */
export function invalidateContent(tag: ContentTag): void {
  revalidateTag(tag, { expire: 0 });
}
