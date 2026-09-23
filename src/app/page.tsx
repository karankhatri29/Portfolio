import { auth } from "@/auth";
import { AboutSection } from "@/components/AboutSection";
import { CareerTimeline } from "@/components/CareerTimeline";
import { CompetencyGraph } from "@/components/CompetencyGraph";
import { CompetencyGrid } from "@/components/CompetencyGrid";
import { HeroSection } from "@/components/HeroSection";
import { JsonLd } from "@/components/JsonLd";
import { OpenSource } from "@/components/OpenSource";
import { Publications } from "@/components/Publications";
import { Testimonials } from "@/components/Testimonials";
import { PortfolioShell } from "@/components/PortfolioShell";
import { ProjectShowcase } from "@/components/ProjectShowcase";
import { WritingPreview } from "@/components/WritingPreview";
import { listBlogPosts } from "@/lib/content/blog";
import { listHighlights, listProjects, listSkills } from "@/lib/content/repository";
import { portfolioContent } from "@/data/portfolio";
import { getGithubActivity, githubUsername } from "@/lib/github";
import { absoluteUrl, siteUrl, socialProfiles } from "@/lib/site";
import { buildSkillGraph } from "@/lib/skills/graph";

export default async function Page() {
  const githubUser = githubUsername(portfolioContent.contactLinks);
  // Optional sections must never take the page down: a missing table or GitHub outage just hides them.
  const [session, projects, skills, highlights, github, writing] = await Promise.all([
    auth(),
    listProjects(),
    listSkills(),
    listHighlights().catch(() => []),
    githubUser ? getGithubActivity(githubUser) : Promise.resolve(null),
    listBlogPosts().catch(() => []),
  ]);
  const skillGraph = buildSkillGraph(skills, projects);
  const githubProfile = portfolioContent.contactLinks.find((link) => link.icon === "github")?.href;

  return (
    <PortfolioShell session={session}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: portfolioContent.name,
          jobTitle: portfolioContent.headline.split(".")[0],
          description: portfolioContent.summary,
          url: siteUrl(),
          image: absoluteUrl("/karan-khatri.png"),
          sameAs: socialProfiles(),
          alumniOf: { "@type": "CollegeOrUniversity", name: "Vellore Institute of Technology" },
        }}
      />
      <div className="mx-auto max-w-6xl px-5 lg:px-8"><HeroSection content={portfolioContent} bookingUrl={process.env.NEXT_PUBLIC_BOOKING_URL || undefined} /></div>
      <div className="mx-auto max-w-7xl px-5 lg:px-10"><CareerTimeline items={portfolioContent.timeline} /></div>
      {skillGraph.edges.length ? (
        <div className="mx-auto max-w-7xl px-5 lg:px-10"><CompetencyGraph graph={skillGraph} skills={skills} projects={projects} /></div>
      ) : (
        <div className="mx-auto max-w-6xl px-5 lg:px-8"><CompetencyGrid items={skills} /></div>
      )}
      <div className="mx-auto max-w-7xl px-5 lg:px-10"><ProjectShowcase projects={projects} fallbackGithubUrl={githubProfile} /></div>
      <div className="mx-auto max-w-6xl px-5 lg:px-8"><OpenSource activity={github} /></div>
      <div className="mx-auto max-w-6xl px-5 lg:px-8"><Publications items={highlights.filter((item) => item.kind === "publication")} /></div>
      <div className="mx-auto max-w-6xl px-5 lg:px-8"><Testimonials items={highlights.filter((item) => item.kind === "testimonial")} /></div>
      <div className="mx-auto max-w-6xl px-5 lg:px-8"><WritingPreview posts={writing} /></div>
      <div className="mx-auto max-w-6xl px-5 lg:px-8"><AboutSection about={portfolioContent.about} /></div>
    </PortfolioShell>
  );
}
