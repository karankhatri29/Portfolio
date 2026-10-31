import type { PortfolioContent } from "@/data/portfolio";
import { contactEmail } from "@/lib/ask/knowledge";
import type { Project, SkillRecord } from "@/lib/content/repository";

export const FALLBACK_PREFIX = "The AI assistant is unavailable right now, so this is straight from the site: ";

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "what", "whats", "does", "did", "has", "have", "his", "him", "her", "about", "tell", "can", "you", "how", "who", "are", "was", "were", "this", "that",
  "any", "karan", "built", "build", "made", "make", "work", "worked", "working", "use", "used", "using", "please", "give", "show", "some", "he", "she", "they", "know", "knows",
  "there", "anything", "something", "everything", "which", "where", "when", "why", "get", "got", "want", "like", "into", "from", "also", "much", "many", "more", "most", "his",
]);
// "email" on its own is not a contact request ("tell me about the Email Triage project"), so it only counts with "his", "address" and the like.
const CONTACT_INTENT = /\b(contact|reach|hire|hiring|available|availability|open to work|opportunit\w*|recruit\w*|interview)\b|\b(his|your|an?) e-?mail\b|\be-?mail (address|him|karan)\b/i;
const WHO_INTENT = /\b(who|introduce|yourself|about him|background|education|study|studies|university)\b/i;

type Candidate = { title: string; text: string; answer: string };

const clip = (value: string, max = 320) => (value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`);

function keywords(question: string): string[] {
  const words = question.toLowerCase().split(/[^a-z0-9+#.]+/).map((word) => word.replace(/^\.+|\.+$/g, ""));
  // Drop filler words first, then trim a plural "s" so "projects" finds "project" (but "has" never becomes "ha").
  const stems = words.filter((word) => word.length >= 2 && !STOP_WORDS.has(word)).map((word) => (word.length > 4 ? word.replace(/s$/, "") : word));
  return [...new Set(stems)];
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Short keywords such as "ai" or "nlp" must match whole words, or "ai" would match "main" and "obtain".
function mentions(text: string, word: string): boolean {
  if (word.length > 3) return text.includes(word);
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(word)}([^a-z0-9]|$)`).test(text);
}

const weight = (word: string) => (word.length >= 5 ? 2 : 1);

function candidates(content: PortfolioContent, projects: Project[], skills: SkillRecord[]): Candidate[] {
  return [
    ...projects.map((project) => ({
      title: project.title,
      text: [project.title, project.summary, project.role, project.problem, project.approach, project.result, ...project.outcomes, ...(project.stack ?? [])].filter(Boolean).join(" "),
      answer: `${project.title} (${project.year}): ${project.summary}${project.result ? ` ${project.result}` : ""}`,
    })),
    ...skills.map((skill) => ({ title: skill.name, text: [skill.name, skill.description, ...(skill.tools ?? [])].join(" "), answer: `${skill.name}: ${skill.description}` })),
    ...content.timeline.map((item) => ({ title: item.organization, text: [item.title, item.organization, item.summary, ...(item.tags ?? [])].join(" "), answer: `${item.organization}: ${item.summary}` })),
  ];
}

/**
 * Answers a question from the site's own content when the AI model cannot be reached, by matching the question's
 * keywords against projects, skills and the timeline. Returns null when nothing relevant is found, so the caller can
 * fall back to a plain "email Karan" message instead of guessing.
 */
export function answerFromSite(question: string, content: PortfolioContent, projects: Project[], skills: SkillRecord[]): string | null {
  const email = contactEmail(content);

  if (CONTACT_INTENT.test(question) && email) {
    const availability = content.availability?.open ? `${content.availability.label}. ` : "";
    return `${FALLBACK_PREFIX}${availability}You can reach Karan at ${email}.`;
  }

  const words = keywords(question);
  let best: { score: number; answer: string } | null = null;
  for (const candidate of candidates(content, projects, skills)) {
    const text = candidate.text.toLowerCase();
    const title = candidate.title.toLowerCase();
    const score = words.reduce((total, word) => total + weight(word) * ((mentions(text, word) ? 1 : 0) + (mentions(title, word) ? 2 : 0)), 0);
    if (score > 0 && (!best || score > best.score)) best = { score, answer: candidate.answer };
  }
  if (best) return `${FALLBACK_PREFIX}${clip(best.answer)}`;

  if (WHO_INTENT.test(question)) return `${FALLBACK_PREFIX}${clip(content.about.introduction)}`;
  return null;
}
