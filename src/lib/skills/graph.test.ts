import type { Project, SkillRecord } from "@/lib/content/repository";
import { buildSkillGraph, competencyId, highlightSet, projectId, toolId } from "@/lib/skills/graph";

const skills: SkillRecord[] = [
  { id: "s1", name: "AI and NLP", description: "NLP.", tools: ["spaCy", "NLTK"] },
  { id: "s2", name: "Databases", description: "SQL.", tools: ["SQLite", "PostgreSQL", "MongoDB"] },
  { id: "s3", name: "Cloud", description: "Delivery.", tools: ["Docker"] },
];

const projects: Project[] = [
  { slug: "triage", title: "Email Triage", year: "2026", summary: "s", role: "Dev", outcomes: ["o"], stack: ["spacy", "SQLite"] },
  { slug: "compress", title: "Compression", year: "2025", summary: "s", role: "Dev", outcomes: ["o"], stack: ["PostgreSQL", "Bash"] },
];

describe("buildSkillGraph", () => {
  const graph = buildSkillGraph(skills, projects);
  const ids = graph.nodes.map((node) => node.id);

  it("shows every listed tool but only marks project-used ones as proven, matching names case-insensitively", () => {
    const byId = new Map(graph.nodes.map((node) => [node.id, node]));
    for (const tool of ["spaCy", "SQLite", "PostgreSQL"]) expect(byId.get(toolId(tool))?.proven).toBe(true);
    for (const tool of ["NLTK", "MongoDB", "Docker"]) expect(byId.get(toolId(tool))?.proven).toBe(false);
    expect(ids).not.toContain(toolId("Bash"));
    expect(byId.get(competencyId("s3"))?.proven).toBe(false);
    expect(byId.get(competencyId("s1"))?.proven).toBe(true);
  });

  it("only links proven tools onward to projects", () => {
    const projectEdges = graph.edges.filter((edge) => edge.target.startsWith("project:"));
    expect(projectEdges.map((edge) => edge.source).sort()).toEqual([toolId("PostgreSQL"), toolId("SQLite"), toolId("spaCy")].sort());
  });

  it("keeps every competency and project, even those with no evidence", () => {
    expect(ids).toEqual(expect.arrayContaining([competencyId("s1"), competencyId("s2"), competencyId("s3"), projectId("triage"), projectId("compress")]));
  });

  it("links competency to tool to project without duplicates", () => {
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        { source: competencyId("s1"), target: toolId("spaCy") },
        { source: toolId("spaCy"), target: projectId("triage") },
        { source: competencyId("s2"), target: toolId("SQLite") },
        { source: toolId("PostgreSQL"), target: projectId("compress") },
      ]),
    );
    const keys = graph.edges.map((edge) => `${edge.source}|${edge.target}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("produces an identical layout on every run", () => {
    expect(buildSkillGraph(skills, projects)).toEqual(graph);
  });

  it("keeps every node inside the canvas with finite coordinates", () => {
    for (const node of graph.nodes) {
      expect(Number.isFinite(node.x) && Number.isFinite(node.y)).toBe(true);
      expect(node.x - node.width / 2).toBeGreaterThanOrEqual(0);
      expect(node.x + node.width / 2).toBeLessThanOrEqual(graph.width);
      expect(node.y - node.height / 2).toBeGreaterThanOrEqual(0);
      expect(node.y + node.height / 2).toBeLessThanOrEqual(graph.height);
    }
  });

  it("does not let labels overlap", () => {
    for (let i = 0; i < graph.nodes.length; i += 1) {
      for (let j = i + 1; j < graph.nodes.length; j += 1) {
        const a = graph.nodes[i];
        const b = graph.nodes[j];
        const overlaps = Math.abs(a.x - b.x) < (a.width + b.width) / 2 && Math.abs(a.y - b.y) < (a.height + b.height) / 2;
        expect(overlaps).toBe(false);
      }
    }
  });

  it("handles content with no tools or stacks", () => {
    const empty = buildSkillGraph([{ id: "x", name: "Solo", description: "d" }], [{ ...projects[0], stack: undefined }]);
    expect(empty.edges).toEqual([]);
    expect(empty.nodes).toHaveLength(2);
  });
});

describe("buildSkillGraph with the full portfolio dataset", () => {
  const fullSkills: SkillRecord[] = [
    { id: "1", name: "Python and data", description: "d", tools: ["Python", "Pandas", "NumPy", "Scikit-Learn", "Matplotlib", "SQL"] },
    { id: "2", name: "Web development", description: "d", tools: ["React", "Node.js", "Express", "Vite", "JavaScript", "HTML5", "CSS3"] },
    { id: "3", name: "AI and NLP", description: "d", tools: ["spaCy", "NLTK", "LangChain"] },
    { id: "4", name: "Knowledge graphs", description: "d", tools: ["NetworkX"] },
    { id: "5", name: "Cloud and delivery", description: "d", tools: ["Git", "Docker", "Azure", "Google APIs", "Vercel", "CI/CD", "Bash", "PowerShell"] },
    { id: "6", name: "Databases", description: "d", tools: ["PostgreSQL", "MySQL", "MongoDB", "SQLite", "Tableau"] },
  ];
  const fullProjects: Project[] = [
    { slug: "a", title: "Edge-Native Email Triage Framework", year: "", summary: "", role: "", outcomes: [], stack: ["Python", "spaCy", "NetworkX", "LangChain", "SQLite", "Google APIs"] },
    { slug: "b", title: "Context-Aware Recommendation Engine", year: "", summary: "", role: "", outcomes: [], stack: ["Node.js", "Google APIs"] },
    { slug: "c", title: "Blockchain Based Marketplace", year: "", summary: "", role: "", outcomes: [], stack: ["React"] },
    { slug: "d", title: "Smart Data Compression Algorithm", year: "", summary: "", role: "", outcomes: [], stack: ["Bash", "PostgreSQL"] },
  ];
  const graph = buildSkillGraph(fullSkills, fullProjects);

  it("lays out all 6 competencies, 30 tools and 4 projects inside the canvas without overlap", () => {
    expect(graph.nodes).toHaveLength(6 + 30 + 4);
    for (const node of graph.nodes) {
      expect(node.x - node.width / 2).toBeGreaterThanOrEqual(0);
      expect(node.x + node.width / 2).toBeLessThanOrEqual(graph.width);
      expect(node.y - node.height / 2).toBeGreaterThanOrEqual(0);
      expect(node.y + node.height / 2).toBeLessThanOrEqual(graph.height);
    }
    for (let i = 0; i < graph.nodes.length; i += 1) {
      for (let j = i + 1; j < graph.nodes.length; j += 1) {
        const a = graph.nodes[i];
        const b = graph.nodes[j];
        expect(Math.abs(a.x - b.x) < (a.width + b.width) / 2 && Math.abs(a.y - b.y) < (a.height + b.height) / 2).toBe(false);
      }
    }
  });

  it("keeps each tool closer to its own competency than to the average competency", () => {
    const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
    const dist = (a: string, b: string) => Math.hypot(nodes.get(a)!.x - nodes.get(b)!.x, nodes.get(a)!.y - nodes.get(b)!.y);
    const hubs = graph.nodes.filter((node) => node.kind === "competency").map((node) => node.id);
    for (const edge of graph.edges.filter((e) => e.target.startsWith("tool:"))) {
      const own = dist(edge.source, edge.target);
      const others = hubs.filter((hub) => hub !== edge.source).map((hub) => dist(hub, edge.target));
      expect(own).toBeLessThan(others.reduce((sum, d) => sum + d, 0) / others.length);
    }
  });
});

describe("highlightSet", () => {
  const graph = buildSkillGraph(skills, projects);

  it("shows all of a competency's tools and the projects that used them, but not other competencies", () => {
    const set = highlightSet(graph, competencyId("s1"));
    expect(set).toEqual(new Set([competencyId("s1"), toolId("spaCy"), toolId("NLTK"), projectId("triage")]));
  });

  it("shows the competencies and projects around a tool", () => {
    const set = highlightSet(graph, toolId("SQLite"));
    expect(set).toEqual(new Set([toolId("SQLite"), competencyId("s2"), projectId("triage")]));
  });
});
