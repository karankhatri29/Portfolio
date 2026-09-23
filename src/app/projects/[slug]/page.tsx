import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getProject } from "@/lib/content/repository";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return {};

  return { title: project.title, description: project.summary, alternates: { canonical: `/projects/${project.slug}` } };
}

const linkClass = "border border-ink/30 px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const story = [
    { id: "problem", title: "The problem", text: project.problem },
    { id: "approach", title: "The approach", text: project.approach },
    { id: "result", title: "The result", text: project.result },
  ].filter((section) => section.text);
  const stack = project.stack ?? [];
  const images = project.images ?? [];

  return (
    <main className="mx-auto max-w-4xl px-5 py-20 lg:px-8 lg:py-32">
      <Link href="/#projects" className="text-sm font-semibold text-accent underline underline-offset-4">All projects</Link>
      <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-accent">{project.year} / {project.role}</p>
      <h1 className="mt-5 font-display text-5xl font-semibold tracking-tight sm:text-7xl">{project.title}</h1>
      <p className="mt-8 max-w-2xl text-xl leading-8 text-muted">{project.summary}</p>

      {project.githubUrl || project.liveUrl || project.videoUrl ? (
        <nav aria-label="Project links" className="mt-8 flex flex-wrap gap-3">
          {project.liveUrl ? <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>Live demo</a> : null}
          {project.videoUrl ? <a href={project.videoUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>Watch the demo</a> : null}
          {project.githubUrl ? <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>View on GitHub</a> : null}
        </nav>
      ) : null}

      {stack.length > 0 ? (
        <ul aria-label="Technologies used" className="mt-8 flex flex-wrap gap-2">
          {stack.map((tool) => <li key={tool} className="rounded-full border border-ink/15 px-3 py-1 text-xs text-muted">{tool}</li>)}
        </ul>
      ) : null}

      {images.length > 0 ? (
        <section aria-label="Screenshots" className="mt-14 grid gap-6 sm:grid-cols-2">
          {images.map((image) => (
            <figure key={image.url} className="border border-ink/10">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin-supplied remote images; no optimizer host list to maintain */}
              <img src={image.url} alt={image.alt} loading="lazy" decoding="async" className="aspect-video w-full object-cover" />
              <figcaption className="px-3 py-2 text-xs text-muted">{image.alt}</figcaption>
            </figure>
          ))}
        </section>
      ) : null}

      {story.map((section) => (
        <section key={section.id} aria-labelledby={`${section.id}-title`} className="mt-14 border-t border-ink/10 pt-10">
          <h2 id={`${section.id}-title`} className="font-display text-3xl font-semibold">{section.title}</h2>
          <p className="mt-5 max-w-3xl whitespace-pre-line text-lg leading-8 text-muted">{section.text}</p>
        </section>
      ))}

      <section aria-labelledby="outcomes-title" className="mt-14 border-t border-ink/10 pt-10">
        <h2 id="outcomes-title" className="font-display text-3xl font-semibold">What changed</h2>
        <ul className="mt-6 space-y-4 text-lg text-muted">{project.outcomes.map((outcome) => <li key={outcome} className="border-l border-accent/50 pl-4">{outcome}</li>)}</ul>
      </section>
    </main>
  );
}
