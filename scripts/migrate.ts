import { neon } from "@neondatabase/serverless";

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

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
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
  await sql`ALTER TABLE competencies ADD COLUMN IF NOT EXISTS tools JSONB NOT NULL DEFAULT '[]'::jsonb`;

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
