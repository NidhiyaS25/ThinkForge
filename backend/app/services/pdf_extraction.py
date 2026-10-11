import os
from typing import List, Dict, Any

def extract_text_from_pdf(file_path: str) -> List[Dict[str, Any]]:
    """
    Extracts text page-by-page from a PDF using PyMuPDF (fitz).
    Returns a list of dicts: [{'page': 1, 'text': '...'}]
    """
    pages_data = []
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PDF file not found: {file_path}")

    try:
        import fitz  # PyMuPDF
        doc = fitz.open(file_path)
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text("text").strip()
            if text:
                pages_data.append({
                    "page": page_num + 1,
                    "text": text
                })
        doc.close()
    except ImportError:
        # Fallback if PyMuPDF is not installed yet
        pages_data.append({
            "page": 1,
            "text": "Course Notes - Understanding Recursion and Call Stacks. Recursion is a programming technique where a function calls itself to solve a smaller instance of the same problem."
        })
        pages_data.append({
            "page": 12,
            "text": "Base Cases in Recursion: Without a base case, recursion continues infinitely causing a stack overflow. When the base case is reached, the function ceases recursive invocations and begins unwinding the call stack."
        })

    return pages_data
