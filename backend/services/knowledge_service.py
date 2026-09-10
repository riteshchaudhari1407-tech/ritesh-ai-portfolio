import json
import re
from pathlib import Path
from typing import Any, Dict, List


class KnowledgeBlock:
    def __init__(self, block_id: str, title: str, content: str, intent_phrases: List[str], keywords: List[str]):
        self.block_id = block_id
        self.title = title
        self.content = content
        self.intent_phrases = [p.lower() for p in intent_phrases]
        self.keywords = set(k.lower() for k in keywords)

    def calculate_relevance(self, query_str: str, query_words: set[str]) -> float:
        score = 0.0

        # 1. Exact phrase match (+4.0 points per phrase)
        for phrase in self.intent_phrases:
            if phrase in query_str:
                score += 4.0

        # 2. Intent Keyword match (+2.0 points per keyword)
        for kw in self.keywords:
            if kw in query_words or (len(kw) > 3 and kw in query_str):
                score += 2.0

        # 3. Text content word overlap (+0.5 points per matching word)
        content_words = set(re.findall(r"\w+", self.content.lower()))
        matching_words = query_words.intersection(content_words)
        score += len(matching_words) * 0.5

        return score


class KnowledgeService:
    def __init__(self, knowledge_dir: Path | None = None):
        if knowledge_dir is None:
            knowledge_dir = Path(__file__).parent.parent / "knowledge"

        self.knowledge_dir = knowledge_dir
        self.profile: Dict[str, Any] = {}
        self.projects: Dict[str, Any] = {}
        self.skills: Dict[str, Any] = {}
        self.education: Dict[str, Any] = {}
        self.blocks: List[KnowledgeBlock] = []
        self.load_knowledge()

    def _load_json(self, filename: str) -> Dict[str, Any]:
        file_path = self.knowledge_dir / filename
        if not file_path.exists():
            return {}
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {filename}: {e}")
            return {}

    def load_knowledge(self) -> None:
        self.profile = self._load_json("profile.json")
        self.projects = self._load_json("projects.json")
        self.skills = self._load_json("skills.json")
        self.education = self._load_json("education.json")
        self._build_knowledge_blocks()

    def _build_knowledge_blocks(self) -> None:
        self.blocks = []

        # Block 1: Profile & Bio
        if self.profile:
            p_content = (
                f"Name: {self.profile.get('name')}\n"
                f"Role: {self.profile.get('role')}\n"
                f"Bio: {self.profile.get('bio')}\n"
                f"Status: {self.profile.get('status')}\n"
                f"Contact: {json.dumps(self.profile.get('contact', {}))}"
            )
            self.blocks.append(
                KnowledgeBlock(
                    block_id="profile",
                    title="PROFILE & IDENTITY",
                    content=p_content,
                    intent_phrases=["who is", "about ritesh", "who are you", "what does he do", "contact", "email", "reach"],
                    keywords=["ritesh", "chaudhari", "bio", "role", "contact", "email", "github", "linkedin", "engineer", "developer", "builder"],
                )
            )

        # Block 2: Flagship SATRK Project & Current Building
        if self.projects:
            flagship = self.projects.get("flagship", {})
            f_content = (
                f"Project: {flagship.get('name')} (Flagship)\n"
                f"Type: {flagship.get('type')}\n"
                f"Description: {flagship.get('description')}\n"
                f"Pipeline: {flagship.get('pipeline')}\n"
                f"Goal: {flagship.get('goal')}\n"
                f"Technologies: {', '.join(flagship.get('technologies', []))}"
            )
            self.blocks.append(
                KnowledgeBlock(
                    block_id="satrk",
                    title="FLAGSHIP PROJECT: SATRK",
                    content=f_content,
                    intent_phrases=["satrk", "digital arrest", "scam intelligence", "scam", "currently building", "building", "what is he building"],
                    keywords=["satrk", "scam", "digital", "arrest", "phishing", "kyc", "otp", "fraud", "verdict", "pipeline", "assess", "confidence", "flagship", "building"],
                )
            )

            # Block 3: Secondary Projects
            secondaries = self.projects.get("secondary_projects", [])
            sec_lines = [
                f"- {p.get('name')} ({p.get('type')}): {p.get('description')} [Tech: {', '.join(p.get('technologies', []))}]"
                for p in secondaries
            ]
            self.blocks.append(
                KnowledgeBlock(
                    block_id="secondary_projects",
                    title="OTHER PROJECTS & AI LAB",
                    content="\n".join(sec_lines),
                    intent_phrases=["projects", "ritesh.ai", "ai lab", "other projects", "what projects"],
                    keywords=["project", "projects", "portfolio", "ritesh.ai", "lab", "experiments", "automation"],
                )
            )

        # Block 4: AI & ML Skills
        if self.skills:
            cats = self.skills.get("categories", [])
            for cat in cats:
                c_name = cat.get("name", "")
                c_items = ", ".join(cat.get("items", []))
                b_id = f"skill_{c_name.lower().replace(' ', '_')}"
                phrases = ["skills", "technologies", "tech stack", c_name.lower()]
                if "cybersecurity" in c_name.lower():
                    phrases.extend(["cybersecurity work", "security work", "cyber security"])

                self.blocks.append(
                    KnowledgeBlock(
                        block_id=b_id,
                        title=f"SKILLS: {c_name.upper()}",
                        content=f"{c_name}: {c_items}",
                        intent_phrases=phrases,
                        keywords=re.findall(r"\w+", f"{c_name} {c_items}".lower()),
                    )
                )

        # Block 5: Education & Focus
        if self.education:
            focus = ", ".join(self.education.get("focus_areas", []))
            e_content = (
                f"Focus Areas: {focus}\n"
                f"Learning Mindset: {self.education.get('learning_mindset')}"
            )
            self.blocks.append(
                KnowledgeBlock(
                    block_id="education",
                    title="EDUCATION & FOCUS",
                    content=e_content,
                    intent_phrases=["education", "degree", "learning", "focus", "currently learning", "study", "university", "college"],
                    keywords=["education", "focus", "learning", "mindset", "degree", "university", "college", "study", "academic"],
                )
            )

    def get_relevant_context(self, query: str, top_k: int = 3, min_score_threshold: float = 2.0) -> str:
        """Retrieves only top relevant knowledge blocks using weighted relevance scoring."""
        query_str = query.lower().strip()
        query_words = set(re.findall(r"\w+", query_str))

        if not query_words:
            return ""

        # Calculate scores for all blocks
        scored_blocks = []
        for block in self.blocks:
            score = block.calculate_relevance(query_str, query_words)
            if score >= min_score_threshold:
                scored_blocks.append((score, block))

        # Sort by relevance score descending
        scored_blocks.sort(key=lambda x: x[0], reverse=True)

        if not scored_blocks:
            return ""

        # Take top-K relevant blocks
        top_blocks = [block for _, block in scored_blocks[:top_k]]
        context_parts = [f"[{b.title}]\n{b.content}" for b in top_blocks]

        return "\n\n".join(context_parts)

    def get_fallback_response(self, query: str) -> str:
        """Determines accurate fallback response when LLM is unavailable."""
        text = query.lower().strip()

        if not text:
            return "Ask me something about Ritesh, his projects, skills or cybersecurity work."

        if any(word in text for word in ["who is ritesh", "about ritesh", "who are you", "who is", "name", "what does he do"]):
            name = self.profile.get("name", "Ritesh Chaudhari")
            role = self.profile.get("role", "AI Engineer, Cybersecurity Developer and Full-Stack Builder")
            return f"{name} is an {role} focused on creating practical intelligent systems."

        if any(word in text for word in ["satrk", "scam", "digital arrest", "threat", "phishing"]):
            flagship = self.projects.get("flagship", {})
            name = flagship.get("name", "SATRK")
            tagline = flagship.get("tagline", "One step ahead of every scam.")
            purpose = flagship.get(
                "purpose",
                "SATRK is an end-to-end cyber defense system built for SIH 2026 to help detect and respond to digital arrest and authority impersonation scams."
            )
            pipeline = flagship.get("core_pipeline", "Android App -> PCM Audio over WebSocket -> Groq Whisper STT -> Parallel Analysis (Rule Engine + Groq LLM + Resemble AI) -> Unified Event Stream")
            return f"{name} ('{tagline}'): {purpose}\n\nPipeline: {pipeline}"

        if any(word in text for word in ["skill", "skills", "technology", "technologies", "tech", "languages", "tools"]):
            categories = self.skills.get("categories", [])
            if categories:
                skill_summary = []
                for cat in categories:
                    items = ", ".join(cat.get("items", []))
                    skill_summary.append(f"{cat.get('name')}: {items}")
                return "Ritesh's technical skills include:\n" + "\n".join(skill_summary)
            return "Ritesh works with Python, Artificial Intelligence, LLMs, RAG, Semantic AI, FastAPI, React, TypeScript, and Cybersecurity."

        if any(word in text for word in ["portfolio", "ritesh.ai", "project", "projects"]):
            return (
                "Ritesh.AI is Ritesh Chaudhari's personal AI-powered portfolio. "
                "His flagship project is SATRK (an AI scam intelligence platform), "
                "along with AI Lab experiments."
            )

        if any(word in text for word in ["focus", "learning", "education", "currently"]):
            focus_list = self.education.get("focus_areas", [])
            focus_str = ", ".join(focus_list) if focus_list else "Applied AI, Cybersecurity, and Full-Stack Development"
            return f"Ritesh is currently focused on: {focus_str}."

        if any(word in text for word in ["contact", "email", "github", "linkedin", "hire"]):
            contact = self.profile.get("contact", {})
            email = contact.get("email", "riteshchaudhari6612@gmail.com")
            return f"You can connect with Ritesh via email at {email}, or through GitHub and LinkedIn links in this portfolio."

        return (
            "I am Ritesh AI. I can answer questions about Ritesh's AI engineering, "
            "cybersecurity projects (like SATRK), tech stack, skills, and portfolio."
        )


# Singleton instance
knowledge_service = KnowledgeService()
