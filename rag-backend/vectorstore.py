import os

import chromadb
from fastembed import TextEmbedding

embedding_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

os.makedirs("./storage/chroma", exist_ok=True)
chroma_client = chromadb.PersistentClient(path="./storage/chroma")


def get_collection(doc_id):
    return chroma_client.get_or_create_collection(name=doc_id)


def index_chunks(doc_id, chunks):
    collection = get_collection(doc_id)
    texts = [c["text"] for c in chunks]
    embeddings = [vec.tolist() for vec in embedding_model.embed(texts)]
    collection.add(
        documents=texts,
        embeddings=embeddings,
        metadatas=[{"page": c["page"]} for c in chunks],
        ids=[f"{doc_id}_{i}" for i in range(len(chunks))],
    )


def search(doc_id, question, top_k=4):
    collection = get_collection(doc_id)
    query_embedding = [vec.tolist() for vec in embedding_model.embed([question])]
    return collection.query(query_embeddings=query_embedding, n_results=top_k)
