import fs from "node:fs";
import path from "node:path";

import { neon } from "@neondatabase/serverless";
import matter from "gray-matter";

// One-time snapshot of the hardcoded content this migration replaces. Source of truth
// moves to Postgres after this runs; src/data/portfolio.ts no longer carries these fields.
const seedProjects = [
  { slug: "edge-native-email-triage", title: "Edge-Native Email Triage Framework", year: "2026 - present", summary: "A knowledge-graph-backed pipeline that ingests Gmail data, extracts obligations, and maps task dependencies.", role: "Backend developer", outcomes: ["Live Gmail ingestion through OAuth 2.0", "spaCy obligation extraction", "NetworkX dependency analysis persisted to SQLite"], stack: ["Python", "spaCy", "NetworkX", "LangChain", "SQLite", "Google APIs"] },
  { slug: "context-aware-recommendation-engine", title: "Context-Aware Recommendation Engine", year: "2025 - 2026", summary: "A retrieval-style recommendation engine that extracts semantic intent and ranks locations against live contextual signals.", role: "Data analyst", outcomes: ["Modular Node.js retrieval API", "Google API aggregation", "Time-decay preference scoring"], stack: ["Node.js", "Google APIs"] },
  { slug: "blockchain-marketplace", title: "Blockchain Based Marketplace", year: "2025", summary: "A decentralized NFT marketplace built on Ethereum PoS with IPFS storage and wallet integration.", role: "Blockchain developer", outcomes: ["Solidity smart contracts", "IPFS asset storage", "Encrypted user data and automated watermarking"], stack: ["React"] },
  { slug: "smart-data-compression", title: "Smart Data Compression Algorithm", year: "2025", summary: "An adaptive compression system that selects algorithms based on file characteristics and verifies recovery integrity.", role: "Data analyst", outcomes: ["Up to 55% single-file size reduction", "Lossless recovery validation", "Bash-driven automation with PostgreSQL"], stack: ["Bash", "PostgreSQL"] },
];

const seedSkills = [
  { name: "Python and data", description: "Python, Pandas, NumPy, Scikit-Learn, Matplotlib, SQL, and statistical modeling.", tools: ["Python", "Pandas", "NumPy", "Scikit-Learn", "Matplotlib", "SQL"] },
  { name: "Web development", description: "React.js, Node.js/Express, Vite, JavaScript, HTML5, and CSS3.", tools: ["React", "Node.js", "Express", "Vite", "JavaScript", "HTML5", "CSS3"] },
  { name: "AI and NLP", description: "spaCy, NLTK, LangChain, semantic intent extraction, and retrieval-style ranking.", tools: ["spaCy", "NLTK", "LangChain"] },
  { name: "Knowledge graphs", description: "NetworkX graph construction and analysis for dependency-aware workflows.", tools: ["NetworkX"] },
  { name: "Cloud and delivery", description: "Git, Docker, Microsoft Azure, Google APIs, Vercel, CI/CD, Bash, and PowerShell.", tools: ["Git", "Docker", "Azure", "Google APIs", "Vercel", "CI/CD", "Bash", "PowerShell"] },
  { name: "Databases", description: "PostgreSQL, MySQL, MongoDB, SQLite, and Tableau.", tools: ["PostgreSQL", "MySQL", "MongoDB", "SQLite", "Tableau"] },
];

// YAML dates such as 2026-09-01 are parsed into Date objects by gray-matter.
function frontMatterDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return typeof value === "string" ? value.slice(0, 10) : "";
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // A hosted build without a database (for example a fork's preview) should still build.
    if (process.env.VERCEL) {
      console.log("DATABASE_URL is not set on this build, skipping migration.");
      return;
    }
    throw new Error("DATABASE_URL is not set. Run `vercel env pull .env.local` first.");
  }

  const sql = neon(connectionString);

  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      year TEXT NOT NULL,
      summary TEXT NOT NULL,
      role TEXT NOT NULL,
      outcomes JSONB NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS competencies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL
    )
  `;

  // Columns backing the skills graph: tools per competency, stack per project.
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS stack JSONB NOT NULL DEFAULT '[]'::jsonb`;
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_url TEXT`;
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS problem TEXT`;
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS approach TEXT`;
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS result TEXT`;
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS live_url TEXT`;
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS video_url TEXT`;
  await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb`;
  await sql`ALTER TABLE competencies ADD COLUMN IF NOT EXISTS tools JSONB NOT NULL DEFAULT '[]'::jsonb`;

  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id BIGSERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      type TEXT NOT NULL,
      path TEXT NOT NULL,
      referrer TEXT NOT NULL DEFAULT '',
      ref_tag TEXT NOT NULL DEFAULT '',
      is_entry BOOLEAN NOT NULL DEFAULT false,
      country TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      device TEXT NOT NULL DEFAULT '',
      visitor_hash TEXT NOT NULL DEFAULT '',
      target TEXT NOT NULL DEFAULT ''
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS events_type_created_idx ON events (type, created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS events_path_idx ON events (path, created_at)`;
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS browser TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS duration_s INT NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS scroll_pct INT NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS is_returning BOOLEAN NOT NULL DEFAULT false`;
  await sql`CREATE INDEX IF NOT EXISTS events_visitor_idx ON events (visitor_hash)`;

  await sql`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      sender_hash TEXT NOT NULL DEFAULT ''
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS contact_messages_created_idx ON contact_messages (created_at)`;

  await sql`
    CREATE TABLE IF NOT EXISTS error_logs (
      id BIGSERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      source TEXT NOT NULL,
      message TEXT NOT NULL,
      stack TEXT NOT NULL DEFAULT '',
      path TEXT NOT NULL DEFAULT '',
      digest TEXT NOT NULL DEFAULT ''
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS error_logs_created_idx ON error_logs (created_at)`;

  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS posts_status_date_idx ON posts (status, date)`;

  await sql`
    CREATE TABLE IF NOT EXISTS highlights (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      url TEXT
    )
  `;

  const [{ count: projectCount }] = (await sql`SELECT COUNT(*)::int AS count FROM projects`) as { count: number }[];
  if (projectCount === 0) {
    for (const project of seedProjects) {
      await sql`
        INSERT INTO projects (slug, title, year, summary, role, outcomes, stack)
        VALUES (${project.slug}, ${project.title}, ${project.year}, ${project.summary}, ${project.role}, ${JSON.stringify(project.outcomes)}::jsonb, ${JSON.stringify(project.stack)}::jsonb)
      `;
    }
    console.log(`Seeded ${seedProjects.length} projects.`);
  } else {
    console.log(`projects already has ${projectCount} rows, skipping seed.`);
  }

  const [{ count: skillCount }] = (await sql`SELECT COUNT(*)::int AS count FROM competencies`) as { count: number }[];
  if (skillCount === 0) {
    for (const skill of seedSkills) {
      await sql`
        INSERT INTO competencies (id, name, description, tools)
        VALUES (${crypto.randomUUID()}, ${skill.name}, ${skill.description}, ${JSON.stringify(skill.tools)}::jsonb)
      `;
    }
    console.log(`Seeded ${seedSkills.length} competencies.`);
  } else {
    console.log(`competencies already has ${skillCount} rows, skipping seed.`);
  }

  // One-time import of the original Markdown posts; after this the database is the source of truth.
  const [{ count: postCount }] = (await sql`SELECT COUNT(*)::int AS count FROM posts`) as { count: number }[];
  const blogDirectory = path.join(process.cwd(), "src", "content", "blog");
  if (postCount === 0 && fs.existsSync(blogDirectory)) {
    let imported = 0;
    for (const fileName of fs.readdirSync(blogDirectory).filter((name) => name.endsWith(".md"))) {
      const slug = fileName.replace(/\.md$/, "");
      const parsed = matter(fs.readFileSync(path.join(blogDirectory, fileName), "utf8"));
      const tags = Array.isArray(parsed.data.tags) ? parsed.data.tags.filter((tag: unknown): tag is string => typeof tag === "string") : [];
      await sql`
        INSERT INTO posts (slug, title, date, summary, content, tags, status)
        VALUES (${slug}, ${typeof parsed.data.title === "string" ? parsed.data.title : slug}, ${frontMatterDate(parsed.data.date)}, ${typeof parsed.data.summary === "string" ? parsed.data.summary : ""}, ${parsed.content.trim()}, ${JSON.stringify(tags)}::jsonb, 'published')
      `;
      imported++;
    }
    console.log(`Imported ${imported} blog posts.`);
  } else {
    console.log(`posts already has ${postCount} rows, skipping import.`);
  }

  // Backfill rows seeded before the columns existed; never overwrites values edited since.
  for (const project of seedProjects) {
    await sql`UPDATE projects SET stack = ${JSON.stringify(project.stack)}::jsonb WHERE slug = ${project.slug} AND stack = '[]'::jsonb`;
  }
  for (const skill of seedSkills) {
    await sql`UPDATE competencies SET tools = ${JSON.stringify(skill.tools)}::jsonb WHERE name = ${skill.name} AND tools = '[]'::jsonb`;
  }

  console.log("Migration complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
