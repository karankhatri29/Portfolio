"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { KeyboardEvent } from "react";

import type { Project, SkillRecord } from "@/lib/content/repository";
import { competencyId, highlightSet, projectId, toolId } from "@/lib/skills/graph";
import type { GraphNode, SkillGraph } from "@/lib/skills/graph";

type Props = { graph: SkillGraph; skills: SkillRecord[]; projects: Project[] };
type Select = (id: string) => void;

const chip = "rounded-full border px-3 py-1 text-xs";

function Chip({ label, id, active, onSelect }: { label: string; id: string; active?: boolean; onSelect?: Select }) {
  const tone = active ? "border-accent/60 text-ink" : "border-ink/15 text-muted";
  if (!onSelect) return <span className={`${chip} ${tone}`}>{label}</span>;
  return (
    <button type="button" onClick={() => onSelect(id)} className={`${chip} ${tone} transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent`}>
      {label}
    </button>
  );
}

function Detail({ id, graph, skills, projects, onSelect }: Props & { id: string; onSelect?: Select }) {
  const linked = (of: string) => graph.edges.flatMap((edge) => (edge.source === of ? [edge.target] : edge.target === of ? [edge.source] : []));
  const usedTools = new Set(graph.nodes.filter((node) => node.kind === "tool" && node.proven).map((node) => node.id));
  const projectBySlug = (nodeId: string) => projects.find((project) => projectId(project.slug) === nodeId);
  const skillById = (nodeId: string) => skills.find((skill) => competencyId(skill.id) === nodeId);
  const toolLabel = (nodeId: string) => graph.nodes.find((node) => node.id === nodeId)?.label ?? nodeId;
  const heading = "font-display text-2xl font-semibold";
  const label = "mt-6 text-sm font-semibold text-muted";

  const skill = skillById(id);
  if (skill) {
    const provenBy = new Map<string, string[]>();
    for (const tool of linked(id)) for (const project of linked(tool)) if (projectBySlug(project)) provenBy.set(project, [...(provenBy.get(project) ?? []), toolLabel(tool)]);
    return (
      <div>
        <h3 className={heading}>{skill.name}</h3>
        <p className="mt-3 leading-7 text-muted">{skill.description}</p>
        {skill.tools?.length ? (
          <>
            <p className={label}>Tools</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {skill.tools.map((tool) => <li key={tool}><Chip label={tool} id={toolId(tool)} active={usedTools.has(toolId(tool))} onSelect={onSelect} /></li>)}
            </ul>
            <p className="mt-2 text-xs text-muted">Highlighted tools were used in a project below; the rest are skills I work with but haven&apos;t listed a project for yet.</p>
          </>
        ) : null}
        <p className={label}>Proven in</p>
        {provenBy.size ? (
          <ul className="mt-3 space-y-3">
            {[...provenBy].map(([projectNode, tools]) => {
              const project = projectBySlug(projectNode)!;
              return (
                <li key={projectNode} className="border-l border-accent/50 pl-4">
                  <Link href={`/projects/${project.slug}`} className="font-semibold hover:text-accent">{project.title}</Link>
                  <p className="text-sm text-muted">{tools.join(", ")} · {project.role}</p>
                </li>
              );
            })}
          </ul>
        ) : <p className="mt-3 text-sm text-muted">No project evidence linked yet.</p>}
      </div>
    );
  }

  const project = projectBySlug(id);
  if (project) {
    return (
      <div>
        <p className="text-sm font-semibold text-accent">{project.year} / {project.role}</p>
        <h3 className={`${heading} mt-2`}>{project.title}</h3>
        <p className="mt-3 leading-7 text-muted">{project.summary}</p>
        <p className={label}>Outcomes</p>
        <ul className="mt-3 space-y-2 text-sm text-muted">{project.outcomes.map((outcome) => <li key={outcome} className="border-l border-accent/50 pl-3">{outcome}</li>)}</ul>
        {project.stack?.length ? (
          <>
            <p className={label}>Stack</p>
            <ul className="mt-3 flex flex-wrap gap-2">{project.stack.map((tool) => <li key={tool}><Chip label={tool} id={toolId(tool)} active={usedTools.has(toolId(tool))} onSelect={onSelect} /></li>)}</ul>
          </>
        ) : null}
        <Link href={`/projects/${project.slug}`} className="mt-6 inline-flex border-b border-accent pb-1 text-sm font-semibold text-accent">Read the project</Link>
      </div>
    );
  }

  const related = linked(id);
  const owners = related.map(skillById).filter((item): item is SkillRecord => Boolean(item));
  const users = related.map(projectBySlug).filter((item): item is Project => Boolean(item));
  return (
    <div>
      <p className="text-sm font-semibold text-accent">Tool</p>
      <h3 className={`${heading} mt-2`}>{toolLabel(id)}</h3>
      <p className={label}>Part of</p>
      <ul className="mt-3 flex flex-wrap gap-2">{owners.map((item) => <li key={item.id}><Chip label={item.name} id={competencyId(item.id)} active onSelect={onSelect} /></li>)}</ul>
      <p className={label}>Used in</p>
      {users.length ? (
        <ul className="mt-3 space-y-2">{users.map((item) => <li key={item.slug}><Link href={`/projects/${item.slug}`} className="font-semibold hover:text-accent">{item.title}</Link></li>)}</ul>
      ) : <p className="mt-3 text-sm text-muted">Not linked to a listed project yet.</p>}
    </div>
  );
}

function Overview({ skills, onSelect }: { skills: SkillRecord[]; onSelect: Select }) {
  return (
    <div>
      <h3 className="font-display text-2xl font-semibold">How to read this</h3>
      <p className="mt-3 leading-7 text-muted">Each competency links to the tools I work with. Glowing tools were used in a project, and link on to it as evidence; faint dots are skills without a listed project yet. Select any node to see the detail.</p>
      <ul className="mt-6 space-y-3">
        {skills.map((skill) => (
          <li key={skill.id}>
            <button type="button" onClick={() => onSelect(competencyId(skill.id))} className="w-full border-b border-ink/10 pb-3 text-left transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
              <span className="font-semibold">{skill.name}</span>
              <span className="mt-1 block text-sm text-muted">{skill.description}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Look = { text: string; font: string };
const looks = {
  competency: { text: "fill-ink", font: "text-[18px] font-semibold" },
  project: { text: "fill-ink", font: "text-[15px] font-medium" },
  provenTool: { text: "fill-ink", font: "text-[14px] font-medium" },
  tool: { text: "fill-muted", font: "text-[12.5px]" },
} satisfies Record<string, Look>;

const lookFor = (node: GraphNode): Look => (node.kind === "tool" ? (node.proven ? looks.provenTool : looks.tool) : looks[node.kind]);

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-3xl font-semibold text-accent sm:text-4xl">{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}

export function CompetencyGraph({ graph, skills, projects }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const focusId = hovered ?? selected;
  const lit = useMemo(() => (focusId ? highlightSet(graph, focusId) : null), [graph, focusId]);
  const nodes = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph]);
  const counts = useMemo(() => {
    const tools = graph.nodes.filter((node) => node.kind === "tool");
    return { skills: skills.length, tools: tools.length, proven: tools.filter((node) => node.proven).length, projects: projects.length };
  }, [graph, skills.length, projects.length]);
  const order = useMemo(() => new Map(graph.nodes.map((node, index) => [node.id, index])), [graph]);

  const toggle: Select = (id) => setSelected((current) => (current === id ? null : id));
  const onKeyDown = (event: KeyboardEvent<SVGGElement>, id: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle(id);
    }
  };

  return (
    <section aria-labelledby="competencies-title" className="border-b border-ink/10 py-16 lg:py-24" onKeyDown={(event) => { if (event.key === "Escape") setSelected(null); }}>
      <h2 id="competencies-title" className="text-center font-display text-3xl font-semibold lg:text-4xl">Core competencies</h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted">Skills linked to the tools I use and the projects that prove them.</p>
      <div className="mx-auto mt-10 grid max-w-2xl grid-cols-4 gap-4">
        <Stat value={counts.skills} label="Competencies" />
        <Stat value={counts.tools} label="Tools" />
        <Stat value={counts.proven} label="Shipped in projects" />
        <Stat value={counts.projects} label="Projects" />
      </div>

      <div className="mt-10 hidden gap-8 lg:grid lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
        <div>
          <svg viewBox={`0 0 ${graph.width} ${graph.height}`} role="group" aria-label="Skills knowledge graph" className="h-auto w-full" onMouseLeave={() => setHovered(null)}>
            <defs>
              <filter id="cg-glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <g aria-hidden="true">
              {graph.edges.map((edge) => {
                const a = nodes.get(edge.source)!;
                const b = nodes.get(edge.target)!;
                const evidence = edge.target.startsWith("project:");
                const on = !lit || (lit.has(edge.source) && lit.has(edge.target));
                const glowing = Boolean(lit) && on;
                const tone = glowing ? "stroke-accent opacity-50" : on ? (evidence ? "stroke-accent opacity-40" : "stroke-[rgb(214,228,240)] opacity-[0.2]") : "stroke-[rgb(214,228,240)] opacity-[0.05]";
                return (
                  <g key={`${edge.source}-${edge.target}`}>
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={`transition-opacity duration-300 ${tone}`} strokeWidth={glowing ? 1.6 : evidence ? 1.3 : 1} />
                    {glowing ? <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="graph-flow stroke-accent" strokeWidth={2.2} strokeLinecap="round" filter="url(#cg-glow)" /> : null}
                  </g>
                );
              })}
            </g>
            {graph.nodes.map((node) => {
              const style = lookFor(node);
              const interactive = node.kind !== "tool";
              const isSelected = selected === node.id;
              const dim = lit && !lit.has(node.id);
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x} ${node.y})`}
                  role="button"
                  tabIndex={interactive ? 0 : -1}
                  aria-pressed={isSelected}
                  aria-label={`${node.label} (${node.kind})`}
                  onClick={() => toggle(node.id)}
                  onKeyDown={(event) => onKeyDown(event, node.id)}
                  onMouseEnter={() => setHovered(node.id)}
                  onFocus={() => setHovered(node.id)}
                  onBlur={() => setHovered(null)}
                  className={`graph-node group cursor-pointer outline-none transition-opacity duration-200 ${dim ? "opacity-20" : "opacity-100"}`}
                  style={{ animationDelay: `${(node.kind === "competency" ? 0 : node.kind === "tool" ? 150 : 450) + (order.get(node.id) ?? 0) * 12}ms` }}
                >
                  <rect x={-node.width / 2 - 4} y={-node.height / 2 - 4} width={node.width + 8} height={node.height + 8} rx={(node.height + 8) / 2} className={`fill-none stroke-accent stroke-2 transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-focus-visible:opacity-100"}`} />
                  <rect x={-node.width / 2} y={-node.height / 2} width={node.width} height={node.height} fill="transparent" />
                  <g transform={`translate(${-node.width / 2 + 13} 0)`} aria-hidden="true">
                    {node.kind === "competency" ? (
                      <>
                        <circle r={15} className="graph-twinkle fill-accent opacity-20" />
                        <path d="M0 -10 L2.4 -2.4 L10 0 L2.4 2.4 L0 10 L-2.4 2.4 L-10 0 L-2.4 -2.4Z" className="fill-accent" filter="url(#cg-glow)" />
                      </>
                    ) : node.kind === "project" ? (
                      <>
                        <circle r={6} className="fill-none stroke-ink" strokeWidth={1.5} />
                        <circle r={2} className="fill-ink" />
                      </>
                    ) : node.proven ? (
                      <>
                        <circle r={10} className="graph-twinkle fill-accent opacity-20" />
                        <circle r={4.5} className="fill-accent" filter="url(#cg-glow)" />
                      </>
                    ) : (
                      <circle r={2.6} className="fill-[rgb(214,228,240)] opacity-40" />
                    )}
                  </g>
                  <text x={9} textAnchor="middle" dominantBaseline="central" className={`${style.text} ${style.font} select-none`}>{node.label}</text>
                </g>
              );
            })}
          </svg>
          <ul className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted" aria-label="Legend">
            <li className="flex items-center gap-2"><svg aria-hidden="true" viewBox="-12 -12 24 24" className="h-4 w-4"><path d="M0 -10 L2.4 -2.4 L10 0 L2.4 2.4 L0 10 L-2.4 2.4 L-10 0 L-2.4 -2.4Z" className="fill-accent" /></svg>Competency</li>
            <li className="flex items-center gap-2"><svg aria-hidden="true" viewBox="-12 -12 24 24" className="h-4 w-4"><circle r={9} className="fill-accent opacity-25" /><circle r={4.5} className="fill-accent" /></svg>Tool used in a project</li>
            <li className="flex items-center gap-2"><svg aria-hidden="true" viewBox="-12 -12 24 24" className="h-4 w-4"><circle r={2.6} className="fill-[rgb(214,228,240)] opacity-50" /></svg>Other tool</li>
            <li className="flex items-center gap-2"><svg aria-hidden="true" viewBox="-12 -12 24 24" className="h-4 w-4"><circle r={6} className="fill-none stroke-ink" strokeWidth={1.5} /><circle r={2} className="fill-ink" /></svg>Project</li>
          </ul>
        </div>

        <aside aria-live="polite" aria-label="Evidence" className="self-start border border-accent/20 bg-ink/[0.035] p-6 shadow-[0_0_44px_-16px_rgb(var(--color-accent)/0.45)] backdrop-blur-xl lg:p-8">
          {selected ? <Detail id={selected} graph={graph} skills={skills} projects={projects} onSelect={toggle} /> : <Overview skills={skills} onSelect={toggle} />}
          {selected ? <button type="button" onClick={() => setSelected(null)} className="mt-8 text-sm text-muted underline-offset-4 hover:text-accent hover:underline">Clear selection (Esc)</button> : null}
        </aside>
      </div>

      <ul className="mt-10 space-y-3 lg:hidden">
        {skills.map((skill) => {
          const id = competencyId(skill.id);
          const open = selected === id;
          return (
            <li key={skill.id} className="border border-accent/15 bg-ink/[0.03] backdrop-blur">
              <button type="button" aria-expanded={open} onClick={() => toggle(id)} className="flex w-full items-center justify-between p-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
                <span className="font-semibold">{skill.name}</span>
                <span aria-hidden="true" className={`text-accent transition-transform ${open ? "rotate-45" : ""}`}>+</span>
              </button>
              {open ? <div className="border-t border-ink/10 p-5"><Detail id={id} graph={graph} skills={skills} projects={projects} /></div> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
