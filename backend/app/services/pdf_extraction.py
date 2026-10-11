import os
from typing import List, Dict, Any
from backend.app.services.document_extraction import extract_document_content

def extract_text_from_pdf(file_path: str) -> List[Dict[str, Any]]:
    """
    Extracts text page-by-page from a PDF using PyMuPDF (fitz).
    Returns a list of dicts: [{'page': 1, 'text': '...'}]
    Preserved for backwards compatibility with existing endpoints and tests.
    """
    result = extract_document_content(file_path, "document.pdf")
    return [{"page": u["page"], "text": u["text"]} for u in result["units"]]
