import Link from "next/link";

import { GitHubIcon } from "@/components/GitHubIcon";
import type { Project } from "@/lib/content/repository";

const MAX_STACK_CHIPS = 5;

/** `fallbackGithubUrl` keeps the GitHub icon present on projects whose repository link isn't set yet. */
export function ProjectCard({ project, fallbackGithubUrl }: { project: Project; fallbackGithubUrl?: string }) {
  const githubHref = project.githubUrl || fallbackGithubUrl;
  const stack = project.stack ?? [];

  return (
    <article className="flex h-full flex-col border border-ink/10 bg-paper p-6 transition-colors hover:border-accent/60">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-semibold text-accent">{project.year}</p>
        {githubHref ? (
          <a
            href={githubHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={project.githubUrl ? `${project.title} on GitHub` : "GitHub profile"}
            className="-mr-2 -mt-2 rounded-full p-2 text-muted transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <GitHubIcon className="h-6 w-6" />
          </a>
        ) : null}
      </div>
      <h3 className="mt-2 font-display text-2xl font-semibold">{project.title}</h3>
      <p className="mt-1 text-sm text-muted">{project.role}</p>
      <p className="mt-4 flex-1 leading-7 text-muted">{project.summary}</p>
      {stack.length ? (
        <ul aria-label={`Stack for ${project.title}`} className="mt-5 flex flex-wrap gap-2">
          {stack.slice(0, MAX_STACK_CHIPS).map((tool) => <li key={tool} className="rounded-full border border-ink/15 px-3 py-1 text-xs text-muted">{tool}</li>)}
          {stack.length > MAX_STACK_CHIPS ? <li className="px-1 py-1 text-xs text-muted">+{stack.length - MAX_STACK_CHIPS}</li> : null}
        </ul>
      ) : null}
      <Link href={`/projects/${project.slug}`} className="mt-8 inline-flex w-fit border-b border-accent pb-1 text-sm font-semibold text-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-paper">View {project.title} project</Link>
    </article>
  );
}
