import { LOADING_PHRASES, SUGGESTIONS, loadingPhrase, runCommand } from "@/lib/ask/commands";
import type { TerminalContext } from "@/lib/ask/commands";

const context: TerminalContext = {
  name: "Karan Kaushik Khatri",
  focus: [
    { command: "whoami", output: "Karan Kaushik Khatri" },
    { command: "cat focus.txt", output: "backend · data · applied AI" },
  ],
  skills: [
    { name: "AI and NLP", tools: ["spaCy", "NLTK"] },
    { name: "Databases", tools: [] },
  ],
  projects: [
    { title: "Email Triage", year: "2026", href: "/projects/triage" },
    { title: "Unlinked", year: "2025" },
  ],
  contacts: [
    { label: "Email", text: "me@example.com", href: "mailto:me@example.com" },
    { label: "GitHub", text: "github.com/me", href: "https://github.com/me" },
  ],
};

const lines = (result: ReturnType<typeof runCommand>) => (result.type === "output" ? result.lines : []);

describe("runCommand", () => {
  it("ignores blank input and a lone prompt symbol", () => {
    expect(runCommand("", context)).toEqual({ type: "empty" });
    expect(runCommand("   ", context)).toEqual({ type: "empty" });
    expect(runCommand("$ ", context)).toEqual({ type: "empty" });
  });

  it("lists the commands for help, whatever the case", () => {
    for (const input of ["help", "HELP", "?", "  Help "]) {
      const text = lines(runCommand(input, context)).map((line) => line.text).join("\n");
      expect(text).toContain("whoami");
      expect(text).toContain("projects");
      expect(text).toContain("Or just type a question");
    }
  });

  it("answers whoami, skills, projects and contact from the page's own data", () => {
    expect(lines(runCommand("whoami", context)).map((line) => line.text)).toEqual(["Karan Kaushik Khatri", "Karan Kaushik Khatri", "backend · data · applied AI"]);
    expect(lines(runCommand("skills", context)).map((line) => line.text)).toEqual(["AI and NLP: spaCy, NLTK", "Databases"]);
    expect(lines(runCommand("projects", context))).toEqual([
      { kind: "link", text: "Email Triage (2026)", href: "/projects/triage" },
      { kind: "text", text: "Unlinked (2025)" },
    ]);
    expect(lines(runCommand("contact", context))).toEqual([
      { kind: "text", text: "Email is the quickest way to reach him." },
      { kind: "link", text: "Email: me@example.com", href: "mailto:me@example.com" },
      { kind: "link", text: "GitHub: github.com/me", href: "https://github.com/me" },
    ]);
  });

  it("falls back gracefully when there is no data for a command", () => {
    const empty: TerminalContext = { ...context, skills: [], projects: [], contacts: [] };
    expect(lines(runCommand("skills", empty))[0].text).toMatch(/skills graph/);
    expect(lines(runCommand("projects", empty))[0].text).toMatch(/No projects/);
    expect(lines(runCommand("contact", empty))[0].text).toMatch(/contact section/);
  });

  it("clears and closes", () => {
    expect(runCommand("clear", context)).toEqual({ type: "clear" });
    expect(runCommand("cls", context)).toEqual({ type: "clear" });
    for (const input of ["exit", "quit", "close"]) expect(runCommand(input, context)).toEqual({ type: "close" });
  });

  it("treats anything else as a question for the assistant", () => {
    expect(runCommand("What has Karan built with NLP?", context)).toEqual({ type: "ask", question: "What has Karan built with NLP?" });
    expect(runCommand("$ is he open to work", context)).toEqual({ type: "ask", question: "is he open to work" });
  });

  it("strips an explicit ask prefix, and explains it when nothing follows", () => {
    expect(runCommand("ask what has he built?", context)).toEqual({ type: "ask", question: "what has he built?" });
    expect(lines(runCommand("ask", context))[0].text).toMatch(/Ask what/);
  });

  it("does not run a command word that is just the start of a question", () => {
    // "skills" only counts as the command when it is the first word; the whole line still goes to ask otherwise.
    expect(runCommand("what skills does he have", context)).toEqual({ type: "ask", question: "what skills does he have" });
  });

  it("has a friendly easter egg that points to the email", () => {
    const result = runCommand("sudo hire karan", context);
    expect(lines(result)[0].text).toMatch(/Permission granted/);
    expect(lines(result)[1]).toEqual({ kind: "link", text: "me@example.com", href: "mailto:me@example.com" });
  });
});

describe("suggestions and loading phrases", () => {
  it("offers short, on-topic suggestions", () => {
    expect(SUGGESTIONS.length).toBeGreaterThanOrEqual(3);
    for (const suggestion of SUGGESTIONS) expect(suggestion.length).toBeLessThanOrEqual(200);
  });

  it("walks through the jokes in order as time passes, and stays on the last one", () => {
    expect(loadingPhrase(0)).toBe("Googling the answer…");
    expect(loadingPhrase(1000)).toBe("Googling the answer…");
    expect(loadingPhrase(1700)).toBe("…jk, I don't need Google for this.");
    expect(loadingPhrase(3500)).toBe("Consulting my very expensive crystal ball…");
    expect(loadingPhrase(5000)).toBe("Pretending to think hard, for dramatic effect…");
    expect(loadingPhrase(7000)).toBe("Double-checking that Karan really did all that. (He did.)");
    expect(loadingPhrase(9000)).toBe("Bribing the servers with a very small cookie…");
    expect(loadingPhrase(60000)).toBe("Still here. Latency is character-building.");
  });

  it("has between five and seven phrases, each short enough for one line, with no repeats", () => {
    expect(LOADING_PHRASES.length).toBeGreaterThanOrEqual(5);
    expect(LOADING_PHRASES.length).toBeLessThanOrEqual(7);
    const texts = LOADING_PHRASES.map((phrase) => phrase.text as string);
    expect(new Set(texts).size).toBe(texts.length);
    for (const phrase of texts) expect(phrase.length).toBeLessThanOrEqual(64);
  });

  it("has increasing thresholds", () => {
    const afters = LOADING_PHRASES.map((phrase) => phrase.after);
    expect([...afters].sort((a, b) => a - b)).toEqual(afters);
    expect(afters[0]).toBe(0);
  });
});

describe("runCommand answers with real content when the page provides it", () => {
  const rich: TerminalContext = {
    ...context,
    focus: [
      { command: "whoami", output: "Karan Kaushik Khatri" },
      { command: "cat focus.txt", output: "backend · data · applied AI" },
      { command: "now", output: "Gmail knowledge-graph pipeline" },
    ],
    about: { introduction: "I am Karan, a CSE student at VIT Vellore.", detail: "I build practical tools that connect messy data to clear workflows." },
    availability: "Open to backend and applied AI roles",
    skills: [{ name: "AI and NLP", tools: ["spaCy"], description: "Language models and retrieval on real data." }, { name: "Databases", tools: [] }],
    projects: [
      { title: "Email Triage", year: "2026", href: "/projects/triage", role: "Backend developer", summary: "A knowledge-graph-backed Gmail pipeline." },
      { title: "Role only", year: "2025", role: "Data analyst" },
      { title: "Bare", year: "2024" },
    ],
  };

  it("whoami says who he is, what he does, what he is on now and whether he is available, instead of repeating his name", () => {
    expect(lines(runCommand("whoami", rich)).map((line) => line.text)).toEqual([
      "I am Karan, a CSE student at VIT Vellore.",
      "I build practical tools that connect messy data to clear workflows.",
      "Focus: backend · data · applied AI",
      "Now: Gmail knowledge-graph pipeline",
      "Availability: Open to backend and applied AI roles",
    ]);
  });

  it("whoami works without the optional about details or availability", () => {
    const minimal = { ...rich, about: { introduction: "Hello." }, availability: undefined };
    expect(lines(runCommand("whoami", minimal)).map((line) => line.text)).toEqual(["Hello.", "Focus: backend · data · applied AI", "Now: Gmail knowledge-graph pipeline"]);
  });

  it("projects and ls give each project a link and a line saying what it is", () => {
    for (const input of ["projects", "ls"]) {
      expect(lines(runCommand(input, rich))).toEqual([
        { kind: "link", text: "Email Triage (2026)", href: "/projects/triage" },
        { kind: "text", text: "  Backend developer · A knowledge-graph-backed Gmail pipeline." },
        { kind: "text", text: "Role only (2025)" },
        { kind: "text", text: "  Data analyst" },
        { kind: "text", text: "Bare (2024)" },
      ]);
    }
  });

  it("skills adds what each competency is about under its tools", () => {
    expect(lines(runCommand("skills", rich)).map((line) => line.text)).toEqual(["AI and NLP: spaCy", "  Language models and retrieval on real data.", "Databases"]);
  });

  it("contact leads with the quickest route only when there is an email to point to", () => {
    const noEmail = { ...rich, contacts: [{ label: "GitHub", text: "github.com/me", href: "https://github.com/me" }] };
    expect(lines(runCommand("contact", noEmail))).toEqual([{ kind: "link", text: "GitHub: github.com/me", href: "https://github.com/me" }]);
  });
});
