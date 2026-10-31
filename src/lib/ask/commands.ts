import type { TerminalLine } from "@/data/portfolio";

export type OutputLine = { kind: "text"; text: string } | { kind: "link"; text: string; href: string };

export type TerminalContext = {
  name: string;
  focus: TerminalLine[];
  /** The about text, so whoami can say who Karan is instead of repeating the hero. */
  about?: { introduction: string; detail?: string };
  availability?: string;
  skills: { name: string; tools: string[]; description?: string }[];
  projects: { title: string; year: string; href?: string; role?: string; summary?: string }[];
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

// "cat focus.txt" -> "Focus", "now" -> "Now": the label a focus line gets when whoami prints it.
function focusLabel(command: string) {
  const name = command.replace(/^cat\s+/, "").replace(/\.\w+$/, "").trim();
  return name ? name[0].toUpperCase() + name.slice(1) : "";
}

function whoami(context: TerminalContext): OutputLine[] {
  const { about, availability } = context;
  if (!about) return [text(context.name), ...context.focus.map((line) => text(line.output))];

  return [
    text(about.introduction),
    ...(about.detail ? [text(about.detail)] : []),
    ...context.focus.filter((line) => line.output !== context.name).map((line) => text(`${focusLabel(line.command)}: ${line.output}`)),
    ...(availability ? [text(`Availability: ${availability}`)] : []),
  ];
}

// Each project is a link, then one dim line with the role and what it is or achieved.
function projectLines(context: TerminalContext): OutputLine[] {
  if (!context.projects.length) return [text("No projects listed yet.")];
  return context.projects.flatMap((project): OutputLine[] => {
    const title = `${project.title} (${project.year})`;
    const detail = [project.role, project.summary].filter(Boolean).join(" · ");
    return [project.href ? { kind: "link", text: title, href: project.href } : text(title), ...(detail ? [text(`  ${detail}`)] : [])];
  });
}

function contactLines(context: TerminalContext): OutputLine[] {
  if (!context.contacts.length) return [text("Use the contact section at the bottom of the page.")];
  const links = context.contacts.map((contact): OutputLine => ({ kind: "link", text: `${contact.label}: ${contact.text}`, href: contact.href }));
  return context.contacts.some((contact) => contact.label === "Email") ? [text("Email is the quickest way to reach him."), ...links] : links;
}

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
      return { type: "output", lines: whoami(context) };
    case "skills":
      return context.skills.length
        ? {
            type: "output",
            lines: context.skills.flatMap((skill): OutputLine[] => [
              text(`${skill.name}${skill.tools.length ? `: ${skill.tools.join(", ")}` : ""}`),
              ...(skill.description ? [text(`  ${skill.description}`)] : []),
            ]),
          }
        : { type: "output", lines: [text("The skills graph on this page has the full picture.")] };
    case "projects":
    case "ls":
      return { type: "output", lines: projectLines(context) };
    case "contact":
    case "email":
      return { type: "output", lines: contactLines(context) };
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
