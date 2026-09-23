import type { PortfolioContent } from "@/data/portfolio";
import type { Project, SkillRecord } from "@/lib/content/repository";

const MAX_KNOWLEDGE_CHARS = 12000;

export function contactEmail(content: PortfolioContent): string | undefined {
  return content.contactLinks.find((link) => link.icon === "email")?.href.replace(/^mailto:/, "");
}

const line = (label: string, value: string | undefined | null) => (value?.trim() ? `${label}: ${value.trim()}` : "");
const join = (items: (string | undefined)[] | undefined) => (items ?? []).filter(Boolean).join(", ");

/**
 * The only facts the assistant may use. Built from the same content the site renders, so answers
 * stay in step with what visitors can read. Public information only: nothing here is a secret.
 */
export function buildKnowledge(content: PortfolioContent, projects: Project[], skills: SkillRecord[]): string {
  const { about } = content;
  const sections: string[][] = [];

  sections.push([
    "ABOUT",
    line("Name", content.name),
    line("Headline", content.headline),
    line("Summary", content.summary),
    line("Role focus", content.eyebrow),
    content.availability?.open ? line("Availability", content.availability.label) : "",
    line("Intro", about.introduction),
    line("Detail", about.detail),
    line("Working principles", about.principles.join(" ")),
  ]);

  sections.push([
    "EDUCATION",
    line("Degree", `${about.degree.institution}, ${about.degree.program}, ${about.degree.start} to ${about.degree.end}, ${about.degree.grade}`),
    ...about.education.map((item) => line("Earlier", item)),
  ]);

  sections.push(["ACHIEVEMENTS", ...about.stats.map((stat) => `- ${stat.value}${stat.suffix ?? ""} ${stat.label}: ${stat.detail}`), ...about.recognition.map((item) => `- ${item}`)]);
  sections.push(["CERTIFICATIONS", ...about.certifications.map((item) => `- ${item}`)]);
  sections.push(["LEADERSHIP", ...about.leadership.map((item) => `- ${item}`)]);

  sections.push([
    "EXPERIENCE TIMELINE (these are project-based roles, not employment)",
    ...content.timeline.map((item) => `- ${item.year}: ${item.title}, ${item.organization}. ${item.summary}${item.tags?.length ? ` Tools: ${item.tags.join(", ")}.` : ""}`),
  ]);

  sections.push([
    "PROJECTS",
    ...projects.map((project) =>
      [
        `- ${project.title} (${project.year}, ${project.role}): ${project.summary}`,
        project.problem ? `  Problem: ${project.problem}` : "",
        project.approach ? `  Approach: ${project.approach}` : "",
        project.result ? `  Result: ${project.result}` : "",
        project.outcomes.length ? `  Outcomes: ${project.outcomes.join("; ")}` : "",
        project.stack?.length ? `  Stack: ${join(project.stack)}` : "",
        project.githubUrl ? `  GitHub: ${project.githubUrl}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    ),
  ]);

  sections.push(["SKILLS", ...skills.map((skill) => `- ${skill.name}: ${skill.description}${skill.tools?.length ? ` Tools: ${join(skill.tools)}.` : ""}`)]);

  const email = contactEmail(content);
  sections.push([
    "CONTACT",
    line("Email", email),
    ...content.contactLinks.filter((link) => link.icon === "github" || link.icon === "linkedin").map((link) => line(link.icon === "github" ? "GitHub" : "LinkedIn", link.href)),
  ]);

  const text = sections
    .map((section) => section.filter(Boolean).join("\n"))
    .filter((block) => block.includes("\n"))
    .join("\n\n");
  return text.length > MAX_KNOWLEDGE_CHARS ? `${text.slice(0, MAX_KNOWLEDGE_CHARS)}\n[truncated]` : text;
}
