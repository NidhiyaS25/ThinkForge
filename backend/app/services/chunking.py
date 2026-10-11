from typing import List, Dict, Any

def chunk_text(
    pages_data: List[Dict[str, Any]],
    course_id: int,
    document_id: int,
    chunk_size: int = 400,
    overlap: int = 60
) -> List[Dict[str, Any]]:
    """
    Splits page-by-page text into overlapping word chunks preserving course_id,
    document_id, page number, and assigning unique chunk_id.
    """
    chunks = []
    chunk_idx = 0

    for page_entry in pages_data:
        page_num = page_entry["page"]
        text = page_entry["text"]
        words = text.split()

        if not words:
            continue

        if len(words) <= chunk_size:
            chunk_idx += 1
            chunks.append({
                "chunk_id": f"c{course_id}_d{document_id}_p{page_num}_chk{chunk_idx}",
                "course_id": course_id,
                "document_id": document_id,
                "page": page_num,
                "text": " ".join(words)
            })
            continue

        start = 0
        while start < len(words):
            end = min(start + chunk_size, len(words))
            chunk_words = words[start:end]
            chunk_idx += 1

            chunks.append({
                "chunk_id": f"c{course_id}_d{document_id}_p{page_num}_chk{chunk_idx}",
                "course_id": course_id,
                "document_id": document_id,
                "page": page_num,
                "text": " ".join(chunk_words)
            })

            if end >= len(words):
                break
            start += (chunk_size - overlap)

    return chunks
