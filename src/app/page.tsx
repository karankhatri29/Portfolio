import { auth } from "@/auth";
import { CareerTimeline } from "@/components/CareerTimeline";
import { CompetencyGrid } from "@/components/CompetencyGrid";
import { HeroSection } from "@/components/HeroSection";
import { PortfolioShell } from "@/components/PortfolioShell";
import { ProjectCard } from "@/components/ProjectCard";
import { portfolioContent } from "@/data/portfolio";

export default async function Page() {
  const session = await auth();

  return (
    <PortfolioShell session={session}>
      <div className="mx-auto max-w-6xl px-5 lg:px-8"><HeroSection content={portfolioContent} /></div>
      <div className="mx-auto max-w-6xl px-5 lg:px-8"><CareerTimeline items={portfolioContent.timeline} /></div>
      <div className="mx-auto max-w-6xl px-5 lg:px-8"><CompetencyGrid items={portfolioContent.competencies} /></div>
      <section id="projects" aria-labelledby="projects-title" className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
        <h2 id="projects-title" className="font-display text-3xl font-semibold">Selected work</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">{portfolioContent.projects.map((project) => <ProjectCard key={project.slug} project={project} />)}</div>
      </section>
      <section id="writing" className="border-t border-ink/10 px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-6xl"><h2 className="font-display text-3xl font-semibold">Writing and research</h2></div>
      </section>
      <section id="about" className="border-t border-ink/10 px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-6xl"><h2 className="font-display text-3xl font-semibold">About</h2></div>
      </section>
    </PortfolioShell>
  );
}
