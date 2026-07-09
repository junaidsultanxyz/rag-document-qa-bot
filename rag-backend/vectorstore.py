import chromadb
from sentence_transformers import SentenceTransformer

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
chroma_client = chromadb.PersistentClient(path="./storage/chroma")

def get_collection(doc_id):
    return chroma_client.get_or_create_collection(name=doc_id)

def index_chunks(doc_id, chunks):
    collection = get_collection(doc_id)
    texts = [c["text"] for c in chunks]
    embeddings = embedding_model.encode(texts).tolist()
    collection.add(
        documents=texts,
        embeddings=embeddings,
        metadatas=[{"page": c["page"]} for c in chunks],
        ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
    )
    
def search(doc_id, question, top_k=4):
    collection = get_collection(doc_id)
    query_embedding = embedding_model.encode([question]).tolist()
    return collection.query(query_embeddings=query_embedding, n_results=top_k)