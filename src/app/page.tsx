import { auth } from "@/auth";
import { AboutSection } from "@/components/AboutSection";
import { CareerTimeline } from "@/components/CareerTimeline";
import { CompetencyGraph } from "@/components/CompetencyGraph";
import { CompetencyGrid } from "@/components/CompetencyGrid";
import { HeroSection } from "@/components/HeroSection";
import { PortfolioShell } from "@/components/PortfolioShell";
import { ProjectShowcase } from "@/components/ProjectShowcase";
import { WritingPreview } from "@/components/WritingPreview";
import { listBlogPosts } from "@/lib/content/blog";
import { listProjects, listSkills } from "@/lib/content/repository";
import { portfolioContent } from "@/data/portfolio";
import { buildSkillGraph } from "@/lib/skills/graph";

export default async function Page() {
  const [session, projects, skills] = await Promise.all([auth(), listProjects(), listSkills()]);
  const writing = listBlogPosts();
  const skillGraph = buildSkillGraph(skills, projects);
  const githubProfile = portfolioContent.contactLinks.find((link) => link.icon === "github")?.href;

  return (
    <PortfolioShell session={session}>
      <div className="mx-auto max-w-6xl px-5 lg:px-8"><HeroSection content={portfolioContent} /></div>
      <div className="mx-auto max-w-7xl px-5 lg:px-10"><CareerTimeline items={portfolioContent.timeline} /></div>
      {skillGraph.edges.length ? (
        <div className="mx-auto max-w-7xl px-5 lg:px-10"><CompetencyGraph graph={skillGraph} skills={skills} projects={projects} /></div>
      ) : (
        <div className="mx-auto max-w-6xl px-5 lg:px-8"><CompetencyGrid items={skills} /></div>
      )}
      <div className="mx-auto max-w-7xl px-5 lg:px-10"><ProjectShowcase projects={projects} fallbackGithubUrl={githubProfile} /></div>
      <div className="mx-auto max-w-6xl px-5 lg:px-8"><WritingPreview posts={writing} /></div>
      <div className="mx-auto max-w-6xl px-5 lg:px-8"><AboutSection about={portfolioContent.about} /></div>
    </PortfolioShell>
  );
}
