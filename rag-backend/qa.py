import os
from openai import OpenAI
from dotenv import load_dotenv
from vectorstore import search

load_dotenv()


OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL = os.getenv("MODEL")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY
)


############################
# HELPER
############################

def generate_prompt(question:str, context) -> str:
    prompt = f"""Answer the question using ONLY the context below.
Cite sources using [Source N] notation. If the answer isn't in the context, say you don't know.

Context:
{context}

Question: {question}"""
    return prompt


def answer_questions(doc_id, question, model=MODEL) -> str:
    results = search(doc_id=doc_id, question=question)
    
    docs = results["documents"][0]
    metas = results["metadatas"][0]
    
    context_blocks = []
    for i, (text, meta) in enumerate(zip(docs, metas)):
        context_blocks.append(f"[Source {i+1}, Page {meta['page']}]\n {text}")
    context = "\n\n".join(context_blocks)
    
    prompt = generate_prompt(question=question, context=context)
    
    response = client.responses.create(
        input= prompt,
        model=MODEL,
        max_output_tokens=2000
    )
    
    return {
        "answer": response.output_text,
        "sources": [{"page": m["page"], "snippet": d[:200]} for d,m in zip(docs, metas)]
    }
    

######################
# MAIN
######################

if __name__ == "__main__":
    from ingestion import extract_pages, chunk_pages
    from vectorstore import index_chunks
    
    pages = extract_pages("res/discord_terms_of_service.pdf")
    chunks = chunk_pages(pages)
    index_chunks("discord_tos_doc", chunks)
    
    while (True):
        print()
        prompt = input("> ")
        
        if prompt == "exit":
            exit()
        
        result = answer_questions("discord_tos_doc", prompt)
        
        print(f">>> {result["answer"]}")
        print("#### SOURCES ####")
        for s in result["sources"]:
            print(s)
        print("#################")