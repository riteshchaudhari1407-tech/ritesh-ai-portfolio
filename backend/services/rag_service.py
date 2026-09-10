import hashlib
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Tuple


class RAGChunk:
    def __init__(self, chunk_id: str, source: str, category: str, title: str, content: str):
        self.chunk_id = chunk_id
        self.source = source
        self.category = category
        self.title = title
        self.content = content

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "source": self.source,
            "category": self.category,
            "title": self.title,
            "content": self.content,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "RAGChunk":
        return cls(
            chunk_id=data["chunk_id"],
            source=data["source"],
            category=data["category"],
            title=data["title"],
            content=data["content"],
        )


class RAGService:
    def __init__(self, backend_dir: Path | None = None):
        if backend_dir is None:
            backend_dir = Path(__file__).parent.parent

        self.backend_dir = backend_dir
        self.knowledge_dir = backend_dir / "knowledge"
        self.vector_store_dir = backend_dir / "vector_store"
        self.index_file = self.vector_store_dir / "index.json"

        self.chunks: List[RAGChunk] = []
        self.embeddings: List[List[float]] = []
        self._model = None
        self.is_initialized = False

    def _get_model(self):
        if self._model is None:
            from sentence_transformers import SentenceTransformer
            model_name = os.getenv("RAG_EMBEDDING_MODEL", "all-MiniLM-L6-v2")
            self._model = SentenceTransformer(model_name)
        return self._model

    def _compute_knowledge_hash(self) -> str:
        """Computes combined hash of all knowledge JSON files to detect data changes."""
        hasher = hashlib.md5()
        for filename in sorted(["profile.json", "projects.json", "skills.json", "education.json"]):
            file_path = self.knowledge_dir / filename
            if file_path.exists():
                hasher.update(file_path.read_bytes())
        return hasher.hexdigest()

    def _build_chunks(self) -> List[RAGChunk]:
        """Converts structured knowledge JSON files into 12 semantic chunks with metadata."""
        chunks = []

        # Helper to load JSON safely
        def load_j(name: str) -> Dict[str, Any]:
            p = self.knowledge_dir / name
            if p.exists():
                try:
                    with open(p, "r", encoding="utf-8") as f:
                        return json.load(f)
                except Exception:
                    pass
            return {}

        profile = load_j("profile.json")
        projects = load_j("projects.json")
        skills = load_j("skills.json")
        education = load_j("education.json")

        # 1. Profile Bio
        if profile:
            chunks.append(
                RAGChunk(
                    chunk_id="profile_bio",
                    source="profile.json",
                    category="profile",
                    title="Ritesh Chaudhari Profile & Bio",
                    content=(
                        f"Ritesh Chaudhari is an {profile.get('title', 'AI Engineer & Cybersecurity Developer')}. "
                        f"Role: {profile.get('role')}. "
                        f"Bio: {profile.get('bio')} "
                        f"Current Status: {profile.get('status')}."
                    ),
                )
            )
            # 2. Profile Contact
            contact = profile.get("contact", {})
            chunks.append(
                RAGChunk(
                    chunk_id="profile_contact",
                    source="profile.json",
                    category="profile",
                    title="Contact & Social Links",
                    content=(
                        f"Ritesh Chaudhari Contact Information: Email: {contact.get('email')}, "
                        f"GitHub: {contact.get('github')}, LinkedIn: {contact.get('linkedin')}. "
                        f"Available for building intelligent security systems."
                    ),
                )
            )

        # 3. SATRK Projects Chunks (SIH 2026 Source of Truth)
        if projects:
            flagship = projects.get("flagship", {})
            if flagship:
                # SATRK Overview & SIH 2026 Purpose
                chunks.append(
                    RAGChunk(
                        chunk_id="satrk_sih2026_overview",
                        source="projects.json",
                        category="projects",
                        title="Flagship Project: SATRK Overview & SIH 2026 Purpose",
                        content=(
                            f"SATRK ('{flagship.get('tagline', 'One step ahead of every scam.')}') is Ritesh Chaudhari's flagship cyber defense project for SIH 2026 (Smart India Hackathon). "
                            f"Purpose: {flagship.get('purpose')} "
                            f"Core Problems Targeted: {', '.join(flagship.get('problem_areas', []))}."
                        ),
                    )
                )
                # SATRK Pipeline & Audio Streaming
                chunks.append(
                    RAGChunk(
                        chunk_id="satrk_audio_pipeline",
                        source="projects.json",
                        category="projects",
                        title="SATRK Live Call Audio Pipeline & Android Monitoring",
                        content=(
                            f"SATRK Core Pipeline: {flagship.get('core_pipeline')} "
                            f"The Android app monitors active calls using TelephonyManager (CALL_STATE_OFFHOOK / CALL_STATE_IDLE) and streams PCM audio over WebSockets only during active calls."
                        ),
                    )
                )
                # SATRK Multilingual STT
                chunks.append(
                    RAGChunk(
                        chunk_id="satrk_multilingual_stt",
                        source="projects.json",
                        category="projects",
                        title="SATRK Multilingual STT & Speech Analysis (Hindi, Marathi, Gujarati, Hinglish)",
                        content=(
                            f"Multilingual Capability: {flagship.get('multilingual_capability')} "
                            f"Groq Whisper (whisper-large-v3) processes Indian speech (Hindi, Marathi, Gujarati, Hinglish) into structured English text with RMS silence filtering and hallucination post-filtering during live call audio analysis."
                        ),
                    )
                )
                # SATRK Scam Reasoning & Verdicts
                chunks.append(
                    RAGChunk(
                        chunk_id="satrk_scam_reasoning_verdicts",
                        source="projects.json",
                        category="projects",
                        title="SATRK Scam Reasoning & Verdicts (Rule Engine + Groq LLM)",
                        content=(
                            f"SATRK Scam Reasoning: {flagship.get('scam_reasoning')} "
                            f"Dual detection layers combine a deterministic Rule Engine and Groq LLM contextual reasoning to return SAFE, WARNING, or SCAM verdicts with risk score percentage, signals, and defensive advice."
                        ),
                    )
                )
                # SATRK Voice Deepfake Detection
                chunks.append(
                    RAGChunk(
                        chunk_id="satrk_voice_deepfake",
                        source="projects.json",
                        category="projects",
                        title="SATRK Voice Deepfake & Clone Detection (Resemble AI)",
                        content=(
                            f"Voice Deepfake Detection: {flagship.get('voice_deepfake_detection')} "
                            f"Resemble AI detection API activates when THREAT_THRESHOLD >= 50.0, adding possible_voice_clone signal and boosting risk score by +10%."
                        ),
                    )
                )
                # SATRK Malicious Link Scanner
                chunks.append(
                    RAGChunk(
                        chunk_id="satrk_malicious_link_scanner",
                        source="projects.json",
                        category="projects",
                        title="SATRK Malicious Link & SMS Scanner (Google Safe Browsing API v4)",
                        content=(
                            f"Malicious Link Scanning: {flagship.get('malicious_link_scanner')} "
                            f"Analyzes URLs from SMS/chat using Google Safe Browsing API v4 for MALWARE, SOCIAL_ENGINEERING, UNWANTED_SOFTWARE, and POTENTIALLY_HARMFUL_APPLICATION."
                        ),
                    )
                )
                # SATRK Performance & Feedback Loop
                chunks.append(
                    RAGChunk(
                        chunk_id="satrk_performance_feedback",
                        source="projects.json",
                        category="projects",
                        title="SATRK Asynchronous Architecture, Performance & Feedback Loop",
                        content=(
                            f"Performance Architecture: {flagship.get('performance_architecture')} "
                            f"Feedback Loop: {flagship.get('feedback_loop')} "
                            f"Designed as a low-latency asynchronous pipeline with parallel AI processing (asyncio.gather) and 3.5s timeouts with graceful degradation to Rule Engine."
                        ),
                    )
                )
                # SATRK Tech Stack & Modules
                t_stack = flagship.get("tech_stack", {})
                chunks.append(
                    RAGChunk(
                        chunk_id="satrk_tech_stack_modules",
                        source="projects.json",
                        category="projects",
                        title="SATRK Tech Stack & Repository Structure",
                        content=(
                            f"SATRK Tech Stack: Frontend ({', '.join(t_stack.get('frontend', []))}), "
                            f"Backend ({', '.join(t_stack.get('backend', []))}), "
                            f"Android ({', '.join(t_stack.get('android', []))}), "
                            f"AI/APIs ({', '.join(t_stack.get('ai_external_apis', []))})."
                        ),
                    )
                )
                # SATRK Ritesh's Role & Contributions
                if flagship.get("ritesh_role"):
                    chunks.append(
                        RAGChunk(
                            chunk_id="satrk_ritesh_role",
                            source="projects.json",
                            category="projects",
                            title="Ritesh Chaudhari's Role & Contributions in SATRK",
                            content=f"Ritesh Chaudhari's Contribution to SATRK: {flagship.get('ritesh_role')}",
                        )
                    )
                # SATRK Engineering Challenges Solved
                eng_challenges = flagship.get("engineering_challenges", [])
                if eng_challenges:
                    chunks.append(
                        RAGChunk(
                            chunk_id="satrk_engineering_challenges",
                            source="projects.json",
                            category="projects",
                            title="SATRK Engineering Challenges & Technical Solutions Solved by Ritesh",
                            content=f"Key Engineering Challenges Solved in SATRK: {' | '.join(eng_challenges)}",
                        )
                    )

            # Secondary Projects
            secondaries = projects.get("secondary_projects", [])
            for sec in secondaries:
                s_name = sec.get("name", "")
                chunks.append(
                    RAGChunk(
                        chunk_id=f"project_{s_name.lower().replace('.', '_').replace(' ', '_')}",
                        source="projects.json",
                        category="projects",
                        title=f"Project: {s_name}",
                        content=f"Ritesh Chaudhari Project: {s_name} ({sec.get('type')}): {sec.get('description')} Tech Stack: {', '.join(sec.get('technologies', []))}.",
                    )
                )

        # 7. Skills Categories
        if skills:
            cats = skills.get("categories", [])
            for cat in cats:
                c_name = cat.get("name", "")
                c_items = ", ".join(cat.get("items", []))
                chunks.append(
                    RAGChunk(
                        chunk_id=f"skills_{c_name.lower().replace(' ', '_')}",
                        source="skills.json",
                        category="skills",
                        title=f"Skills: {c_name}",
                        content=f"Ritesh's skills in {c_name}: {c_items}.",
                    )
                )

        # 8. Education & Focus
        if education:
            focus = ", ".join(education.get("focus_areas", []))
            chunks.append(
                RAGChunk(
                    chunk_id="education_focus",
                    source="education.json",
                    category="education",
                    title="Education & Learning Focus",
                    content=(
                        f"Ritesh's Educational Focus Areas: {focus}. "
                        f"Learning Mindset: {education.get('learning_mindset')}."
                    ),
                )
            )

        return chunks

    def initialize_index(self, force_rebuild: bool = False) -> None:
        """Initializes the vector index from cache or builds it if missing/outdated."""
        try:
            self.vector_store_dir.mkdir(parents=True, exist_ok=True)
            current_hash = self._compute_knowledge_hash()

            if not force_rebuild and self.index_file.exists():
                with open(self.index_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if data.get("hash") == current_hash and "chunks" in data and "embeddings" in data:
                    self.chunks = [RAGChunk.from_dict(c) for c in data["chunks"]]
                    self.embeddings = data["embeddings"]
                    self.is_initialized = True
                    print(f"RAG Index loaded successfully ({len(self.chunks)} chunks).")
                    return

            print("Building/Rebuilding RAG Index...")
            self.chunks = self._build_chunks()
            if not self.chunks:
                print("No knowledge chunks found to index.")
                return

            model = self._get_model()
            texts = [f"{c.title}: {c.content}" for c in self.chunks]
            raw_embeddings = model.encode(texts, normalize_embeddings=True)
            self.embeddings = raw_embeddings.tolist()

            index_data = {
                "hash": current_hash,
                "chunks": [c.to_dict() for c in self.chunks],
                "embeddings": self.embeddings,
            }
            with open(self.index_file, "w", encoding="utf-8") as f:
                json.dump(index_data, f, indent=2)

            self.is_initialized = True
            print(f"RAG Index built and persisted ({len(self.chunks)} chunks).")
        except Exception as e:
            print(f"Error initializing RAG Index: {e}")
            self.is_initialized = False

    def retrieve(
        self, query: str, top_k: int | None = None, threshold: float | None = None
    ) -> Tuple[List[Tuple[RAGChunk, float]], float]:
        """Performs cosine similarity search against vector store. Returns (matching_chunks, max_score)."""
        if not self.is_initialized:
            self.initialize_index()

        if not self.is_initialized or not self.chunks or not self.embeddings:
            return [], 0.0

        if top_k is None:
            top_k = int(os.getenv("RAG_TOP_K", "3"))
        if threshold is None:
            threshold = float(os.getenv("RAG_SIMILARITY_THRESHOLD", "0.25"))

        try:
            import numpy as np

            model = self._get_model()
            q_emb = model.encode([query], normalize_embeddings=True)[0]
            doc_embs = np.array(self.embeddings)

            # Cosine similarity (dot product of normalized vectors)
            scores = np.dot(doc_embs, q_emb)

            max_score = float(np.max(scores)) if len(scores) > 0 else 0.0

            # Rank doc indices
            ranked_indices = np.argsort(scores)[::-1]

            results = []
            for idx in ranked_indices:
                score = float(scores[idx])
                if score >= threshold:
                    results.append((self.chunks[idx], score))
                if len(results) >= top_k:
                    break

            return results, max_score
        except Exception as e:
            print(f"RAG Retrieval Error: {e}")
            return [], 0.0

    def format_context(self, matches: List[Tuple[RAGChunk, float]]) -> str:
        """Formats retrieved chunks into a compact RAG context for the LLM."""
        if not matches:
            return ""

        formatted_parts = []
        for i, (chunk, score) in enumerate(matches, 1):
            formatted_parts.append(
                f"[KNOWLEDGE CHUNK {i}]\n"
                f"Source: {chunk.source} | Category: {chunk.category} | Title: {chunk.title}\n"
                f"Content: {chunk.content}"
            )
        return "\n\n".join(formatted_parts)


# Singleton instance
rag_service = RAGService()
