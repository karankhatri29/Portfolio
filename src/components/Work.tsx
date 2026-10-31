import { ProjectShowcase } from "@/components/ProjectShowcase";
import { ProjectStage } from "@/components/ProjectStage";
import type { Project } from "@/lib/content/repository";

/** "Selected work": the sticky stage on large screens, the swipeable carousel everywhere else. Only one is ever displayed. */
export function Work({ projects, fallbackGithubUrl }: { projects: Project[]; fallbackGithubUrl?: string }) {
  return (
    <div id="work">
      <div className="hidden lg:block"><ProjectStage projects={projects} fallbackGithubUrl={fallbackGithubUrl} /></div>
      <div className="lg:hidden"><ProjectShowcase id="work-carousel" projects={projects} fallbackGithubUrl={fallbackGithubUrl} /></div>
    </div>
  );
}
