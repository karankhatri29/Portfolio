import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getProject } from "@/lib/content/repository";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return {};

  return { title: project.title, description: project.summary, alternates: { canonical: `/projects/${project.slug}` } };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  return (
    <main className="mx-auto max-w-4xl px-5 py-20 lg:px-8 lg:py-32">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">{project.year} / {project.role}</p>
      <h1 className="mt-5 font-display text-5xl font-semibold tracking-tight sm:text-7xl">{project.title}</h1>
      <p className="mt-8 max-w-2xl text-xl leading-8 text-muted">{project.summary}</p>
      <section aria-labelledby="outcomes-title" className="mt-16 border-t border-ink/10 pt-10">
        <h2 id="outcomes-title" className="font-display text-3xl font-semibold">What changed</h2>
        <ul className="mt-6 space-y-4 text-lg text-muted">{project.outcomes.map((outcome) => <li key={outcome} className="border-l border-accent/50 pl-4">{outcome}</li>)}</ul>
      </section>
    </main>
  );
}
