import Link from "next/link";

import type { Project } from "@/data/portfolio";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="flex h-full flex-col border border-ink/10 bg-paper p-6 transition-colors hover:border-accent/60">
      <p className="text-sm font-semibold text-accent">{project.year}</p>
      <h3 className="mt-3 font-display text-2xl font-semibold">{project.title}</h3>
      <p className="mt-4 flex-1 leading-7 text-muted">{project.summary}</p>
      <Link href={`/projects/${project.slug}`} className="mt-8 inline-flex w-fit border-b border-accent pb-1 text-sm font-semibold text-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-paper">View {project.title} project</Link>
    </article>
  );
}
