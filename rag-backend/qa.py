import os
from typing import Mapping, Sequence
from dotenv import load_dotenv
from vectorstore import search, client

load_dotenv()

DEFAULT_MODEL = os.getenv("CHAT_MODEL", "cohere/north-mini-code:free")


def generate_prompt(question: str, context: str) -> str:
    return f"""Answer the question using ONLY the context below.

Cite sources using [Source N] notation. If the answer isn't in the context, say you don't know.

Context:
{context}

Question: {question}"""


def build_context(docs: Sequence[str], metas: Sequence[Mapping]) -> str:
    blocks = [
        f"[Source {i + 1}, Page {meta['page']}]\n{text}"
        for i, (text, meta) in enumerate(zip(docs, metas))
    ]
    return "\n\n".join(blocks)


def answer_question(doc_id: str, question: str, model: str = DEFAULT_MODEL):
    results = search(doc_id, question)

    documents = results.get("documents")
    metadatas = results.get("metadatas")

    if not documents or not metadatas:
        return {
            "answer": "I couldn't find any relevant content to answer this question.",
            "sources": []
        }

    docs = documents[0]
    metas = metadatas[0]

    context = build_context(docs, metas)
    prompt = generate_prompt(question, context)

    response = client.responses.create(
        model=model,
        input=prompt,
        max_output_tokens=1000,
    )

    return {
        "answer": response.output_text,
        "sources": [{"page": m["page"], "snippet": d[:200]} for d, m in zip(docs, metas)]
    }