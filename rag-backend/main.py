import os
import shutil
import uuid

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.responses import JSONResponse

from ingestion import extract_pages, chunk_pages
from vectorstore import index_chunks
from qa import answer_question
from usage_limit import check_and_increment_daily

load_dotenv()


if not os.getenv("OPENROUTER_API_KEY"):
    raise RuntimeError(
        "OPENROUTER_API_KEY is not set. "
        "Set it in your .env file (local) or in the Render dashboard (production)."
    )

MAX_UPLOAD_SIZE_MB = 20
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024

app = FastAPI()

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"error": "Rate limit exceeded. Try again later."},
    )


ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:4200")
origins = [o.strip() for o in ALLOWED_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.post("/upload")
@limiter.limit("5/hour")
async def upload(request: Request, file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are accepted. Please upload a file with a .pdf extension.",
        )

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_UPLOAD_SIZE_MB}MB.",
        )

    doc_id = str(uuid.uuid4())
    os.makedirs("storage/pdfs", exist_ok=True)
    path = f"storage/pdfs/{doc_id}.pdf"

    with open(path, "wb") as f:
        f.write(contents)

    pages = extract_pages(path)
    chunks = chunk_pages(pages)
    index_chunks(doc_id, chunks)

    return {
        "doc_id": doc_id,
        "pages": len(pages),
        "chunks": len(chunks),
    }


@app.post("/ask")
@limiter.limit("10/hour")
async def ask(request: Request, doc_id: str = Form(...), question: str = Form(...)):
    check_and_increment_daily()
    return answer_question(doc_id, question)
