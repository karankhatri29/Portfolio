import { auth } from "@/auth";
import { AboutSection } from "@/components/AboutSection";
import { CareerTimeline } from "@/components/CareerTimeline";
import { CompetencyGrid } from "@/components/CompetencyGrid";
import { HeroSection } from "@/components/HeroSection";
import { PortfolioShell } from "@/components/PortfolioShell";
import { ProjectCard } from "@/components/ProjectCard";
import { WritingPreview } from "@/components/WritingPreview";
import { listBlogPosts } from "@/lib/content/blog";
import { listProjects, listSkills } from "@/lib/content/repository";
import { portfolioContent } from "@/data/portfolio";

export default async function Page() {
  const [session, projects, skills] = await Promise.all([auth(), listProjects(), listSkills()]);
  const writing = listBlogPosts();

  return (
    <PortfolioShell session={session}>
      <div className="mx-auto max-w-6xl px-5 lg:px-8"><HeroSection content={portfolioContent} /></div>
      <div className="mx-auto max-w-7xl px-5 lg:px-10"><CareerTimeline items={portfolioContent.timeline} /></div>
      <div className="mx-auto max-w-6xl px-5 lg:px-8"><CompetencyGrid items={skills} /></div>
      <section id="projects" aria-labelledby="projects-title" className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
        <h2 id="projects-title" className="font-display text-3xl font-semibold">Selected work</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">{projects.map((project) => <ProjectCard key={project.slug} project={project} />)}</div>
      </section>
      <div className="mx-auto max-w-6xl px-5 lg:px-8"><WritingPreview posts={writing} /></div>
      <div className="mx-auto max-w-6xl px-5 lg:px-8"><AboutSection about={portfolioContent.about} /></div>
    </PortfolioShell>
  );
}
