import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUpRight,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronUp,
  Code2,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  FileText,
  GitBranch,
  Layers,
  Mail,
  Mic,
  Radio,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Terminal,
  UserCheck,
  X,
  Zap,
} from "lucide-react";

/* =========================================================
   CONSTANTS
========================================================= */

const GITHUB_USERNAME = "riteshchaudhari1407-tech";

const GITHUB_URL = `https://github.com/${GITHUB_USERNAME}`;

const LINKEDIN_URL =
  "https://www.linkedin.com/in/ritesh-chaudhary-5992323b0";

const EMAIL =
  "https://mail.google.com/mail/?view=cm&fs=1&to=riteshchaudhari6612@gmail.com";

const RESUME_URL = "/resume.pdf";

/* =========================================================
   TYPES
========================================================= */

type GitHubProfile = {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
};

type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  pushed_at: string;
  fork: boolean;
};

type GitHubEvent = {
  id: string;
  type: string;
  repo: {
    name: string;
  };
  created_at: string;
  payload?: {
    ref?: string;
    action?: string;
    pull_request?: {
      title?: string;
    };
    issue?: {
      title?: string;
    };
  };
};

/* =========================================================
   HELPERS
========================================================= */

function formatDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "recently";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const diff = Math.max(0, now.getTime() - date.getTime());

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;

  return formatDate(dateString);
}

function getEventText(event: GitHubEvent) {
  switch (event.type) {
    case "PushEvent":
      return "Pushed code";

    case "CreateEvent":
      return "Created repository / branch";

    case "WatchEvent":
      return "Starred a repository";

    case "ForkEvent":
      return "Forked a repository";

    case "IssuesEvent":
      return event.payload?.issue?.title
        ? `Issue: ${event.payload.issue.title}`
        : "Worked on an issue";

    case "PullRequestEvent":
      return event.payload?.pull_request?.title
        ? `Pull request: ${event.payload.pull_request.title}`
        : "Worked on a pull request";

    case "DeleteEvent":
      return "Deleted a branch / tag";

    case "ReleaseEvent":
      return "Published a release";

    default:
      return "GitHub activity";
  }
}

const SUGGESTED_QUESTIONS = [
  "Who is Ritesh?",
  "Tell me about SATRK",
  "What was Ritesh's role in SATRK?",
  "What technologies does Ritesh use?",
  "What is Ritesh currently building?",
  "Tell me about his cybersecurity work",
];

function renderFormattedText(text: string) {
  if (!text) return null;

  const lines = text.split("\n");

  return lines.map((line, lineIndex) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={lineIndex} style={{ height: "4px" }} />;
    }

    const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ");
    const contentText = isBullet ? trimmed.substring(2) : line;

    // Tokenize text for bold (**bold**) and URLs (http:// or https://)
    const tokenRegex = /(\*\*[^*]+\*\*|https?:\/\/[^\s]+)/g;
    const parts = contentText.split(tokenRegex);

    const renderedParts = parts.map((part, partIndex) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return (
          <strong key={partIndex}>
            {part.substring(2, part.length - 2)}
          </strong>
        );
      }
      if (part.startsWith("http://") || part.startsWith("https://")) {
        return (
          <a
            key={partIndex}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="chat-link"
          >
            {part}
          </a>
        );
      }
      return part;
    });

    if (isBullet) {
      return (
        <div key={lineIndex} style={{ display: "flex", gap: "6px", marginLeft: "2px", marginTop: "2px", marginBottom: "2px" }}>
          <span style={{ color: "var(--lavender)" }}>•</span>
          <div>{renderedParts}</div>
        </div>
      );
    }

    return <p key={lineIndex} style={{ margin: 0 }}>{renderedParts}</p>;
  });
}

/* =========================================================
   APP
========================================================= */function App() {
  const [chatOpen, setChatOpen] = useState(false);
  const [satrkExpanded, setSatrkExpanded] = useState(false);

  const [messages, setMessages] = useState<
    { role: "ai" | "user"; text: string }[]
  >([
    {
      role: "ai",
      text: "Hi! I'm Ritesh AI. Ask me about Ritesh, his projects, skills or cybersecurity work.",
    },
  ]);

  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [healthOnline, setHealthOnline] = useState<boolean | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);

  /* =======================================================
     HEALTH CHECK & FOCUS / ESCAPE KEY ON CHAT OPEN
  ======================================================= */

  useEffect(() => {
    if (chatOpen) {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      fetch(`${baseUrl}/health`)
        .then((res) => setHealthOnline(res.ok))
        .catch(() => setHealthOnline(false));

      if (chatInputRef.current) {
        chatInputRef.current.focus();
      }

      function handleKeyDown(event: KeyboardEvent) {
        if (event.key === "Escape") {
          setChatOpen(false);
        }
      }

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [chatOpen]);

  /* =======================================================
     AUTO SCROLL ON NEW MESSAGES
  ======================================================= */

  useEffect(() => {
    if (chatOpen && messagesEndRef.current && chatContainerRef.current) {
      const container = chatContainerRef.current;
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 140;
      if (isNearBottom || messages.length <= 2) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages, chatLoading, chatOpen]);

  /* =======================================================
     GITHUB STATE
  ======================================================= */

  const [githubProfile, setGithubProfile] =
    useState<GitHubProfile | null>(null);

  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);

  const [githubEvents, setGithubEvents] = useState<GitHubEvent[]>([]);

  const [githubLoading, setGithubLoading] = useState(true);

  const [githubError, setGithubError] = useState("");

  /* =======================================================
     AI VISUAL NODES
  ======================================================= */

  const neuralNodes = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        id: index,
        left: `${18 + Math.random() * 64}%`,
        top: `${15 + Math.random() * 65}%`,
      })),
    []
  );

  /* =======================================================
     FETCH GITHUB DATA
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadGitHubData() {
      try {
        setGithubLoading(true);
        setGithubError("");

        const headers = {
          Accept: "application/vnd.github+json",
        };

        const [profileResponse, reposResponse, eventsResponse] =
          await Promise.all([
            fetch(`https://api.github.com/users/${GITHUB_USERNAME}`, {
              headers,
            }),

            fetch(
              `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=pushed`,
              {
                headers,
              }
            ),

            fetch(
              `https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=8`,
              {
                headers,
              }
            ),
          ]);

        if (!profileResponse.ok) {
          throw new Error("Unable to load GitHub profile.");
        }

        if (!reposResponse.ok) {
          throw new Error("Unable to load GitHub repositories.");
        }

        const profileData =
          (await profileResponse.json()) as GitHubProfile;

        const repoData =
          (await reposResponse.json()) as GitHubRepo[];

        let eventData: GitHubEvent[] = [];

        if (eventsResponse.ok) {
          eventData = (await eventsResponse.json()) as GitHubEvent[];
        }

        if (cancelled) return;

        const nonForkRepos = repoData
          .filter((repo) => !repo.fork)
          .sort(
            (a, b) =>
              new Date(b.pushed_at).getTime() -
              new Date(a.pushed_at).getTime()
          );

        setGithubProfile(profileData);
        setGithubRepos(nonForkRepos.slice(0, 6));
        setGithubEvents(eventData.slice(0, 6));
      } catch (error) {
        if (cancelled) return;

        console.error("GitHub API error:", error);

        setGithubError(
          "GitHub data could not be loaded right now. You can still visit the live profile."
        );
      } finally {
        if (!cancelled) {
          setGithubLoading(false);
        }
      }
    }

    loadGitHubData();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     GITHUB TOTALS
  ======================================================= */

  const totalStars = githubRepos.reduce(
    (total, repo) => total + repo.stargazers_count,
    0
  );

  const totalForks = githubRepos.reduce(
    (total, repo) => total + repo.forks_count,
    0
  );

  /* =======================================================
     AI CHAT HANDLERS & HELPERS
  ======================================================= */

  function handleCopyResponse(text: string, index: number) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  }

  function clearChat() {
    setMessages([
      {
        role: "ai",
        text: "Hi! I'm Ritesh AI. Ask me about Ritesh, his projects, skills or cybersecurity work.",
      },
    ]);
    setInput("");
    setLastFailedMessage(null);
    setCopiedIndex(null);
  }

  async function sendMessage(overrideText?: string) {
    const rawMsg = typeof overrideText === "string" ? overrideText : input;
    const cleanInput = rawMsg.trim();

    if (!cleanInput || chatLoading || cleanInput.length > 500) return;

    setLastFailedMessage(null);
    const userMessage = {
      role: "user" as const,
      text: cleanInput,
    };

    const historyPayload = messages
      .slice(1)
      .map((m) => ({
        role: m.role === "ai" ? ("assistant" as const) : ("user" as const),
        content: m.text,
      }))
      .slice(-12);

    setMessages((previous) => {
      const cleanPrevious =
        previous.length > 0 &&
        previous[previous.length - 1].text ===
          "Ritesh AI is temporarily unavailable. Please try again."
          ? previous.slice(0, -1)
          : previous;
      return [...cleanPrevious, userMessage];
    });
    if (typeof overrideText !== "string") {
      setInput("");
    }
    setChatLoading(true);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const response = await fetch(`${baseUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: cleanInput,
          history: historyPayload,
        }),
      });

      if (response.status === 429) {
        setMessages((previous) => [
          ...previous,
          {
            role: "ai" as const,
            text: "You're sending messages a little too quickly. Please wait a moment and try again.",
          },
        ]);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as { reply?: string };
      const aiReply =
        data.reply ||
        "I'm Ritesh AI. Ask me about Ritesh, his projects, skills or cybersecurity work.";

      setMessages((previous) => [
        ...previous,
        { role: "ai" as const, text: aiReply },
      ]);
    } catch (error) {
      console.error("AI Chat connection error:", error);
      setLastFailedMessage(cleanInput);
      setMessages((previous) => [
        ...previous,
        {
          role: "ai" as const,
          text: "Ritesh AI is temporarily unavailable. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  function handleChatKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
  }

  return (
    <div className="site-shell">
      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="navbar">
        <div className="nav-inner">
          <button
            className="brand"
            onClick={() => scrollToSection("home")}
          >
            <span className="brand-mark">R</span>
            <span>
              RITESH<span className="brand-dot">.AI</span>
            </span>
          </button>

          <div className="nav-links">
            <button onClick={() => scrollToSection("about")}>
              About
            </button>

            <button onClick={() => scrollToSection("lab")}>
              AI Lab
            </button>

            <button onClick={() => scrollToSection("projects")}>
              Projects
            </button>

            <button onClick={() => scrollToSection("github")}>
              GitHub
            </button>

            <button onClick={() => scrollToSection("contact")}>
              Contact
            </button>
          </div>

          <button
            className="nav-ai-button"
            onClick={() => setChatOpen(true)}
          >
            <Sparkles size={14} />
            Talk to Ritesh AI
          </button>
        </div>
      </nav>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="main-content">
        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="hero" id="home">
          <div className="hero-grid" />

          <div className="hero-content">
            <div className="status-pill">
              <span className="status-dot" />
              AVAILABLE FOR BUILDING
            </div>

            <p className="eyebrow">
              AI × CYBERSECURITY × FULL-STACK
            </p>

            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              RITESH<span>.AI</span>
            </motion.h1>

            <p className="hero-subtitle">
              AI Engineer • Cybersecurity Developer • Full-Stack Builder
            </p>

          <p className="hero-description">
            I build intelligent products at the intersection of
            artificial intelligence, cybersecurity and full-stack
            engineering.
          </p>

          <div className="hero-actions">
            <button
              className="primary-button"
              onClick={() => scrollToSection("projects")}
            >
              Explore my work
              <ArrowUpRight size={15} />
            </button>

            <button
              className="secondary-button"
              onClick={() => setChatOpen(true)}
            >
              <BrainCircuit size={15} />
              Ask my AI
            </button>

            <a
              href={RESUME_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="resume-button"
              title="View / Download Resume (PDF)"
            >
              <FileText size={15} />
              Resume
              <Download size={13} />
            </a>
          </div>

          <div className="social-row">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              GH
            </a>

            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              in
            </a>

            <a
              href={EMAIL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Mail size={13} />
              Email
            </a>
          </div>
        </div>

        {/* AI CORE */}

        <div className="hero-ai-visual">
          <div className="ai-grid-circle" />

          <div className="ai-orbit orbit-one" />
          <div className="ai-orbit orbit-two" />
          <div className="ai-orbit orbit-three" />

          {neuralNodes.map((node) => (
            <span
              key={node.id}
              className="neural-node"
              style={{
                left: node.left,
                top: node.top,
              }}
            />
          ))}

          <motion.div
            className="ai-core"
            animate={{
              scale: [1, 1.025, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <BrainCircuit size={42} strokeWidth={1.4} />

            <span>AI</span>
          </motion.div>

          <div className="core-label">
            <span>RITESH.AI</span>
            <small>ARTIFICIAL INTELLIGENCE CORE</small>
          </div>
        </div>

        <button
          className="scroll-indicator"
          onClick={() => scrollToSection("about")}
        >
          SCROLL TO EXPLORE
          <ArrowDown size={12} />
        </button>
      </section>

      {/* =====================================================
          ABOUT
      ===================================================== */}

      <section className="section about-section" id="about">
        <div className="section-heading">
          <span>01 / ABOUT</span>

          <h2>More than code.</h2>

          <p>
            Building useful intelligence, not just demos.
          </p>
        </div>

        <div className="about-grid">
          <div className="about-text">
            <p className="large-copy">
              I'm Ritesh — an AI Engineer and Cybersecurity
              Developer focused on building practical intelligent
              systems.
            </p>

            <p>
              My work combines AI, cybersecurity and full-stack
              development to solve real-world problems. I enjoy
              taking an idea from a rough concept to a working
              product.
            </p>

            <div className="about-highlights">
              <div>
                <Code2 size={19} />
                <span>FULL-STACK</span>
              </div>

              <div>
                <ShieldCheck size={19} />
                <span>CYBERSECURITY</span>
              </div>

              <div>
                <BrainCircuit size={19} />
                <span>AI SYSTEMS</span>
              </div>
            </div>
          </div>

          <div className="terminal-card">
            <div className="terminal-top">
              <span />
              <span />
              <span />
            </div>

            <div className="terminal-body">
              <p>$ whoami</p>
              <strong>RITESH_CHAUDHARI</strong>

              <p>$ role</p>
              <strong>
                AI_ENGINEER
                <br />
                CYBERSECURITY_BUILDER
                <br />
                FULL_STACK_DEVELOPER
              </strong>

              <p>$ currently_building</p>
              <strong>
                intelligent_security
                <br />
                systems
              </strong>

              <p>$ status</p>
              <strong>BUILDING..._</strong>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          <div>
            <strong>AI</strong>
            <span>INTELLIGENT SYSTEMS</span>
          </div>

          <div>
            <strong>CYBER</strong>
            <span>SECURITY FIRST</span>
          </div>

          <div>
            <strong>BUILD</strong>
            <span>FROM IDEA TO PRODUCT</span>
          </div>

          <div>
            <strong>∞</strong>
            <span>ALWAYS LEARNING</span>
          </div>
        </div>
      </section>

      {/* =====================================================
          AI LAB
      ===================================================== */}

      <section
        className="section dark-section"
        id="lab"
      >
        <div className="section-heading light-heading">
          <span>02 / AI LAB</span>

          <h2>Where intelligence gets built.</h2>

          <p>
            Experiments, systems and ideas around applied AI.
          </p>
        </div>

        <div className="lab-grid">
          <div className="lab-main-card">
            <div className="lab-icon">
              <BrainCircuit size={23} />
            </div>

            <span className="lab-label">
              CURRENT FOCUS
            </span>

            <h3>Applied AI Systems</h3>

            <p>
              Building systems that combine LLMs, semantic
              intelligence, retrieval and backend engineering
              to solve practical problems.
            </p>

            <div className="lab-tags">
              <span>LLM</span>
              <span>RAG</span>
              <span>SEMANTIC AI</span>
              <span>FASTAPI</span>
              <span>PYTHON</span>
            </div>
          </div>

          <div className="lab-side-card">
            <Cpu size={24} />

            <span>MODELS</span>

            <p>
              Designing AI pipelines that turn raw information
              into useful decisions.
            </p>
          </div>

          <div className="lab-side-card">
            <Zap size={24} />

            <span>AUTOMATION</span>

            <p>
              Exploring intelligent workflows, agents and
              automated analysis.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          PROJECTS
      ===================================================== */}

      <section className="section projects-section" id="projects">
        <div className="section-heading">
          <span>03 / CASE STUDY SHOWCASE</span>

          <h2>Engineering Case Studies.</h2>

          <p>
            Flagship cyber defense platform & AI systems built from core architecture to working code.
          </p>
        </div>

        {/* FLAGSHIP CASE STUDY: SATRK */}

        <div className="flagship-case-study">
          {/* TOP HEADER */}
          <div className="case-study-top">
            <div className="case-study-identity">
              <div className="case-study-badges">
                <span className="badge-flagship">01 / FLAGSHIP PROJECT</span>
                <span className="badge-sih">SIH 2026</span>
              </div>

              <h3>SATRK</h3>

              <span className="case-study-tagline">"One step ahead of every scam."</span>
              <p className="case-study-subtitle">
                AI-Based Early Detection of Digital Arrest & Authority Impersonation Scams
              </p>
            </div>

            <div className="case-study-status-pill">
              <span className="status-dot" />
              <span>ACTIVE PROTOTYPE</span>
            </div>
          </div>

          {/* PROBLEM VS SOLUTION GRID */}
          <div className="case-study-grid">
            <div className="case-study-card problem-card">
              <div className="card-header">
                <AlertTriangle size={18} className="card-icon alert-icon" />
                <h4>The Real-World Problem</h4>
              </div>
              <p>
                Telecommunication and financial scams across India (such as digital arrest virtual isolation, police/CBI/Supreme Court impersonation, TRAI SIM disconnection threats, FedEx drug seizure intimidation, and UPI/KYC pressure tactics) exploit urgency and fear. Attackers leverage code-switched multilingual callers and AI voice cloning to bypass traditional spam filters.
              </p>
              <div className="problem-pills">
                <span>Digital Arrest</span>
                <span>CBI Impersonation</span>
                <span>TRAI SIM Threat</span>
                <span>Customs Drug Seizure</span>
                <span>AI Voice Cloning</span>
                <span>Multilingual Callers</span>
              </div>
            </div>

            <div className="case-study-card solution-card">
              <div className="card-header">
                <ShieldCheck size={18} className="card-icon shield-icon" />
                <h4>The Cyber Defense Platform</h4>
              </div>
              <p>
                SATRK is an end-to-end cyber defense system that monitors active call states on Android, streams PCM audio over WebSockets during active calls, converts Indian speech to English text, executes real-time dual scam reasoning (Rule Engine + Groq LLM), performs voice deepfake verification, and delivers structured risk verdicts with defensive advice to a live dashboard.
              </p>
              <div className="solution-pills">
                <span>Call Monitoring</span>
                <span>PCM WebSockets</span>
                <span>Groq Whisper STT</span>
                <span>Dual AI Reasoning</span>
                <span>Resemble AI Deepfake</span>
                <span>Safe Browsing Links</span>
              </div>
            </div>
          </div>

          {/* VISUAL ARCHITECTURE PIPELINE */}
          <div className="architecture-container">
            <div className="architecture-header">
              <Layers size={16} />
              <span>SYSTEM ARCHITECTURE & PIPELINE FLOW</span>
            </div>

            <div className="architecture-flow">
              <div className="arch-node">
                <Smartphone size={20} className="node-icon" />
                <strong>Android App</strong>
                <span>TelephonyManager / AudioRecord</span>
              </div>

              <div className="arch-arrow">
                <span>PCM Audio</span>
                <div className="arrow-line" />
              </div>

              <div className="arch-node">
                <Radio size={20} className="node-icon" />
                <strong>FastAPI WebSockets</strong>
                <span>Asynchronous Audio Router</span>
              </div>

              <div className="arch-arrow">
                <span>Live Audio Stream</span>
                <div className="arrow-line" />
              </div>

              <div className="arch-node active-node">
                <Mic size={20} className="node-icon" />
                <strong>Groq Whisper STT</strong>
                <span>Hindi / Marathi / Gujarati / Hinglish</span>
              </div>

              <div className="arch-arrow">
                <span>English Text</span>
                <div className="arrow-line" />
              </div>

              <div className="arch-node active-node">
                <BrainCircuit size={20} className="node-icon" />
                <strong>Dual AI Engines</strong>
                <span>Rule Engine + Groq LLM + Resemble AI</span>
              </div>

              <div className="arch-arrow">
                <span>Threat Verdict</span>
                <div className="arrow-line" />
              </div>

              <div className="arch-node">
                <Server size={20} className="node-icon" />
                <strong>Dashboard UI</strong>
                <span>Unified Event Stream</span>
              </div>
            </div>
          </div>

          {/* AI / ML COMPONENTS GRID */}
          <div className="components-heading">
            <Cpu size={16} />
            <span>AI / ML CORE ENGINE COMPONENTS</span>
          </div>

          <div className="components-grid">
            <div className="component-card">
              <div className="comp-top">
                <Mic size={18} className="comp-icon" />
                <h5>Multilingual STT</h5>
              </div>
              <p>
                Groq Whisper (<code>whisper-large-v3</code>) translates Indian speech (Hindi, Marathi, Gujarati, Hinglish) into English with RMS silence filtering and repetition loop post-processing.
              </p>
            </div>

            <div className="component-card">
              <div className="comp-top">
                <BrainCircuit size={18} className="comp-icon" />
                <h5>Scam Reasoning Engine</h5>
              </div>
              <p>
                Prompt-engineered LLM contextual analysis for Indian scam typologies, producing SAFE, WARNING, or SCAM verdicts with risk percentages and defensive guidance.
              </p>
            </div>

            <div className="component-card">
              <div className="comp-top">
                <Zap size={18} className="comp-icon" />
                <h5>Deterministic Rule Engine</h5>
              </div>
              <p>
                Regex and keyword signal extraction providing low-latency baseline threat detection and instant signal scoring.
              </p>
            </div>

            <div className="component-card">
              <div className="comp-top">
                <Radio size={18} className="comp-icon" />
                <h5>Voice Deepfake Detection</h5>
              </div>
              <p>
                Voice authenticity analysis powered by Resemble AI API activated when threat threshold reaches &ge; 50%, boosting risk score by +10% on clone signals.
              </p>
            </div>

            <div className="component-card">
              <div className="comp-top">
                <Search size={18} className="comp-icon" />
                <h5>Malicious Link Scanner</h5>
              </div>
              <p>
                Scans SMS/chat URLs using Google Safe Browsing API v4 across malware, social engineering, and unwanted application threat categories.
              </p>
            </div>

            <div className="component-card">
              <div className="comp-top">
                <RefreshCw size={18} className="comp-icon" />
                <h5>Adaptive Feedback Loop</h5>
              </div>
              <p>
                Human-in-the-loop Yes/No alert confirmation mechanism logged to continuously refine rule weights and prompt calibration.
              </p>
            </div>
          </div>

          {/* EXPANDABLE CASE STUDY DETAILS */}
          {satrkExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="case-study-expanded-content"
            >
              {/* TECH MATRIX */}
              <div className="expanded-section">
                <div className="section-title">
                  <Code2 size={16} />
                  <span>TECHNICAL IMPLEMENTATION MATRIX</span>
                </div>

                <div className="tech-matrix-grid">
                  <div className="matrix-column">
                    <h6>Frontend</h6>
                    <ul>
                      <li>React 18</li>
                      <li>TypeScript</li>
                      <li>Vite</li>
                      <li>Tailwind CSS</li>
                      <li>Lucide Icons</li>
                      <li>WebSocket API</li>
                    </ul>
                  </div>

                  <div className="matrix-column">
                    <h6>Backend</h6>
                    <ul>
                      <li>Python 3.12</li>
                      <li>FastAPI</li>
                      <li>Uvicorn</li>
                      <li>Pydantic v2</li>
                      <li>httpx &amp; asyncio</li>
                      <li>SentenceTransformers</li>
                    </ul>
                  </div>

                  <div className="matrix-column">
                    <h6>Android</h6>
                    <ul>
                      <li>Kotlin</li>
                      <li>Android SDK (API 26+)</li>
                      <li>TelephonyManager</li>
                      <li>AudioRecord</li>
                      <li>OkHttp WebSockets</li>
                    </ul>
                  </div>

                  <div className="matrix-column">
                    <h6>AI &amp; APIs</h6>
                    <ul>
                      <li>Groq Async SDK</li>
                      <li>whisper-large-v3</li>
                      <li>Groq LLM Engine</li>
                      <li>Resemble AI API</li>
                      <li>Google Safe Browsing v4</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* MY ROLE & CONTRIBUTIONS */}
              <div className="expanded-section">
                <div className="section-title">
                  <UserCheck size={16} />
                  <span>LEAD AI ENGINEER &amp; SYSTEM ARCHITECT ROLE</span>
                </div>

                <div className="role-card">
                  <p>
                    As the Lead AI Engineer and System Architect for SATRK, Ritesh Chaudhari designed and developed:
                  </p>
                  <ul>
                    <li>
                      <strong>WebSocket PCM Pipeline:</strong> Built the low-latency asynchronous PCM audio streaming pipeline between Android and FastAPI.
                    </li>
                    <li>
                      <strong>STT &amp; Filtering:</strong> Integrated Groq Whisper (<code>whisper-large-v3</code>) speech translation with RMS silence threshold filtering and repetitive-token removal.
                    </li>
                    <li>
                      <strong>Dual Scam Engines:</strong> Developed the hybrid threat classification architecture combining regex/keyword Rule Engine with Groq LLM contextual reasoning.
                    </li>
                    <li>
                      <strong>Voice Deepfake &amp; Link Security:</strong> Integrated Resemble AI voice clone detection and Google Safe Browsing API v4 url scanning.
                    </li>
                  </ul>
                </div>
              </div>

              {/* ENGINEERING CHALLENGES */}
              <div className="expanded-section">
                <div className="section-title">
                  <AlertTriangle size={16} />
                  <span>REAL-WORLD ENGINEERING CHALLENGES SOLVED</span>
                </div>

                <div className="challenges-grid">
                  <div className="challenge-item">
                    <h6>1. Android VOICE_CALL Recording Restrictions</h6>
                    <p>
                      <strong>Challenge:</strong> Modern Android APIs restrict raw <code>VOICE_CALL</code> audio capture.
                      <br />
                      <strong>Solution:</strong> Utilized <code>TelephonyManager</code> to detect call state transitions (<code>CALL_STATE_OFFHOOK</code>) and streamed microphone PCM audio via <code>AudioRecord</code> strictly while calls are active.
                    </p>
                  </div>

                  <div className="challenge-item">
                    <h6>2. Whisper STT Hallucination &amp; Repetition Loops</h6>
                    <p>
                      <strong>Challenge:</strong> Silent intervals during call audio cause STT models to loop hallucinated phrases.
                      <br />
                      <strong>Solution:</strong> Implemented pre-STT RMS silence filtering and post-STT regex repetitive-token cleaning.
                    </p>
                  </div>

                  <div className="challenge-item">
                    <h6>3. Upstream API Stalls during Live Calls</h6>
                    <p>
                      <strong>Challenge:</strong> Third-party API delays could paralyze real-time call alerts.
                      <br />
                      <strong>Solution:</strong> Architected parallel execution using <code>asyncio.gather</code> with strict 3.5s timeouts and graceful fallback to the Rule Engine.
                    </p>
                  </div>

                  <div className="challenge-item">
                    <h6>4. Code-switched Multilingual Indian Speech</h6>
                    <p>
                      <strong>Challenge:</strong> Scammers seamlessly mix Hindi, Marathi, Gujarati, and Hinglish during calls.
                      <br />
                      <strong>Solution:</strong> Configured Groq Whisper translation parameters to directly transcribe multi-dialect speech into structured English scam context.
                    </p>
                  </div>

                  <div className="challenge-item">
                    <h6>5. User Privacy &amp; Security Boundaries</h6>
                    <p>
                      <strong>Challenge:</strong> Processing call audio raises significant privacy concerns.
                      <br />
                      <strong>Solution:</strong> Streams audio ephemerally over encrypted WebSockets only during active calls without persistent raw audio recording.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* CASE STUDY ACTIONS */}
          <div className="case-study-actions">
            <button
              className="btn-toggle-case-study"
              onClick={() => setSatrkExpanded(!satrkExpanded)}
            >
              {satrkExpanded ? (
                <>
                  SHOW LESS <ChevronUp size={14} />
                </>
              ) : (
                <>
                  EXPAND FULL CASE STUDY <ChevronDown size={14} />
                </>
              )}
            </button>

            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-github-case-study"
            >
              <GitBranch size={14} />
              GITHUB REPOSITORY
              <ArrowUpRight size={13} />
            </a>

            <button
              className="btn-ask-ai-case-study"
              onClick={() => {
                setChatOpen(true);
                setInput("Tell me about SATRK architecture and Ritesh's role");
              }}
            >
              <Sparkles size={14} />
              ASK RITESH AI ABOUT SATRK
            </button>
          </div>
        </div>

        {/* SECONDARY PROJECTS */}

        <div className="secondary-projects-heading">
          <h4>Other Selected Projects</h4>
        </div>

        <div className="secondary-projects-grid">
          <div className="secondary-project-card">
            <div className="sec-card-top">
              <span className="sec-project-num">02 / PERSONAL AI</span>
              <h5>RITESH.AI</h5>
            </div>

            <p className="sec-project-desc">
              An AI-powered personal portfolio and assistant combining a React/TypeScript frontend with a FastAPI backend, SentenceTransformers dense RAG vector search, and Groq LLM integration.
            </p>

            <div className="sec-project-tags">
              <span>REACT 19</span>
              <span>TYPESCRIPT</span>
              <span>FASTAPI</span>
              <span>RAG</span>
              <span>GROQ LLM</span>
            </div>

            <div className="sec-card-footer">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="sec-link"
              >
                <span>GITHUB REPO</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          <div className="secondary-project-card">
            <div className="sec-card-top">
              <span className="sec-project-num">03 / EXPERIMENTAL AI</span>
              <h5>AI LAB</h5>
            </div>

            <p className="sec-project-desc">
              A collection of experimental sandboxes exploring intelligent automation, LLM workflows, prompt injection security testing, and developer tooling.
            </p>

            <div className="sec-project-tags">
              <span>PYTHON</span>
              <span>LLM AGENTS</span>
              <span>SECURITY TESTING</span>
              <span>AUTOMATION</span>
            </div>

            <div className="sec-card-footer">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="sec-link"
              >
                <span>GITHUB REPO</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          SKILLS
      ===================================================== */}

      <section
        className="section skills-section"
        id="skills"
      >
        <div className="section-heading">
          <span>04 / CAPABILITIES</span>

          <h2>Built across layers.</h2>

          <p>
            From intelligent models to production interfaces.
          </p>
        </div>

        <div className="skills-grid">
          <div>
            <BrainCircuit size={23} />

            <h3>Artificial Intelligence</h3>

            <p>
              LLMs, RAG, semantic analysis, prompt engineering
              and AI-powered decision systems.
            </p>
          </div>

          <div>
            <ShieldCheck size={23} />

            <h3>Cybersecurity</h3>

            <p>
              Scam detection, threat intelligence, phishing
              analysis and security-focused application design.
            </p>
          </div>

          <div>
            <Code2 size={23} />

            <h3>Development</h3>

            <p>
              Python, React, TypeScript, FastAPI and modern
              full-stack application development.
            </p>
          </div>

          <div>
            <Terminal size={23} />

            <h3>Engineering</h3>

            <p>
              APIs, Git, databases, system thinking and
              turning prototypes into usable products.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          GITHUB ACTIVITY
      ===================================================== */}

      <section
        className="section github-section"
        id="github"
      >
        <div className="section-heading">
          <span>05 / GITHUB ACTIVITY</span>

          <h2>Built in public.</h2>

          <p>
            Real public GitHub data, loaded directly from GitHub.
          </p>
        </div>

        {githubLoading ? (
          <div className="github-loading">
            <div className="github-spinner" />

            <span>
              CONNECTING TO GITHUB...
            </span>
          </div>
        ) : githubError ? (
          <div className="github-error">
            <Activity size={28} />

            <p>{githubError}</p>

            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              OPEN GITHUB
              <ExternalLink size={13} />
            </a>
          </div>
        ) : githubProfile ? (
          <>
            {/* PROFILE + STATS */}

            <div className="github-overview">
              <div className="github-profile-card">
                <div className="github-profile-top">
                  <img
                    src={githubProfile.avatar_url}
                    alt="Ritesh GitHub avatar"
                    className="github-avatar"
                  />

                  <div>
                    <span>GITHUB PROFILE</span>

                    <h3>
                      {githubProfile.name ||
                        githubProfile.login}
                    </h3>
                  </div>
                </div>

                <a
                  className="github-profile-link"
                  href={githubProfile.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  VIEW PROFILE
                  <ExternalLink size={12} />
                </a>
              </div>

              <div className="github-stat">
                <strong>
                  {githubProfile.public_repos}
                </strong>

                <span>PUBLIC REPOS</span>
              </div>

              <div className="github-stat">
                <strong>
                  {githubProfile.followers}
                </strong>

                <span>FOLLOWERS</span>
              </div>

              <div className="github-stat">
                <strong>{totalStars}</strong>

                <span>VISIBLE STARS</span>
              </div>

              <div className="github-stat">
                <strong>{totalForks}</strong>

                <span>TOTAL FORKS</span>
              </div>
            </div>

            {/* REPOS + ACTIVITY */}

            <div className="github-content-grid">
              <div className="github-repos">
                <div className="github-block-heading">
                  <div>
                    <span>RECENTLY UPDATED</span>
                    <h3>Repositories</h3>
                  </div>

                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ALL REPOS
                    <ArrowUpRight size={12} />
                  </a>
                </div>

                <div className="repo-list">
                  {githubRepos.length > 0 ? (
                    githubRepos.map((repo) => (
                      <a
                        key={repo.id}
                        className="repo-card"
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <div className="repo-card-top">
                          <GitBranch size={15} />
                          <ExternalLink size={12} />
                        </div>

                        <h4>{repo.name}</h4>

                        <p>
                          {repo.description ||
                            "No description provided."}
                        </p>

                        <div className="repo-meta">
                          {repo.language && (
                            <span>
                              <i className="language-dot" />
                              {repo.language}
                            </span>
                          )}

                          <span>
                            <Star size={10} />
                            {repo.stargazers_count}
                          </span>

                          <span>
                            <GitBranch size={10} />
                            {repo.forks_count}
                          </span>
                        </div>
                      </a>
                    ))
                  ) : (
                    <div className="no-events">
                      No public repositories found.
                    </div>
                  )}
                </div>
              </div>

              <div className="github-events">
                <div className="github-block-heading">
                  <div>
                    <span>PUBLIC ACTIVITY</span>
                    <h3>Recent Activity</h3>
                  </div>

                  <Activity size={16} />
                </div>

                {githubEvents.length > 0 ? (
                  <div className="event-list">
                    {githubEvents.map((event) => (
                      <div
                        className="event-item"
                        key={event.id}
                      >
                        <div className="event-icon">
                          <Activity size={13} />
                        </div>

                        <div>
                          <strong>
                            {getEventText(event)}
                          </strong>

                          <p>{event.repo.name}</p>

                          <small>
                            {formatRelativeTime(
                              event.created_at
                            )}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-events">
                    No recent public activity available.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </section>

      {/* =====================================================
          CONTACT
      ===================================================== */}

      <section className="section contact-section" id="contact">
        <div className="contact-card">
          <div>
            <span>06 / LET'S CONNECT</span>

            <h2>
              Have an idea or opportunity?
              <br />
              Let's build it together.
            </h2>

            <p>
              I'm open to full-time roles, cybersecurity threat defense projects, and building ambitious AI products. Feel free to send an email, reach out on LinkedIn, or ask Ritesh AI.
            </p>
          </div>

          <div className="contact-actions">
            <a
              href={EMAIL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary-contact"
              aria-label="Start a conversation via Gmail"
            >
              <Mail size={15} />
              Start a conversation
            </a>

            <button
              className="btn-ai-contact"
              onClick={() => setChatOpen(true)}
              aria-label="Ask Ritesh AI assistant"
            >
              <BrainCircuit size={15} />
              Ask Ritesh AI
            </button>

            <div className="contact-links">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Profile"
              >
                GitHub
              </a>

              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn Profile"
              >
                LinkedIn
              </a>

              <a
                href={RESUME_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View Resume PDF"
              >
                Resume (PDF)
              </a>
            </div>
          </div>
        </div>
      </section>
      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer>
        <div className="footer-brand">
          RITESH<span className="brand-dot">.AI</span>
        </div>

        <div className="footer-tagline">
          AI ENGINEER • CYBERSECURITY DEVELOPER • FULL-STACK BUILDER
        </div>

        <div className="footer-right">
          <div className="footer-links">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Profile"
            >
              GitHub
            </a>
            <span>•</span>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn Profile"
            >
              LinkedIn
            </a>
            <span>•</span>
            <a
              href={EMAIL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Send Email"
            >
              Email
            </a>
            <span>•</span>
            <a
              href={RESUME_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View Resume PDF"
            >
              Resume
            </a>
          </div>

          <span className="footer-copy">
            © {new Date().getFullYear()} Ritesh Chaudhari
          </span>
        </div>
      </footer>

      {/* =====================================================
          AI CHAT
      ===================================================== */}

      {chatOpen && (
        <div
          className="chat-overlay"
          onClick={() => setChatOpen(false)}
          role="presentation"
        >
          <motion.div
            className="chat-window"
            role="dialog"
            aria-modal="true"
            aria-label="Ritesh AI Assistant"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25 }}
            onClick={(event) => event.stopPropagation()}
          >
            {/* CHAT HEADER */}
            <div className="chat-header">
              <div className="chat-header-info">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div className="chat-ai-icon">
                    <BrainCircuit size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "14px", fontWeight: 700 }}>Ritesh AI</strong>
                    <div className="chat-header-subtitle">
                      <span className={`chat-status-dot ${healthOnline === false ? "offline" : ""}`} />
                      <span>{healthOnline === false ? "OFFLINE" : "ONLINE"}</span>
                      <span>•</span>
                      <span>PORTFOLIO AI</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <button
                  onClick={clearChat}
                  title="Clear conversation"
                  aria-label="Clear conversation"
                >
                  <RotateCcw size={15} />
                </button>

                <button
                  onClick={() => setChatOpen(false)}
                  aria-label="Close AI assistant"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* CHAT MESSAGES BODY */}
            <div className="chat-messages" ref={chatContainerRef}>
              {/* WELCOME BANNER & SUGGESTIONS */}
              {messages.length <= 1 && (
                <>
                  <div className="chat-welcome-card">
                    <div className="chat-welcome-icon">
                      <BrainCircuit size={22} />
                    </div>
                    <h4>Hi, I'm Ritesh AI.</h4>
                    <p>
                      Ask me about Ritesh, his projects, AI work, cybersecurity journey, or SATRK.
                    </p>
                    <div className="chat-grounded-badge">
                      <ShieldCheck size={12} />
                      <span>Grounded in Ritesh's portfolio knowledge</span>
                    </div>
                  </div>

                  <div className="chat-suggestions-container">
                    <div className="chat-suggestions-label">Suggested Questions</div>
                    <div className="chat-suggestions-grid">
                      {SUGGESTED_QUESTIONS.map((question, index) => (
                        <button
                          key={index}
                          className="chat-chip"
                          onClick={() => sendMessage(question)}
                          aria-label={`Ask suggested question: ${question}`}
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* MESSAGES LIST */}
              {messages.map((message, index) => (
                <div key={index} className="chat-message-wrapper">
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`chat-message ${
                      message.role === "ai" ? "ai-message" : "user-message"
                    }`}
                  >
                    {message.role === "ai"
                      ? renderFormattedText(message.text)
                      : message.text}
                  </motion.div>

                  {/* AI MESSAGE ACTIONS (Copy) */}
                  {message.role === "ai" && index > 0 && (
                    <div className="chat-message-actions">
                      <button
                        className="chat-copy-button"
                        onClick={() => handleCopyResponse(message.text, index)}
                        aria-label="Copy response"
                        title="Copy AI response"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check size={11} style={{ color: "#22c55e" }} />
                            <span style={{ color: "#22c55e" }}>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={11} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* RETRY BUTTON FOR FAILED REQUEST */}
              {lastFailedMessage && !chatLoading && (
                <div style={{ alignSelf: "center", margin: "4px 0" }}>
                  <button
                    className="chat-retry-button"
                    onClick={() => sendMessage(lastFailedMessage)}
                    aria-label="Retry failed message"
                  >
                    <RefreshCw size={11} />
                    <span>Retry last question</span>
                  </button>
                </div>
              )}

              {/* THINKING LOADING INDICATOR */}
              {chatLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="chat-thinking"
                >
                  <BrainCircuit size={14} style={{ color: "var(--lavender)" }} />
                  <span>Ritesh AI is thinking</span>
                  <div className="chat-thinking-dots">
                    <span className="chat-thinking-dot" />
                    <span className="chat-thinking-dot" />
                    <span className="chat-thinking-dot" />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* CHAT INPUT AREA */}
            <div className="chat-input">
              <div className="chat-input-row">
                <textarea
                  ref={chatInputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder={
                    chatLoading ? "Ritesh AI is thinking..." : "Ask something about Ritesh..."
                  }
                  disabled={chatLoading}
                  aria-label="Ask a question"
                  maxLength={500}
                  rows={1}
                />

                <button
                  onClick={() => sendMessage()}
                  disabled={chatLoading || !input.trim() || input.length > 500}
                  aria-label="Send message"
                  title="Send message"
                >
                  <Send size={15} />
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "9px", color: "var(--muted)" }}>
                  Enter to send, Shift+Enter for new line
                </span>
                <span className={`chat-char-counter ${input.length > 450 ? "error" : ""}`}>
                  {input.length} / 500
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default App;