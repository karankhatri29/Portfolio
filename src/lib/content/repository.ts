import { invalidateContent, cachedRead } from "@/lib/content/cache";
import { sqlClient } from "@/lib/db";

import { HIGHLIGHT_KINDS } from "@/lib/content/highlight-kinds";
import type { HighlightKind } from "@/lib/content/highlight-kinds";

export type ProjectImage = { url: string; alt: string };

export type Project = {
  slug: string;
  title: string;
  year: string;
  summary: string;
  role: string;
  outcomes: string[];
  stack?: string[];
  githubUrl?: string;
  problem?: string;
  approach?: string;
  result?: string;
  liveUrl?: string;
  videoUrl?: string;
  images?: ProjectImage[];
};

export { HIGHLIGHT_KINDS };
export type { HighlightKind };

/** testimonial: title = person, subtitle = role and company, body = quote. publication: title = paper, subtitle = venue and year, body = short abstract. */
export type Highlight = { id: string; kind: HighlightKind; title: string; subtitle: string; body: string; url?: string };

export type SkillRecord = {
  id: string;
  name: string;
  description: string;
  tools?: string[];
};

type ProjectRow = { slug: string; title: string; year: string; summary: string; role: string; outcomes: string[]; stack: string[] | null; github_url: string | null; problem: string | null; approach: string | null; result: string | null; live_url: string | null; video_url: string | null; images: ProjectImage[] | null };
type SkillRow = { id: string; name: string; description: string; tools: string[] | null };

function toProject(row: ProjectRow): Project {
  return { slug: row.slug, title: row.title, year: row.year, summary: row.summary, role: row.role, outcomes: row.outcomes, stack: row.stack ?? [], githubUrl: row.github_url ?? undefined, problem: row.problem ?? undefined, approach: row.approach ?? undefined, result: row.result ?? undefined, liveUrl: row.live_url ?? undefined, videoUrl: row.video_url ?? undefined, images: row.images ?? [] };
}

function toSkill(row: SkillRow): SkillRecord {
  return { id: row.id, name: row.name, description: row.description, tools: row.tools ?? [] };
}

const readProjects = cachedRead("projects", async (): Promise<Project[]> => {
  const sql = sqlClient();
  const rows = (await sql`SELECT slug, title, year, summary, role, outcomes, stack, github_url, problem, approach, result, live_url, video_url, images FROM projects ORDER BY year DESC, title ASC`) as ProjectRow[];
  return rows.map(toProject);
});

export const listProjects = (): Promise<Project[]> => readProjects();

export async function getProject(slug: string): Promise<Project | undefined> {
  const sql = sqlClient();
  const rows = (await sql`SELECT slug, title, year, summary, role, outcomes, stack, github_url, problem, approach, result, live_url, video_url, images FROM projects WHERE slug = ${slug}`) as ProjectRow[];
  return rows[0] ? toProject(rows[0]) : undefined;
}

export async function createProject(input: Project): Promise<Project> {
  const sql = sqlClient();
  const rows = (await sql`
    INSERT INTO projects (slug, title, year, summary, role, outcomes, stack, github_url, problem, approach, result, live_url, video_url, images)
    VALUES (${input.slug}, ${input.title}, ${input.year}, ${input.summary}, ${input.role}, ${JSON.stringify(input.outcomes)}::jsonb, ${JSON.stringify(input.stack ?? [])}::jsonb, ${input.githubUrl || null}, ${input.problem || null}, ${input.approach || null}, ${input.result || null}, ${input.liveUrl || null}, ${input.videoUrl || null}, ${JSON.stringify(input.images ?? [])}::jsonb)
    RETURNING slug, title, year, summary, role, outcomes, stack, github_url, problem, approach, result, live_url, video_url, images
  `) as ProjectRow[];
  invalidateContent("projects");
  return toProject(rows[0]);
}

export async function updateProject(slug: string, patch: Partial<Omit<Project, "slug">>): Promise<Project | undefined> {
  const existing = await getProject(slug);
  if (!existing) return undefined;

  const next: Project = { ...existing, ...patch, slug };
  const sql = sqlClient();
  const rows = (await sql`
    UPDATE projects
    SET title = ${next.title}, year = ${next.year}, summary = ${next.summary}, role = ${next.role}, outcomes = ${JSON.stringify(next.outcomes)}::jsonb, stack = ${JSON.stringify(next.stack ?? [])}::jsonb, github_url = ${next.githubUrl || null}, problem = ${next.problem || null}, approach = ${next.approach || null}, result = ${next.result || null}, live_url = ${next.liveUrl || null}, video_url = ${next.videoUrl || null}, images = ${JSON.stringify(next.images ?? [])}::jsonb
    WHERE slug = ${slug}
    RETURNING slug, title, year, summary, role, outcomes, stack, github_url, problem, approach, result, live_url, video_url, images
  `) as ProjectRow[];
  invalidateContent("projects");
  return rows[0] ? toProject(rows[0]) : undefined;
}

export async function deleteProject(slug: string): Promise<boolean> {
  const sql = sqlClient();
  const rows = (await sql`DELETE FROM projects WHERE slug = ${slug} RETURNING slug`) as { slug: string }[];
  invalidateContent("projects");
  return rows.length > 0;
}

const readSkills = cachedRead("skills", async (): Promise<SkillRecord[]> => {
  const sql = sqlClient();
  const rows = (await sql`SELECT id, name, description, tools FROM competencies ORDER BY name ASC`) as SkillRow[];
  return rows.map(toSkill);
});

export const listSkills = (): Promise<SkillRecord[]> => readSkills();

export async function createSkill(input: Omit<SkillRecord, "id">): Promise<SkillRecord> {
  const sql = sqlClient();
  const id = crypto.randomUUID();
  const rows = (await sql`
    INSERT INTO competencies (id, name, description, tools)
    VALUES (${id}, ${input.name}, ${input.description}, ${JSON.stringify(input.tools ?? [])}::jsonb)
    RETURNING id, name, description, tools
  `) as SkillRow[];
  invalidateContent("skills");
  return toSkill(rows[0]);
}

export async function updateSkill(id: string, patch: Partial<Omit<SkillRecord, "id">>): Promise<SkillRecord | undefined> {
  const sql = sqlClient();
  const existingRows = (await sql`SELECT id, name, description, tools FROM competencies WHERE id = ${id}`) as SkillRow[];
  const existing = existingRows[0];
  if (!existing) return undefined;

  const next = { ...existing, ...patch };
  const rows = (await sql`
    UPDATE competencies
    SET name = ${next.name}, description = ${next.description}, tools = ${JSON.stringify(next.tools ?? [])}::jsonb
    WHERE id = ${id}
    RETURNING id, name, description, tools
  `) as SkillRow[];
  invalidateContent("skills");
  return rows[0] ? toSkill(rows[0]) : undefined;
}

export async function deleteSkill(id: string): Promise<boolean> {
  const sql = sqlClient();
  const rows = (await sql`DELETE FROM competencies WHERE id = ${id} RETURNING id`) as { id: string }[];
  invalidateContent("skills");
  return rows.length > 0;
}

type HighlightRow = { id: string; kind: HighlightKind; title: string; subtitle: string; body: string; url: string | null };

function toHighlight(row: HighlightRow): Highlight {
  return { id: row.id, kind: row.kind, title: row.title, subtitle: row.subtitle, body: row.body, url: row.url ?? undefined };
}

const readHighlights = cachedRead("highlights", async (kind?: HighlightKind): Promise<Highlight[]> => {
  const sql = sqlClient();
  const rows = (kind
    ? await sql`SELECT id, kind, title, subtitle, body, url FROM highlights WHERE kind = ${kind} ORDER BY created_at DESC`
    : await sql`SELECT id, kind, title, subtitle, body, url FROM highlights ORDER BY kind ASC, created_at DESC`) as HighlightRow[];
  return rows.map(toHighlight);
});

export const listHighlights = (kind?: HighlightKind): Promise<Highlight[]> => readHighlights(kind);

export async function createHighlight(input: Omit<Highlight, "id">): Promise<Highlight> {
  const sql = sqlClient();
  const rows = (await sql`
    INSERT INTO highlights (id, kind, title, subtitle, body, url)
    VALUES (${crypto.randomUUID()}, ${input.kind}, ${input.title}, ${input.subtitle}, ${input.body}, ${input.url || null})
    RETURNING id, kind, title, subtitle, body, url
  `) as HighlightRow[];
  invalidateContent("highlights");
  return toHighlight(rows[0]);
}

export async function updateHighlight(id: string, patch: Partial<Omit<Highlight, "id">>): Promise<Highlight | undefined> {
  const sql = sqlClient();
  const existing = (await sql`SELECT id, kind, title, subtitle, body, url FROM highlights WHERE id = ${id}`) as HighlightRow[];
  if (!existing[0]) return undefined;

  const next = { ...toHighlight(existing[0]), ...patch };
  const rows = (await sql`
    UPDATE highlights SET kind = ${next.kind}, title = ${next.title}, subtitle = ${next.subtitle}, body = ${next.body}, url = ${next.url || null}
    WHERE id = ${id}
    RETURNING id, kind, title, subtitle, body, url
  `) as HighlightRow[];
  invalidateContent("highlights");
  return rows[0] ? toHighlight(rows[0]) : undefined;
}

export async function deleteHighlight(id: string): Promise<boolean> {
  const sql = sqlClient();
  const rows = (await sql`DELETE FROM highlights WHERE id = ${id} RETURNING id`) as { id: string }[];
  invalidateContent("highlights");
  return rows.length > 0;
}
