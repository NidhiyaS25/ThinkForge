from typing import List, Dict, Any, Optional

def chunk_text(
    pages_data: List[Dict[str, Any]],
    course_id: int,
    document_id: int,
    document_name: str = "",
    chunk_size: int = 400,
    overlap: int = 60
) -> List[Dict[str, Any]]:
    """
    Splits page/slide/section units into overlapping word chunks.
    Preserves course_id, document_id, document_name, unit_type, unit_number,
    and assigns stable unique chunk_id.
    """
    chunks = []
    chunk_idx = 0

    for unit_entry in pages_data:
        unit_num = unit_entry.get("unit_number", unit_entry.get("page", 1))
        unit_type = unit_entry.get("unit_type", "page")
        heading = unit_entry.get("heading", f"{unit_type.capitalize()} {unit_num}")
        text = unit_entry.get("text", "")
        words = text.split()

        if not words:
            continue

        if len(words) <= chunk_size:
            chunk_idx += 1
            chunks.append({
                "chunk_id": f"c{course_id}_d{document_id}_u{unit_num}_chk{chunk_idx}",
                "course_id": course_id,
                "document_id": document_id,
                "document_name": document_name,
                "page": unit_num,
                "unit_type": unit_type,
                "unit_number": unit_num,
                "heading": heading,
                "text": " ".join(words)
            })
            continue

        start = 0
        while start < len(words):
            end = min(start + chunk_size, len(words))
            chunk_words = words[start:end]
            chunk_idx += 1

            chunks.append({
                "chunk_id": f"c{course_id}_d{document_id}_u{unit_num}_chk{chunk_idx}",
                "course_id": course_id,
                "document_id": document_id,
                "document_name": document_name,
                "page": unit_num,
                "unit_type": unit_type,
                "unit_number": unit_num,
                "heading": heading,
                "text": " ".join(chunk_words)
            })

            if end >= len(words):
                break
            start += (chunk_size - overlap)

    return chunks
