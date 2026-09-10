# RITESH.AI — AI Engineer & Cybersecurity Developer Portfolio

A modern, high-performance portfolio and AI assistant showcasing artificial intelligence systems, cybersecurity engineering, and full-stack development by **Ritesh Chaudhari**.

---

## 🌟 Overview

**RITESH.AI** combines a responsive React 19 + TypeScript frontend with a fast Python FastAPI backend. The site features an interactive AI assistant grounded in custom portfolio knowledge via dense vector retrieval (RAG with `SentenceTransformers`), direct resume integration, real-time GitHub activity feeds, and a detailed engineering case study showcase for **SATRK** (SIH 2026 flagship cyber defense platform).

---

## 🚀 Key Features

- **SATRK Flagship Case Study**: Interactive architectural breakdown of an AI-based early detection system for digital arrest, CBI, TRAI, and financial impersonation scams. Features multilingual STT (Groq Whisper), dual AI reasoning (Rule Engine + LLM), voice deepfake verification (Resemble AI), and Google Safe Browsing URL scanning.
- **Grounded AI Assistant (Ritesh AI)**: Portfolio companion powered by Groq LLM and SentenceTransformers dense vector search (`all-MiniLM-L6-v2`).
- **Cybersecurity & Safety**: Strict prompt injection protection, in-memory IP rate limiting, input length validation, and zero hardcoded secrets.
- **GitHub Integration**: Real-time integration with the GitHub REST API fetching public profile metrics, top non-fork repositories, and recent public activity.
- **Resume Integration**: Direct viewer and download access for Ritesh Chaudhari's resume PDF.
- **Accessible & Fast**: Full keyboard navigation, `Escape` key drawer handling, WCAG contrast compliance, `:focus-visible` rings, reduced-motion query support, and single-click bundle build under 400ms.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Animations**: Framer Motion & CSS keyframe micro-interactions
- **Styling**: Modern Vanilla CSS with lavender + white + dark navy design system
- **Icons**: Lucide React

### Backend
- **Framework**: Python 3.12 + FastAPI + Uvicorn
- **AI / RAG**: SentenceTransformers (`all-MiniLM-L6-v2`), Groq LLM API (`groq` Python SDK)
- **Data Validation**: Pydantic v2

---

## 📁 Repository Structure

```
.
├── frontend/                 # React 19 + TypeScript Vite Application
│   ├── src/                  # App components, SVG assets & CSS design system
│   ├── public/               # Static assets (resume.pdf, favicon.svg, robots.txt)
│   ├── .env.example          # Environment variable template for frontend
│   └── package.json          # Dependencies & scripts
├── backend/                  # Python FastAPI & RAG Service
│   ├── knowledge/            # Grounded portfolio knowledge base JSON files
│   ├── services/             # RAG vector search & LLM service logic
│   ├── vector_store/         # Generated vector embeddings index (`index.json`)
│   ├── rebuild_index.py      # Script to force rebuild the vector search index
│   ├── main.py               # FastAPI entrypoint, routes & rate limiting
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Environment variable template for backend
├── .gitignore                # Root gitignore rules protecting secrets & build outputs
└── README.md                 # Project documentation
```

---

## ⚙️ Local Development Setup

### 1. Prerequisites
- **Node.js**: v18+ and `npm`
- **Python**: v3.10+ and `pip`

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env` with your LLM configuration:
```env
LLM_PROVIDER=groq
LLM_API_KEY=your_groq_api_key_here
LLM_MODEL=llama-3.3-70b-versatile
RAG_EMBEDDING_MODEL=all-MiniLM-L6-v2
```

Start backend development server:
```bash
uvicorn main:app --reload --port 8000
```
Backend will be available at `http://localhost:8000` (Health check: `http://localhost:8000/health`).

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
cp .env.example .env
```

Start frontend development server:
```bash
npm run dev
```
Frontend will be available at `http://localhost:5173`.

---

## 🧪 Verification & Build Commands

### Frontend Production Build & Type Check
```bash
cd frontend
npx tsc --noEmit
npm run build
```

### Rebuild Vector Search Index
```bash
cd backend
python rebuild_index.py
```

---

## 🔒 Security & Privacy

- All API keys and environment variables are excluded from source control via `.gitignore`.
- RAG queries are evaluated using strict system prompts to prevent injection attacks and stay grounded in authentic portfolio facts.
- Backend API applies in-memory rate limiting (`60 requests/minute`) on `/chat`.

---

## 📄 License & Attribution

Created by **Ritesh Chaudhari**. All rights reserved.
