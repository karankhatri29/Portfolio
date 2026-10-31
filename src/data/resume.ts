// The resume page's content, copied from Karan_Kaushik_Khatri_2026_Resume.docx. It is kept separate from the home page's
// data on purpose: the resume is a fixed document, and updating it should not change anything else on the site.
export type ResumeLink = { label: string; href: string };
export type ResumeEntry = { title: string; role: string; period: string; stack: string; bullets: string[] };

export const resume = {
  name: "Karan Kaushik Khatri",
  location: "Hyderabad, India",
  links: [
    { label: "github.com/karankhatri29", href: "https://github.com/karankhatri29" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/karan-khatri-46729a277" },
    { label: "karankhatri2924@gmail.com", href: "mailto:karankhatri2924@gmail.com" },
  ] satisfies ResumeLink[],

  education: [
    { institution: "Vellore Institute of Technology, Vellore", program: "M.Tech (Integrated) Computer Science Engineering", period: "2022 – 2027", score: "CGPA: 9.42" },
    { institution: "Sri Chaitanya Junior College, Hyderabad", program: "Intermediate (MPC)", period: "2020 – 2022", score: "Percentage: 97.6" },
  ],

  skills: [
    { category: "Programming & scripting", items: "Python, Java, JavaScript, SQL, PowerShell, Bash" },
    { category: "Web development", items: "React.js, Node.js/Express, Vite, HTML5/CSS3" },
    { category: "Databases", items: "SQL (PostgreSQL, MySQL), MongoDB, Tableau" },
    { category: "AI/ML & NLP", items: "Pandas, NumPy, Scikit-Learn, Matplotlib, spaCy, NLTK, Statistical Modeling" },
    { category: "Knowledge graphs & agentic tools", items: "NetworkX (graph construction & analysis), LangChain (agent orchestration)" },
    { category: "Tools & platforms", items: "Git, Docker, Google APIs, Microsoft Azure, Vercel, CI/CD" },
  ],

  experience: [
    {
      title: "Edge-Native Email Triage Framework",
      role: "Backend Developer",
      period: "May 2026 – Present",
      stack: "Python, spaCy, NetworkX, LangChain, Google Gmail API (OAuth 2.0), SQLite",
      bullets: [
        "Built a knowledge-graph-backed pipeline (NetworkX) that ingests live Gmail data via OAuth 2.0, extracts actionable obligations from unstructured text using spaCy, and constructs a structured graph of tasks and their dependencies, persisted to SQLite for downstream querying.",
        "Applied topological ordering and degree-centrality analysis to resolve dependency chains and prioritize workflows, architecting the graph store for a planned LangChain integration enabling context-grounded QA.",
      ],
    },
    {
      title: "Context-Aware Recommendation Engine",
      role: "Data Analyst",
      period: "November 2025 – February 2026",
      stack: "Python, React.js, Node.js, NLTK, Google APIs, JSON",
      bullets: [
        "Designed a retrieval-style recommendation engine: NLP-based semantic intent extraction on user queries, followed by scoring and ranking of candidate locations against real-time contextual signals, a hand-built analog to the retrieve-then-rank pattern used in modern RAG systems.",
        "Built a modular Node.js API layer that aggregates multiple external data sources into a unified retrieval backend, using exponential time-decay weighting to keep preference scoring current as user behavior shifts.",
      ],
    },
    {
      title: "Blockchain Based Marketplace",
      role: "Blockchain Developer",
      period: "April 2025 – August 2025",
      stack: "Solidity, Ethereum PoS, React.js, IPFS, E-Wallet, NFTs",
      bullets: [
        "Built a decentralized NFT marketplace on Ethereum PoS using Solidity, featuring secure e-wallet integration, end user data encryption, and IPFS file storage with automated watermarking for ~90% piracy risk reduction, ensuring tamper-resistant, compliant blockchain asset trading with high operational reliability.",
      ],
    },
    {
      title: "Smart Data Compression Algorithm",
      role: "Data Analyst",
      period: "March 2025 – May 2025",
      stack: "Python, Flask, Bash, PostgreSQL, Compression Algorithms",
      bullets: [
        "Developed an intelligent, adaptive data compression system that analyzes file characteristics and dynamically selects optimal algorithms, achieving up to 55% size reduction for single files.",
        "Ensured lossless, verified file recovery via automated integrity validation and Bash script-driven risk mitigation, maintaining 100% data fidelity during compression and decompression.",
      ],
    },
  ] satisfies ResumeEntry[],

  papers: [
    "Multimodal Fake News Detection for Financial Information Domain-aware Feature Selection and Uncertainty Handling.",
    "Context-Aware and Personality-Driven Recommendation System for Feasible Location-Based Suggestions.",
  ],

  achievements: [
    { title: "Caterpillar Hackathon – Finalist", detail: "August 2024. Built voice-based inspection system, reducing inspection time by 45%." },
  ],
  certifications: ["DBMS Certification (Infosys Springboard)", "Azure AI Fundamentals (Microsoft)", "Scrum – Agile (TCS)"],

  leadership: [
    "Programme Representative, Integrated M.Tech CSE (22MIC)",
    "Manager, Purchase Dept., graVITas’25 & Riviera’26 | Coordinator, graVITas’24 & Riviera’25 at VIT Vellore",
  ],
};
