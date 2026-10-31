/**
 * @jest-environment node
 */
import { portfolioContent } from "@/data/portfolio";
import { FALLBACK_PREFIX, answerFromSite } from "@/lib/ask/fallback";

const projects = [
  { slug: "email-triage", title: "Edge-Native Email Triage Framework", year: "2026", summary: "A knowledge-graph-backed pipeline that ingests Gmail data.", role: "Backend developer", outcomes: ["spaCy obligation extraction"], stack: ["Python", "spaCy", "NetworkX"] },
  { slug: "compression", title: "Smart Data Compression Algorithm", year: "2025", summary: "An adaptive compression system.", role: "Data analyst", outcomes: ["Up to 55% size reduction"], stack: ["Bash", "PostgreSQL"], result: "Verified lossless recovery." },
];
const skills = [{ id: "1", name: "AI and NLP", description: "spaCy, NLTK and LangChain for intent extraction.", tools: ["spaCy", "NLTK"] }];

const answer = (question: string) => answerFromSite(question, portfolioContent, projects, skills);

describe("answerFromSite", () => {
  it("answers a project question with that project, marked as coming from the site", () => {
    const text = answer("Tell me about the Email Triage project");

    expect(text).toContain(FALLBACK_PREFIX);
    expect(text).toContain("Edge-Native Email Triage Framework");
    expect(text).toContain("Gmail");
  });

  it("matches on tools and skills, and includes the result when there is one", () => {
    expect(answer("What did he do with compression?")).toContain("Verified lossless recovery.");
    expect(answer("Does he know NLTK?")).toContain("AI and NLP");
  });

  it("matches short keywords as whole words only", () => {
    expect(answer("Is there anything with ai?")).toContain("AI and NLP");
    const noise = [{ ...projects[0], title: "Maintain", summary: "Maintain the main domain", role: "", outcomes: [], stack: [] }];
    expect(answerFromSite("ai", portfolioContent, noise, [])).toBeNull();
  });

  it("gives the contact email for hiring and availability questions", () => {
    const text = answer("Is he open to work? How can I contact him?");

    expect(text).toContain(FALLBACK_PREFIX);
    expect(text).toMatch(/You can reach Karan at \S+@\S+/);
  });

  it("introduces him for who-questions with no project match", () => {
    expect(answer("Who is he?")).toContain("Karan Kaushik Khatri");
  });

  it("returns null rather than guessing when nothing relevant is found, or the question is only filler", () => {
    expect(answer("zzzxqv plorp wibble")).toBeNull();
    expect(answer("What has Karan built?")).toBeNull();
  });

  it("keeps long answers short", () => {
    const long = [{ ...projects[0], summary: "word ".repeat(200) }];

    expect(answerFromSite("email triage", portfolioContent, long, [])!.length).toBeLessThan(FALLBACK_PREFIX.length + 330);
  });
});
