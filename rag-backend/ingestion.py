import pdfplumber

def extract_pages(pdf_path):
    pages = []
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            pages.append({
                "page": page_num,
                "text": text
            })
    return pages

def chunk_pages(pages, chunk_size=800, offset=150):
    chunks = []
    for page in pages:
        start = 0
        text = page["text"]
        while start < len(text):
            chunk_text = text[start:(start+chunk_size)]
            if chunk_text.strip():
                chunks.append({
                    "page": page["page"],
                    "text": chunk_text
                })
            
            start += chunk_size - offset
    return chunks

if __name__ == "__main__":
    pages = extract_pages("res/discord_terms_of_service.pdf")
    chunks = chunk_pages(pages)
    print(f"Extracted {len(pages)} pages, {len(chunks)} chunks")
    print(chunks[0])