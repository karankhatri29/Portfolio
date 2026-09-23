import { neon } from "@neondatabase/serverless";

export type Project = {
  slug: string;
  title: string;
  year: string;
  summary: string;
  role: string;
  outcomes: string[];
};

export type SkillRecord = {
  id: string;
  name: string;
  description: string;
};

type ProjectRow = { slug: string; title: string; year: string; summary: string; role: string; outcomes: string[] };
type SkillRow = { id: string; name: string; description: string };

function sqlClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }
  return neon(connectionString);
}

function toProject(row: ProjectRow): Project {
  return { slug: row.slug, title: row.title, year: row.year, summary: row.summary, role: row.role, outcomes: row.outcomes };
}

function toSkill(row: SkillRow): SkillRecord {
  return { id: row.id, name: row.name, description: row.description };
}

export async function listProjects(): Promise<Project[]> {
  const sql = sqlClient();
  const rows = (await sql`SELECT slug, title, year, summary, role, outcomes FROM projects ORDER BY year DESC, title ASC`) as ProjectRow[];
  return rows.map(toProject);
}

export async function getProject(slug: string): Promise<Project | undefined> {
  const sql = sqlClient();
  const rows = (await sql`SELECT slug, title, year, summary, role, outcomes FROM projects WHERE slug = ${slug}`) as ProjectRow[];
  return rows[0] ? toProject(rows[0]) : undefined;
}

export async function createProject(input: Project): Promise<Project> {
  const sql = sqlClient();
  const rows = (await sql`
    INSERT INTO projects (slug, title, year, summary, role, outcomes)
    VALUES (${input.slug}, ${input.title}, ${input.year}, ${input.summary}, ${input.role}, ${JSON.stringify(input.outcomes)}::jsonb)
    RETURNING slug, title, year, summary, role, outcomes
  `) as ProjectRow[];
  return toProject(rows[0]);
}

export async function updateProject(slug: string, patch: Partial<Omit<Project, "slug">>): Promise<Project | undefined> {
  const existing = await getProject(slug);
  if (!existing) return undefined;

  const next: Project = { ...existing, ...patch, slug };
  const sql = sqlClient();
  const rows = (await sql`
    UPDATE projects
    SET title = ${next.title}, year = ${next.year}, summary = ${next.summary}, role = ${next.role}, outcomes = ${JSON.stringify(next.outcomes)}::jsonb
    WHERE slug = ${slug}
    RETURNING slug, title, year, summary, role, outcomes
  `) as ProjectRow[];
  return rows[0] ? toProject(rows[0]) : undefined;
}

export async function deleteProject(slug: string): Promise<boolean> {
  const sql = sqlClient();
  const rows = (await sql`DELETE FROM projects WHERE slug = ${slug} RETURNING slug`) as { slug: string }[];
  return rows.length > 0;
}

export async function listSkills(): Promise<SkillRecord[]> {
  const sql = sqlClient();
  const rows = (await sql`SELECT id, name, description FROM competencies ORDER BY name ASC`) as SkillRow[];
  return rows.map(toSkill);
}

export async function createSkill(input: Omit<SkillRecord, "id">): Promise<SkillRecord> {
  const sql = sqlClient();
  const id = crypto.randomUUID();
  const rows = (await sql`
    INSERT INTO competencies (id, name, description)
    VALUES (${id}, ${input.name}, ${input.description})
    RETURNING id, name, description
  `) as SkillRow[];
  return toSkill(rows[0]);
}

export async function updateSkill(id: string, patch: Partial<Omit<SkillRecord, "id">>): Promise<SkillRecord | undefined> {
  const sql = sqlClient();
  const existingRows = (await sql`SELECT id, name, description FROM competencies WHERE id = ${id}`) as SkillRow[];
  const existing = existingRows[0];
  if (!existing) return undefined;

  const next = { ...existing, ...patch };
  const rows = (await sql`
    UPDATE competencies
    SET name = ${next.name}, description = ${next.description}
    WHERE id = ${id}
    RETURNING id, name, description
  `) as SkillRow[];
  return rows[0] ? toSkill(rows[0]) : undefined;
}

export async function deleteSkill(id: string): Promise<boolean> {
  const sql = sqlClient();
  const rows = (await sql`DELETE FROM competencies WHERE id = ${id} RETURNING id`) as { id: string }[];
  return rows.length > 0;
}
