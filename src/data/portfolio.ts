export type TimelineItem = {
  year: string;
  /** First month, as "YYYY-MM". With `end`, drives the bars on the desktop timeline. */
  start?: string;
  /** Last month, as "YYYY-MM"; null or omitted means it is still going. */
  end?: string | null;
  title: string;
  organization: string;
  summary: string;
  tags?: string[];
};

export type ContactLink = { label: string; href: string; icon: "email" | "github" | "linkedin" | "phone" };

export type AboutContent = {
  introduction: string;
  detail: string;
  principles: string[];
  education: string[];
  recognition: string[];
  leadership: string[];
};

export type TerminalLine = { command: string; output: string };

export type Availability = { open: boolean; label: string };

export type PortfolioContent = {
  name: string;
  eyebrow: string;
  headline: string;
  summary: string;
  navigation: string[];
  timeline: TimelineItem[];
  contactLinks: ContactLink[];
  about: AboutContent;
  /** Short lines typed out in the hero terminal card; keep each under ~30 characters. */
  terminal: TerminalLine[];
  /** Shown as a badge in the hero. Set open to false to hide it. */
  availability?: Availability;
};

export const portfolioContent: PortfolioContent = {
  name: "Karan Kaushik Khatri",
  eyebrow: "Integrated M.Tech CSE student / builder",
  headline: "AI engineer. I make language models useful on real, messy data.",
  summary: "Computer science engineer at VIT Vellore working across Python, web systems, NLP, knowledge graphs, and applied AI.",
  availability: { open: true, label: "Open to backend and applied AI roles" },
  navigation: ["Work", "Writing", "About", "Contact"],
  timeline: [
    { year: "May 2026 - now", start: "2026-05", end: null, title: "Backend developer", organization: "Edge-Native Email Triage Framework", summary: "Building a knowledge-graph-backed Gmail pipeline with OAuth 2.0, spaCy, NetworkX, LangChain, and SQLite.", tags: ["OAuth 2.0", "spaCy", "NetworkX", "LangChain", "SQLite"] },
    { year: "Nov 2025 - Feb 2026", start: "2025-11", end: "2026-02", title: "Data analyst", organization: "Context-Aware Recommendation Engine", summary: "Designed NLP intent extraction and retrieval-style ranking over contextual location signals.", tags: ["NLP", "Intent extraction", "Retrieval ranking", "Python"] },
    { year: "Apr 2025 - Aug 2025", start: "2025-04", end: "2025-08", title: "Blockchain developer", organization: "Blockchain Based Marketplace", summary: "Built a decentralized NFT marketplace with Solidity, Ethereum PoS, IPFS, and React.", tags: ["Solidity", "Ethereum PoS", "IPFS", "React"] },
    { year: "Mar 2025 - May 2025", start: "2025-03", end: "2025-05", title: "Data analyst", organization: "Smart Data Compression Algorithm", summary: "Developed adaptive compression with up to 55% size reduction and verified lossless recovery.", tags: ["Python", "Adaptive compression", "Lossless recovery"] },
  ],
  contactLinks: [
    { label: "Email Karan", href: "mailto:karankhatri2924@gmail.com", icon: "email" },
    { label: "Karan on GitHub", href: "https://github.com/karankhatri29", icon: "github" },
    { label: "Karan on LinkedIn", href: "https://www.linkedin.com/in/karan-khatri-46729a277", icon: "linkedin" },
  ],
  terminal: [
    { command: "whoami", output: "Karan Kaushik Khatri" },
    { command: "cat focus.txt", output: "backend · data · applied AI" },
    { command: "now", output: "Gmail knowledge-graph pipeline" },
  ],
  about: {
    introduction: "I am Karan Kaushik Khatri, an Integrated M.Tech Computer Science Engineering student at VIT Vellore with a 9.42 CGPA.",
    detail: "I work across backend engineering, data analysis, NLP, knowledge graphs, web development, and blockchain systems. I enjoy building practical tools that connect messy real-world data to clear workflows, from Gmail obligation graphs to context-aware recommendations.",
    principles: ["Build from the data and the user problem.", "Make complex systems explainable.", "Measure outcomes, not just activity.", "Keep learning close to the work."],
    education: ["Vellore Institute of Technology, Vellore - Integrated M.Tech CSE, 2022 - 2027, CGPA 9.42", "Sri Chaitanya Junior College, Hyderabad - Intermediate MPC, 2020 - 2022, 97.6%"],
    recognition: ["Caterpillar Hackathon finalist, 2024 - voice inspection system reduced inspection time by 45%.", "DBMS - Infosys Springboard", "Azure AI Fundamentals - Microsoft", "Scrum - Agile - TCS"],
    leadership: ["Programme Representative, Integrated M.Tech CSE (22MIC)", "Manager, Purchase Department - graVITas’25 and Riviera’26", "Coordinator - graVITas’24 and Riviera’25"],
  },
};
