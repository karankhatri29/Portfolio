export type TimelineItem = {
  year: string;
  title: string;
  organization: string;
  summary: string;
};

export type Competency = { name: string; description: string };

export type Project = {
  slug: string;
  title: string;
  year: string;
  summary: string;
  role: string;
  outcomes: string[];
};

export type ContactLink = { label: string; href: string; icon: "email" | "github" | "linkedin" };

export type PortfolioContent = {
  name: string;
  eyebrow: string;
  headline: string;
  summary: string;
  navigation: string[];
  timeline: TimelineItem[];
  competencies: Competency[];
  projects: Project[];
  contactLinks: ContactLink[];
};

export const portfolioContent: PortfolioContent = {
  name: "Karan",
  eyebrow: "Independent engineer",
  headline: "I build calm, useful software for complicated work.",
  summary: "A living portfolio of product systems, experiments, and research notes shaped by curiosity and care.",
  navigation: ["Work", "Writing", "About"],
  timeline: [
    { year: "2024 - now", title: "Independent engineer", organization: "Selected collaborations", summary: "Designing and shipping thoughtful systems across product, platform, and applied AI." },
    { year: "2021 - 2024", title: "Product engineer", organization: "Digital products", summary: "Turned ambiguous product questions into durable experiences and measurable outcomes." },
    { year: "2018 - 2021", title: "Software engineer", organization: "Engineering teams", summary: "Built reliable foundations while learning to make complex tools feel simple." },
  ],
  competencies: [
    { name: "Product systems", description: "From first principles to useful, maintainable workflows." },
    { name: "Frontend craft", description: "Responsive interfaces with clear interaction and accessible structure." },
    { name: "Applied AI", description: "Practical experiments that turn new capabilities into real utility." },
    { name: "Team clarity", description: "Shared language, focused decisions, and momentum without noise." },
  ],
  projects: [
    { slug: "calm-operations", title: "Calm Operations", year: "2025", summary: "A focused workspace for teams managing complex operational work.", role: "Product and engineering", outcomes: ["Reduced handoff friction", "Made system state legible", "Created room for better decisions"] },
    { slug: "research-atlas", title: "Research Atlas", year: "2024", summary: "A searchable home for connecting research notes to product decisions.", role: "Design systems and frontend", outcomes: ["Made patterns easier to find", "Connected notes to outcomes", "Improved research reuse"] },
  ],
  contactLinks: [
    { label: "Email Karan", href: "mailto:hello@example.com", icon: "email" },
    { label: "Karan on GitHub", href: "https://github.com", icon: "github" },
    { label: "Karan on LinkedIn", href: "https://www.linkedin.com", icon: "linkedin" },
  ],
};
