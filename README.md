# RAG Document Q&A Bot

Upload any PDF, ask questions about it in plain language, and get answers with source citations — including the exact page number they came from.

Built as a demonstration of Retrieval-Augmented Generation (RAG): a technique that lets an LLM answer questions grounded in your own documents instead of relying only on what it was trained on.

## How it works

1. **Upload** — a PDF is split into page-tracked chunks
2. **Embed** — each chunk is converted into a vector using a local embedding model
3. **Store** — vectors are saved in a ChromaDB vector database
4. **Ask** — your question is embedded the same way, and the most relevant chunks are retrieved
5. **Answer** — the retrieved chunks + your question are sent to an LLM, which answers using only that context and cites its sources

```
PDF Upload → Chunking → Embeddings → Vector DB (Chroma)
                                          │
User Question → Embedding → Similarity Search → Top Chunks
                                          │
                              LLM (via OpenRouter) → Answer + Citations
```

## Tech Stack

**Backend**
- Python + FastAPI
- `pdfplumber` — PDF text extraction with page tracking
- `sentence-transformers` (`all-MiniLM-L6-v2`) — local embeddings
- `ChromaDB` — vector storage and similarity search
- OpenAI SDK → OpenRouter — LLM calls (model-agnostic, e.g. Claude via OpenRouter)

**Frontend**
- Angular (standalone components)
- Native `HttpClient` — no extra HTTP libraries needed

## Project Structure

```
rag-document-qa-bot/
├── rag-backend/
│   ├── main.py            # FastAPI app + endpoints
│   ├── ingestion.py       # PDF text extraction + chunking
│   ├── vectorstore.py     # Embedding + ChromaDB logic
│   ├── qa.py              # Retrieval + LLM answer generation
│   ├── requirements.txt
│   ├── .env.example
│   └── storage/           # Uploaded PDFs + Chroma persistence (gitignored)
│
└── rag-frontend/
    ├── src/app/
    │   ├── services/rag.service.ts
    │   ├── components/upload/
    │   ├── components/chat/
    │   └── app.component.ts
    └── package.json
```

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and Angular CLI (`npm install -g @angular/cli`)
- An [OpenRouter](https://openrouter.ai) API key

### Backend

```bash
cd rag-backend
python -m venv venv
source venv/Scripts/activate   # Windows (Git Bash)
# venv\Scripts\activate        # Windows (cmd/PowerShell)
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt

cp .env.example .env
# then open .env and add your OpenRouter API key

uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`. Interactive API docs (for testing endpoints directly) are available at `http://localhost:8000/docs`.

### Frontend

```bash
cd rag-frontend
npm install
ng serve
```

Frontend runs at `http://localhost:4200`.

> Both servers need to be running at the same time for the app to work.

## Environment Variables

Create a `.env` file in `rag-backend/` (see `.env.example`):

```
OPENROUTER_API_KEY=your_key_here
```

## API Endpoints

| Method | Endpoint  | Description                                      |
|--------|-----------|---------------------------------------------------|
| POST   | `/upload` | Upload a PDF, extracts + chunks + indexes it       |
| POST   | `/ask`    | Ask a question about a previously uploaded PDF     |

**`POST /upload`** — multipart form, field: `file`
Returns: `{ "doc_id": string, "pages": number, "chunks": number }`

**`POST /ask`** — form fields: `doc_id`, `question`
Returns: `{ "answer": string, "sources": [{ "page": number, "snippet": string }] }`

## Notes & Limitations

- Embeddings run locally and are free; only the final answer-generation step calls an LLM API
- Scanned PDFs (image-only, no text layer) currently return empty text per page — OCR support could be added via `pytesseract`
- Vector storage is file-based (Chroma's `PersistentClient`) — fine for a demo or single-user setup; for multi-tenant/production use, consider a hosted vector DB (e.g. Qdrant, `pgvector`)
- No conversation memory yet — each question is answered independently, without awareness of previous questions in the session

## Possible Next Steps

- Streaming responses for a "typing" effect
- Multi-document querying (search across a whole library, not just one PDF)
- Conversation memory for follow-up questions
- OCR fallback for scanned documents
- Click-to-jump PDF viewer that opens directly to the cited page