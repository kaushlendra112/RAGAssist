# RAGAssist 🤖📄

A modular, full-stack Retrieval-Augmented Generation (RAG) system built with **FastAPI**, **LangChain**, **LangGraph**, and **React.js**.

---

## 🌟 Key Features

- **Modular LangGraph Workflow**: State-driven execution pipeline (`Retrieve Node` ➔ `Generate Node`) with flexible routing and context aggregation.
- **PDF Document Processing**: Automatic text extraction and chunking using `PyPDF` and `RecursiveCharacterTextSplitter`.
- **Local & Multi-LLM Embeddings**: Built-in support for OpenAI (`gpt-4o-mini`), Google Gemini (`gemini-1.5-flash`), SentenceTransformers, and local fallback vector search.
- **Vector Storage**: In-memory & persisted vector storage with similarity scoring and document metadata tracking.
- **Source Citation & Snippets**: Every generated answer provides expandable source citations including filename, page numbers, and match confidence scores.
- **Modern Glassmorphism React UI**: Includes drag-and-drop PDF uploader, document scope selector, chat session management, and syntax-highlighted responses.

---

## 🏗️ Project Architecture

```
RAGAssist/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI server & endpoints
│   │   ├── config.py            # Environment & app configuration
│   │   ├── schemas/
│   │   │   └── api.py           # Pydantic request/response schemas
│   │   └── services/
│   │       ├── pdf_loader.py    # PDF extraction & text chunking
│   │       ├── vector_store.py  # Embeddings & similarity search
│   │       └── rag_graph.py     # LangGraph state machine & nodes
│   ├── data/                    # Vector index & document storage
│   ├── requirements.txt
│   ├── .env.example
│   └── test_rag.py              # Verification & unit test runner
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Header.jsx       # Status bar & system info
    │   │   ├── DocumentUpload.jsx # Drag-and-drop uploader
    │   │   ├── DocumentList.jsx # Document index & filter selector
    │   │   ├── ChatWindow.jsx   # Interactive chat session
    │   │   ├── ChatMessage.jsx  # Rich message rendering
    │   │   └── SourceCitations.jsx # Page & match citation cards
    │   ├── App.jsx
    │   ├── index.css            # Dark mode glassmorphism design system
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

---

## 🚀 Getting Started

### 1. Backend Setup (FastAPI & LangGraph)

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

Set your API key in .env file

# Run FastAPI server
uvicorn app.main:app --reload --port 8000
```

Backend server runs at: `http://localhost:8000`  
API Swagger Docs: `http://localhost:8000/docs`

---

### 2. Frontend Setup (React + Vite)

```bash
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```

Frontend app runs at: `http://localhost:3000`

---


---

## ⚙️ Configuration (.env)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `LLM_PROVIDER` | `mock`, `openai`, or `google` | `mock` |
| `OPENAI_API_KEY` | OpenAI API Key | `""` |
| `GOOGLE_API_KEY` | Google Gemini API Key | `""` |
| `CHUNK_SIZE` | Text chunk character length | `1000` |
| `CHUNK_OVERLAP` | Overlap between chunks | `150` |
| `TOP_K_RETRIEVAL` | Retrieved context count | `4` |