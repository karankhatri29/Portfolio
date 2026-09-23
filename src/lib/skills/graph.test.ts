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

  it("only creates tool nodes that a project actually used, matching names case-insensitively", () => {
    expect(ids).toContain(toolId("spaCy"));
    expect(ids).toContain(toolId("SQLite"));
    expect(ids).toContain(toolId("PostgreSQL"));
    expect(ids).not.toContain(toolId("NLTK"));
    expect(ids).not.toContain(toolId("MongoDB"));
    expect(ids).not.toContain(toolId("Docker"));
    expect(ids).not.toContain(toolId("Bash"));
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

describe("highlightSet", () => {
  const graph = buildSkillGraph(skills, projects);

  it("shows the tools and projects behind a competency, but not other competencies", () => {
    const set = highlightSet(graph, competencyId("s1"));
    expect(set).toEqual(new Set([competencyId("s1"), toolId("spaCy"), projectId("triage")]));
  });

  it("shows the competencies and projects around a tool", () => {
    const set = highlightSet(graph, toolId("SQLite"));
    expect(set).toEqual(new Set([toolId("SQLite"), competencyId("s2"), projectId("triage")]));
  });
});
