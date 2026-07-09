from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import uuid, os, shutil

from ingestion import extract_pages, chunk_pages
from vectorstore import index_chunks
from qa import answer_questions

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    doc_id = str(uuid.uuid4())
    os.makedirs("storage/pdfs", exist_ok=True)
    path = f"storage/pdfs/{doc_id}.pdf"
    
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    pages = extract_pages(path)
    chunks = chunk_pages(pages)
    index_chunks(doc_id, chunks)
    
    return {
        "doc_id": doc_id,
        "pages": len(pages),
        "chunks": len(chunks)
    }

@app.post("/ask")
async def ask(doc_id: str = Form(...), question: str = Form(...)):
    return answer_questions(doc_id, question)