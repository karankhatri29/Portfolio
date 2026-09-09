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

export type ContactLink = { label: string; href: string; icon: "email" | "github" | "linkedin" | "phone" };

export type AboutContent = {
  introduction: string;
  detail: string;
  principles: string[];
  education: string[];
  recognition: string[];
  leadership: string[];
};

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
  about: AboutContent;
};

export const portfolioContent: PortfolioContent = {
  name: "Karan Kaushik Khatri",
  eyebrow: "Integrated M.Tech CSE student / builder",
  headline: "I build intelligent systems that turn messy information into useful decisions.",
  summary: "Computer science engineer at VIT Vellore working across Python, web systems, NLP, knowledge graphs, and applied AI.",
  navigation: ["Work", "Writing", "About"],
  timeline: [
    { year: "May 2026 - now", title: "Backend developer", organization: "Edge-Native Email Triage Framework", summary: "Building a knowledge-graph-backed Gmail pipeline with OAuth 2.0, spaCy, NetworkX, LangChain, and SQLite." },
    { year: "Nov 2025 - Feb 2026", title: "Data analyst", organization: "Context-Aware Recommendation Engine", summary: "Designed NLP intent extraction and retrieval-style ranking over contextual location signals." },
    { year: "Apr 2025 - Aug 2025", title: "Blockchain developer", organization: "Blockchain Based Marketplace", summary: "Built a decentralized NFT marketplace with Solidity, Ethereum PoS, IPFS, and React." },
    { year: "Mar 2025 - May 2025", title: "Data analyst", organization: "Smart Data Compression Algorithm", summary: "Developed adaptive compression with up to 55% size reduction and verified lossless recovery." },
  ],
  competencies: [
    { name: "Python and data", description: "Python, Pandas, NumPy, Scikit-Learn, Matplotlib, SQL, and statistical modeling." },
    { name: "Web development", description: "React.js, Node.js/Express, Vite, JavaScript, HTML5, and CSS3." },
    { name: "AI and NLP", description: "spaCy, NLTK, LangChain, semantic intent extraction, and retrieval-style ranking." },
    { name: "Knowledge graphs", description: "NetworkX graph construction and analysis for dependency-aware workflows." },
    { name: "Cloud and delivery", description: "Git, Docker, Microsoft Azure, Google APIs, Vercel, CI/CD, Bash, and PowerShell." },
    { name: "Databases", description: "PostgreSQL, MySQL, MongoDB, SQLite, and Tableau." },
  ],
  projects: [
    { slug: "edge-native-email-triage", title: "Edge-Native Email Triage Framework", year: "2026 - present", summary: "A knowledge-graph-backed pipeline that ingests Gmail data, extracts obligations, and maps task dependencies.", role: "Backend developer", outcomes: ["Live Gmail ingestion through OAuth 2.0", "spaCy obligation extraction", "NetworkX dependency analysis persisted to SQLite"] },
    { slug: "context-aware-recommendation-engine", title: "Context-Aware Recommendation Engine", year: "2025 - 2026", summary: "A retrieval-style recommendation engine that extracts semantic intent and ranks locations against live contextual signals.", role: "Data analyst", outcomes: ["Modular Node.js retrieval API", "Google API aggregation", "Time-decay preference scoring"] },
    { slug: "blockchain-marketplace", title: "Blockchain Based Marketplace", year: "2025", summary: "A decentralized NFT marketplace built on Ethereum PoS with IPFS storage and wallet integration.", role: "Blockchain developer", outcomes: ["Solidity smart contracts", "IPFS asset storage", "Encrypted user data and automated watermarking"] },
    { slug: "smart-data-compression", title: "Smart Data Compression Algorithm", year: "2025", summary: "An adaptive compression system that selects algorithms based on file characteristics and verifies recovery integrity.", role: "Data analyst", outcomes: ["Up to 55% single-file size reduction", "Lossless recovery validation", "Bash-driven automation with PostgreSQL"] },
  ],
  contactLinks: [
    { label: "Email Karan", href: "mailto:karankhatri2924@gmail.com", icon: "email" },
    { label: "Karan on GitHub", href: "https://github.com/karankhatri29", icon: "github" },
    { label: "Karan on LinkedIn", href: "http://www.linkedin.com/in/karan-khatri-46729a277", icon: "linkedin" },
    { label: "Call Karan", href: "tel:+917995646526", icon: "phone" },
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
