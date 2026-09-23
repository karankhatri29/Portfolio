import { neon } from "@neondatabase/serverless";

import { readingMinutes } from "@/lib/content/blog-utils";

export type PostStatus = "draft" | "published";
export const POST_STATUSES: PostStatus[] = ["draft", "published"];

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  content: string;
  tags: string[];
  status: PostStatus;
};

export type BlogPostSummary = Omit<BlogPost, "content"> & { readingMinutes: number };

type PostRow = { slug: string; title: string; date: string; summary: string; content: string; tags: string[] | null; status: PostStatus };

const safeSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function sqlClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  return neon(connectionString);
}

function toPost(row: PostRow): BlogPost {
  return { slug: row.slug, title: row.title, date: row.date, summary: row.summary, content: row.content, tags: row.tags ?? [], status: row.status };
}

function toSummary(row: PostRow): BlogPostSummary {
  const { content, ...rest } = toPost(row);
  return { ...rest, readingMinutes: readingMinutes(content) };
}

/** Published posts, newest first. */
export async function listBlogPosts(): Promise<BlogPostSummary[]> {
  const sql = sqlClient();
  const rows = (await sql`SELECT slug, title, date, summary, content, tags, status FROM posts WHERE status = 'published' ORDER BY date DESC, created_at DESC`) as PostRow[];
  return rows.map(toSummary);
}

/** A published post; drafts are only returned when includeDrafts is set (admin preview). */
export async function getBlogPost(slug: string, options: { includeDrafts?: boolean } = {}): Promise<BlogPost | undefined> {
  if (!safeSlug.test(slug)) return undefined;

  const sql = sqlClient();
  const rows = (await sql`SELECT slug, title, date, summary, content, tags, status FROM posts WHERE slug = ${slug}`) as PostRow[];
  const post = rows[0] ? toPost(rows[0]) : undefined;
  if (!post || (post.status !== "published" && !options.includeDrafts)) return undefined;
  return post;
}

export async function listPostsForAdmin(): Promise<BlogPost[]> {
  const sql = sqlClient();
  const rows = (await sql`SELECT slug, title, date, summary, content, tags, status FROM posts ORDER BY date DESC, created_at DESC`) as PostRow[];
  return rows.map(toPost);
}

export async function postExists(slug: string): Promise<boolean> {
  const sql = sqlClient();
  const rows = (await sql`SELECT 1 AS found FROM posts WHERE slug = ${slug}`) as unknown[];
  return rows.length > 0;
}

export async function createPost(input: BlogPost): Promise<BlogPost> {
  const sql = sqlClient();
  const rows = (await sql`
    INSERT INTO posts (slug, title, date, summary, content, tags, status)
    VALUES (${input.slug}, ${input.title}, ${input.date}, ${input.summary}, ${input.content}, ${JSON.stringify(input.tags)}::jsonb, ${input.status})
    RETURNING slug, title, date, summary, content, tags, status
  `) as PostRow[];
  return toPost(rows[0]);
}

export async function updatePost(slug: string, input: Omit<BlogPost, "slug">): Promise<BlogPost | undefined> {
  const sql = sqlClient();
  const rows = (await sql`
    UPDATE posts
    SET title = ${input.title}, date = ${input.date}, summary = ${input.summary}, content = ${input.content}, tags = ${JSON.stringify(input.tags)}::jsonb, status = ${input.status}, updated_at = now()
    WHERE slug = ${slug}
    RETURNING slug, title, date, summary, content, tags, status
  `) as PostRow[];
  return rows[0] ? toPost(rows[0]) : undefined;
}

export async function deletePost(slug: string): Promise<boolean> {
  const sql = sqlClient();
  const rows = (await sql`DELETE FROM posts WHERE slug = ${slug} RETURNING slug`) as { slug: string }[];
  return rows.length > 0;
}
