import type { Project, SkillRecord } from "@/lib/content/repository";

export type NodeKind = "competency" | "tool" | "project";

export type GraphNode = {
  id: string;
  kind: NodeKind;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type GraphEdge = { source: string; target: string };

export type SkillGraph = { width: number; height: number; nodes: GraphNode[]; edges: GraphEdge[] };

export const GRAPH_WIDTH = 800;
export const GRAPH_HEIGHT = 580;
const MARGIN = 10;
const MAX_PROJECT_LABEL = 26;

export const toolKey = (name: string) => name.trim().toLowerCase();
export const toolId = (name: string) => `tool:${toolKey(name)}`;
export const competencyId = (id: string) => `competency:${id}`;
export const projectId = (slug: string) => `project:${slug}`;

function truncate(label: string, max: number) {
  return label.length > max ? `${label.slice(0, max - 1).trimEnd()}…` : label;
}

// Rough label metrics per kind (viewBox units); enough to reserve room for each pill.
function sizeFor(kind: NodeKind, label: string) {
  if (kind === "competency") return { width: label.length * 9.4 + 34, height: 38 };
  if (kind === "project") return { width: label.length * 7.8 + 30, height: 34 };
  return { width: label.length * 7.2 + 22, height: 28 };
}

// Stable pseudo-random in [0, 1) derived from a string, so layouts never depend on Math.random.
function hash01(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

type Draft = Omit<GraphNode, "x" | "y">;

function layout(drafts: Draft[], edges: GraphEdge[], width: number, height: number): GraphNode[] {
  const cx = width / 2;
  const cy = height / 2;
  const byKind = (kind: NodeKind) => drafts.filter((node) => node.kind === kind);
  const ringRadius: Record<NodeKind, [number, number]> = { tool: [0.18 * width, 0.16 * height], competency: [0.42 * width, 0.4 * height], project: [0.3 * width, 0.28 * height] };
  const phase: Record<NodeKind, number> = { tool: 0.3, competency: 0, project: Math.PI / 5 };

  const pos = new Map<string, { x: number; y: number; vx: number; vy: number }>();
  (["competency", "tool", "project"] as NodeKind[]).forEach((kind) => {
    const group = byKind(kind);
    group.forEach((node, index) => {
      const angle = phase[kind] + (index / group.length) * Math.PI * 2 + (hash01(node.id) - 0.5) * 0.3;
      const [rx, ry] = ringRadius[kind];
      pos.set(node.id, { x: cx + Math.cos(angle) * rx, y: cy + Math.sin(angle) * ry, vx: 0, vy: 0 });
    });
  });

  const iterations = 420;
  for (let step = 0; step < iterations; step += 1) {
    const alpha = 1 - (step / iterations) * 0.95;

    for (let i = 0; i < drafts.length; i += 1) {
      for (let j = i + 1; j < drafts.length; j += 1) {
        const a = pos.get(drafts[i].id)!;
        const b = pos.get(drafts[j].id)!;
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let dist2 = dx * dx + dy * dy;
        if (dist2 < 1) {
          dx = hash01(drafts[i].id + drafts[j].id) - 0.5;
          dy = 0.5;
          dist2 = 1;
        }
        const dist = Math.sqrt(dist2);
        const force = Math.min(60, 9000 / dist2) * alpha;
        a.vx += (dx / dist) * force;
        a.vy += (dy / dist) * force;
        b.vx -= (dx / dist) * force;
        b.vy -= (dy / dist) * force;
      }
    }

    for (const edge of edges) {
      const a = pos.get(edge.source)!;
      const b = pos.get(edge.target)!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - 120) * 0.04 * alpha;
      a.vx += (dx / dist) * force;
      a.vy += (dy / dist) * force;
      b.vx -= (dx / dist) * force;
      b.vy -= (dy / dist) * force;
    }

    for (const node of pos.values()) {
      node.vx += (cx - node.x) * 0.006 * alpha;
      node.vy += (cy - node.y) * 0.016 * alpha;
      node.x += node.vx;
      node.y += node.vy;
      node.vx *= 0.6;
      node.vy *= 0.6;
    }
  }

  // Resolve label overlaps: push apart along the axis with the smaller penetration.
  for (let pass = 0; pass < 80; pass += 1) {
    let moved = false;
    for (let i = 0; i < drafts.length; i += 1) {
      for (let j = i + 1; j < drafts.length; j += 1) {
        const a = pos.get(drafts[i].id)!;
        const b = pos.get(drafts[j].id)!;
        const overlapX = (drafts[i].width + drafts[j].width) / 2 + 8 - Math.abs(a.x - b.x);
        const overlapY = (drafts[i].height + drafts[j].height) / 2 + 8 - Math.abs(a.y - b.y);
        if (overlapX <= 0 || overlapY <= 0) continue;
        moved = true;
        if (overlapX < overlapY) {
          const shift = overlapX / 2 + 0.5;
          const dir = a.x === b.x ? (hash01(drafts[i].id) > 0.5 ? 1 : -1) : Math.sign(a.x - b.x);
          a.x += dir * shift;
          b.x -= dir * shift;
        } else {
          const shift = overlapY / 2 + 0.5;
          const dir = a.y === b.y ? (hash01(drafts[j].id) > 0.5 ? 1 : -1) : Math.sign(a.y - b.y);
          a.y += dir * shift;
          b.y -= dir * shift;
        }
      }
    }
    for (const draft of drafts) {
      const p = pos.get(draft.id)!;
      p.x = Math.min(width - draft.width / 2 - MARGIN, Math.max(draft.width / 2 + MARGIN, p.x));
      p.y = Math.min(height - draft.height / 2 - MARGIN, Math.max(draft.height / 2 + MARGIN, p.y));
    }
    if (!moved) break;
  }

  return drafts.map((draft) => {
    const p = pos.get(draft.id)!;
    return { ...draft, x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 };
  });
}

/**
 * Builds the skills graph from real content. A tool becomes a node only when at least one
 * project used it, so every link on the graph is backed by evidence.
 */
export function buildSkillGraph(skills: SkillRecord[], projects: Project[]): SkillGraph {
  const usedByProjects = new Set(projects.flatMap((project) => (project.stack ?? []).map(toolKey)));
  const toolLabels = new Map<string, string>();
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  const addEdge = (source: string, target: string) => {
    const key = `${source}|${target}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ source, target });
  };

  for (const skill of skills) {
    for (const tool of skill.tools ?? []) {
      const key = toolKey(tool);
      if (!usedByProjects.has(key)) continue;
      if (!toolLabels.has(key)) toolLabels.set(key, tool.trim());
      addEdge(competencyId(skill.id), toolId(tool));
    }
  }
  for (const project of projects) {
    for (const tool of project.stack ?? []) {
      if (toolLabels.has(toolKey(tool))) addEdge(toolId(tool), projectId(project.slug));
    }
  }

  const drafts: Draft[] = [
    ...skills.map((skill) => ({ id: competencyId(skill.id), kind: "competency" as const, label: skill.name, ...sizeFor("competency", skill.name) })),
    ...[...toolLabels.values()].map((label) => ({ id: toolId(label), kind: "tool" as const, label, ...sizeFor("tool", label) })),
    ...projects.map((project) => {
      const label = truncate(project.title, MAX_PROJECT_LABEL);
      return { id: projectId(project.slug), kind: "project" as const, label, ...sizeFor("project", label) };
    }),
  ];

  return { width: GRAPH_WIDTH, height: GRAPH_HEIGHT, nodes: layout(drafts, edges, GRAPH_WIDTH, GRAPH_HEIGHT), edges };
}

/** Nodes to emphasise for a selection: tools show their skills and projects; skills and projects show the chain through tools. */
export function highlightSet(graph: SkillGraph, id: string): Set<string> {
  const kinds = new Map(graph.nodes.map((node) => [node.id, node.kind]));
  const neighbours = (of: string) => graph.edges.flatMap((edge) => (edge.source === of ? [edge.target] : edge.target === of ? [edge.source] : []));
  const kind = kinds.get(id);
  const result = new Set<string>([id]);
  if (!kind) return result;

  const first = neighbours(id);
  first.forEach((n) => result.add(n));
  if (kind === "tool") return result;

  for (const tool of first) {
    for (const far of neighbours(tool)) {
      if (kinds.get(far) !== kind) result.add(far);
    }
  }
  return result;
}
