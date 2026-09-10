# Ritesh AI Backend & Semantic RAG Pipeline

This FastAPI backend powers **Ritesh AI**, providing a Semantic RAG (Retrieval-Augmented Generation) pipeline integrated with Groq LLM.

---

## 1. What RAG Does
Instead of dumping the entire portfolio knowledge base into every LLM request, the RAG pipeline:
1. Segments verified knowledge JSON files into fine-grained semantic chunks.
2. Encodes chunks into 384-dimensional dense vectors using `sentence-transformers` (`all-MiniLM-L6-v2`).
3. Performs local cosine similarity search against user queries.
4. Passes only the top matching relevant chunks to Groq LLM (`groq/compound-mini`).
5. Enforces anti-hallucination guardrails when queries fall below the similarity threshold ($0.35$).

---

## 2. Vector Index Location & Storage
- **Knowledge Source Files**: `backend/knowledge/` (`profile.json`, `projects.json`, `skills.json`, `education.json`).
- **Persistent Vector Store**: `backend/vector_store/index.json`.
- **Automatic Auto-Rebuild**: The backend computes an MD5 hash of knowledge source files on startup. If knowledge files change or the index is missing, the index automatically rebuilds and persists to disk.

---

## 3. How to Force Rebuild the Index
To explicitly force a complete rebuild of the RAG index:

```powershell
python rebuild_index.py
```

---

## 4. Fallback Architecture
If the embedding model, vector store, or Groq API is unavailable or unconfigured, `chat_service.py` automatically falls back to `knowledge_service.get_fallback_response()`, ensuring the portfolio assistant remains 100% operational.
