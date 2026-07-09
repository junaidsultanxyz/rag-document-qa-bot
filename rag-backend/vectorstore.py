import os

import chromadb
from openai import OpenAI
from dotenv import load_dotenv
import numpy as np

load_dotenv()

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

EMBEDDING_MODEL = os.getenv("EMBED_MODEL", "openai/text-embedding-3-small")

os.makedirs("./storage/chroma", exist_ok=True)
chroma_client = chromadb.PersistentClient(path="./storage/chroma")

def embed_texts(texts):
    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts
    )
    return np.stack([np.array(item.embedding, dtype=np.float32) for item in response.data])

def get_collection(doc_id):
    return chroma_client.get_or_create_collection(name=doc_id)


def index_chunks(doc_id, chunks):
    collection = get_collection(doc_id)
    texts = [c["text"] for c in chunks]
    embeddings = embed_texts(texts)
    collection.add(
        documents=texts,
        embeddings=embeddings,
        metadatas=[{"page": c["page"]} for c in chunks],
        ids=[f"{doc_id}_{i}" for i in range(len(chunks))],
    )


def search(doc_id, question, top_k=4):
    collection = get_collection(doc_id)
    query_embedding = embed_texts([question])
    return collection.query(query_embeddings=query_embedding, n_results=top_k)