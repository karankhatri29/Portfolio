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
  /** Tools: used in a listed project. Competencies: has at least one such tool. Projects: always true. */
  proven: boolean;
};

export type GraphEdge = { source: string; target: string };

export type SkillGraph = { width: number; height: number; nodes: GraphNode[]; edges: GraphEdge[] };

export const GRAPH_WIDTH = 1000;
export const GRAPH_HEIGHT = 700;
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
function sizeFor(kind: NodeKind, label: string, proven: boolean) {
  if (kind === "competency") return { width: label.length * 10.4 + 40, height: 44 };
  if (kind === "project") return { width: label.length * 8.6 + 34, height: 38 };
  return proven ? { width: label.length * 8.2 + 26, height: 32 } : { width: label.length * 7.2 + 20, height: 26 };
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

const REST_LENGTH = { competencyTool: 118, toolProject: 190 };

function layout(drafts: Draft[], edges: GraphEdge[], width: number, height: number): GraphNode[] {
  const cx = width / 2;
  const cy = height / 2;
  const parent = new Map<string, string>();
  for (const edge of edges) if (edge.target.startsWith("tool:") && edge.source.startsWith("competency:") && !parent.has(edge.target)) parent.set(edge.target, edge.source);

  const pos = new Map<string, { x: number; y: number; vx: number; vy: number }>();
  const competencies = drafts.filter((node) => node.kind === "competency");
  competencies.forEach((node, index) => {
    const angle = -Math.PI / 2 + (index / competencies.length) * Math.PI * 2;
    pos.set(node.id, { x: cx + Math.cos(angle) * width * 0.34, y: cy + Math.sin(angle) * height * 0.32, vx: 0, vy: 0 });
  });

  // Each tool starts in a small burst around its competency, so clusters form naturally.
  const burst = new Map<string, number>();
  const burstSize = new Map<string, number>();
  for (const owner of parent.values()) burstSize.set(owner, (burstSize.get(owner) ?? 0) + 1);
  drafts.filter((node) => node.kind === "tool").forEach((node) => {
    const owner = parent.get(node.id);
    const hub = owner ? pos.get(owner) : undefined;
    const index = owner ? burst.get(owner) ?? 0 : 0;
    if (owner) burst.set(owner, index + 1);
    const count = owner ? burstSize.get(owner) ?? 1 : 1;
    const angle = (index / count) * Math.PI * 2 + hash01(node.id);
    const base = hub ?? { x: cx, y: cy };
    pos.set(node.id, { x: base.x + Math.cos(angle) * REST_LENGTH.competencyTool, y: base.y + Math.sin(angle) * REST_LENGTH.competencyTool * 0.8, vx: 0, vy: 0 });
  });

  drafts.filter((node) => node.kind === "project").forEach((node, index, all) => {
    const linked = edges.filter((edge) => edge.target === node.id).map((edge) => pos.get(edge.source)).filter((p): p is NonNullable<typeof p> => Boolean(p));
    const centre = linked.length ? { x: linked.reduce((sum, p) => sum + p.x, 0) / linked.length, y: linked.reduce((sum, p) => sum + p.y, 0) / linked.length } : { x: cx, y: cy };
    const angle = (index / all.length) * Math.PI * 2;
    pos.set(node.id, { x: centre.x + Math.cos(angle) * 30, y: centre.y + Math.sin(angle) * 30, vx: 0, vy: 0 });
  });

  const iterations = 520;
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
        const force = Math.min(70, 16000 / dist2) * alpha;
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
      const toProject = edge.target.startsWith("project:");
      const force = (dist - (toProject ? REST_LENGTH.toolProject : REST_LENGTH.competencyTool)) * (toProject ? 0.012 : 0.05) * alpha;
      a.vx += (dx / dist) * force;
      a.vy += (dy / dist) * force;
      b.vx -= (dx / dist) * force;
      b.vy -= (dy / dist) * force;
    }

    for (const node of pos.values()) {
      node.vx += (cx - node.x) * 0.004 * alpha;
      node.vy += (cy - node.y) * 0.008 * alpha;
      node.x += node.vx;
      node.y += node.vy;
      node.vx *= 0.6;
      node.vy *= 0.6;
    }
  }

  // Resolve label overlaps: push apart along the axis with the smaller penetration.
  for (let pass = 0; pass < 200; pass += 1) {
    let moved = false;
    for (let i = 0; i < drafts.length; i += 1) {
      for (let j = i + 1; j < drafts.length; j += 1) {
        const a = pos.get(drafts[i].id)!;
        const b = pos.get(drafts[j].id)!;
        const overlapX = (drafts[i].width + drafts[j].width) / 2 + 10 - Math.abs(a.x - b.x);
        const overlapY = (drafts[i].height + drafts[j].height) / 2 + 10 - Math.abs(a.y - b.y);
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
 * Builds the skills graph from real content. Every tool a competency lists is shown, but only
 * tools a project actually used are marked `proven` and linked onward to that project.
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
      if (!key) continue;
      if (!toolLabels.has(key)) toolLabels.set(key, tool.trim());
      addEdge(competencyId(skill.id), toolId(tool));
    }
  }
  for (const project of projects) {
    for (const tool of project.stack ?? []) {
      if (toolLabels.has(toolKey(tool))) addEdge(toolId(tool), projectId(project.slug));
    }
  }

  const provenKeys = new Set([...toolLabels.keys()].filter((key) => usedByProjects.has(key)));
  const drafts: Draft[] = [
    ...skills.map((skill) => {
      const proven = (skill.tools ?? []).some((tool) => provenKeys.has(toolKey(tool)));
      return { id: competencyId(skill.id), kind: "competency" as const, label: skill.name, proven, ...sizeFor("competency", skill.name, proven) };
    }),
    ...[...toolLabels].map(([key, label]) => {
      const proven = provenKeys.has(key);
      return { id: toolId(label), kind: "tool" as const, label, proven, ...sizeFor("tool", label, proven) };
    }),
    ...projects.map((project) => {
      const label = truncate(project.title, MAX_PROJECT_LABEL);
      return { id: projectId(project.slug), kind: "project" as const, label, proven: true, ...sizeFor("project", label, true) };
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
