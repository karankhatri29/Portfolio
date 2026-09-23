import type { TerminalLine } from "@/data/portfolio";

export type OutputLine = { kind: "text"; text: string } | { kind: "link"; text: string; href: string };

export type TerminalContext = {
  name: string;
  focus: TerminalLine[];
  skills: { name: string; tools: string[] }[];
  projects: { title: string; year: string; href?: string }[];
  contacts: { label: string; text: string; href: string }[];
};

export type CommandResult =
  | { type: "empty" }
  | { type: "output"; lines: OutputLine[] }
  | { type: "clear" }
  | { type: "close" }
  | { type: "ask"; question: string };

export const SUGGESTIONS = ["What has Karan built with NLP?", "Is he open to work?", "Tell me about the Email Triage project", "How can I contact him?"];

const text = (value: string): OutputLine => ({ kind: "text", text: value });

const HELP: OutputLine[] = [
  text("Commands:"),
  text("  whoami      who Karan is"),
  text("  skills      what he works with"),
  text("  projects    things he has built"),
  text("  contact     how to reach him"),
  text("  clear       clear the screen"),
  text("  exit        close the terminal"),
  text("Or just type a question about his work."),
];

/**
 * Decides what a line typed into the terminal does. Built-in commands answer instantly from the
 * page's own data (no model call, no cost); anything else is a question for the assistant.
 */
export function runCommand(raw: string, context: TerminalContext): CommandResult {
  const input = raw.replace(/^\s*\$\s*/, "").trim();
  if (!input) return { type: "empty" };

  const [word, ...rest] = input.split(/\s+/);
  const command = word.toLowerCase();

  switch (command) {
    case "help":
    case "?":
      return { type: "output", lines: HELP };
    case "clear":
    case "cls":
      return { type: "clear" };
    case "exit":
    case "quit":
    case "close":
      return { type: "close" };
    case "whoami":
      return { type: "output", lines: [text(context.name), ...context.focus.map((line) => text(line.output))] };
    case "skills":
      return context.skills.length
        ? { type: "output", lines: context.skills.map((skill) => text(`${skill.name}${skill.tools.length ? `: ${skill.tools.join(", ")}` : ""}`)) }
        : { type: "output", lines: [text("The skills graph on this page has the full picture.")] };
    case "projects":
    case "ls":
      return {
        type: "output",
        lines: context.projects.length ? context.projects.map((project): OutputLine => (project.href ? { kind: "link", text: `${project.title} (${project.year})`, href: project.href } : text(`${project.title} (${project.year})`))) : [text("No projects listed yet.")],
      };
    case "contact":
    case "email":
      return {
        type: "output",
        lines: context.contacts.length ? context.contacts.map((contact): OutputLine => ({ kind: "link", text: `${contact.label}: ${contact.text}`, href: contact.href })) : [text("Use the contact section at the bottom of the page.")],
      };
    case "sudo":
      return {
        type: "output",
        lines: [text("Permission granted. The best next step is a message:"), ...context.contacts.filter((contact) => contact.label === "Email").map((contact): OutputLine => ({ kind: "link", text: contact.text, href: contact.href }))],
      };
    case "ask":
      return rest.length ? { type: "ask", question: rest.join(" ") } : { type: "output", lines: [text("Ask what, exactly? Try: ask what has Karan built?")] };
    default:
      return { type: "ask", question: input };
  }
}

/** Sarcastic lines shown while the model thinks, so a 2 to 10 second wait feels intentional. */
export const LOADING_PHRASES = [
  { after: 0, text: "Googling the answer…" },
  { after: 1500, text: "…jk, I don't need Google for this." },
  { after: 3000, text: "Consulting my very expensive crystal ball…" },
  { after: 4600, text: "Pretending to think hard, for dramatic effect…" },
  { after: 6300, text: "Double-checking that Karan really did all that. (He did.)" },
  { after: 8200, text: "Bribing the servers with a very small cookie…" },
  { after: 10500, text: "Still here. Latency is character-building." },
] as const;

export function loadingPhrase(elapsedMs: number): string {
  let current: string = LOADING_PHRASES[0].text;
  for (const phrase of LOADING_PHRASES) if (elapsedMs >= phrase.after) current = phrase.text;
  return current;
}
