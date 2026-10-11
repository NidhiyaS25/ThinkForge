import os
import re
from typing import List, Dict, Any

def extract_document_content(file_path: str, filename: str) -> Dict[str, Any]:
    """
    Unified multi-format document parser.
    Supports: .pdf, .pptx, .docx, .txt, .md
    Rejects: legacy .ppt (requests .pptx conversion), unknown formats, empty files.
    Returns:
    {
        "unit_type": "page" | "slide" | "section",
        "unit_count": int,
        "units": [
            {
                "unit_type": str,
                "unit_number": int,
                "page": int, # backward compatibility
                "heading": str,
                "text": str
            }
        ]
    }
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    ext = os.path.splitext(filename)[1].lower()

    if ext == ".ppt":
        raise ValueError("Legacy PowerPoint .ppt is not supported. Please convert your presentation to modern .pptx format before uploading.")

    if ext == ".pdf":
        return _extract_pdf(file_path)
    elif ext == ".pptx":
        return _extract_pptx(file_path)
    elif ext == ".docx":
        return _extract_docx(file_path)
    elif ext in [".txt", ".text"]:
        return _extract_txt(file_path)
    elif ext in [".md", ".markdown"]:
        return _extract_markdown(file_path)
    else:
        raise ValueError(f"Unsupported file format '{ext}'. Supported formats: .pdf, .pptx, .docx, .txt, .md")

def _extract_pdf(file_path: str) -> Dict[str, Any]:
    import fitz  # PyMuPDF
    doc = fitz.open(file_path)
    units = []
    total_pages = len(doc)

    for page_num in range(total_pages):
        page = doc[page_num]
        text = page.get_text("text").strip()
        if text:
            units.append({
                "unit_type": "page",
                "unit_number": page_num + 1,
                "page": page_num + 1,
                "heading": f"Page {page_num + 1}",
                "text": text
            })
    doc.close()

    if total_pages > 0 and len(units) == 0:
        raise ValueError("Scanned PDF detected with no extractable text. OCR is required to index this document.")

    if len(units) == 0:
        raise ValueError("The PDF document is empty.")

    return {
        "unit_type": "page",
        "unit_count": total_pages,
        "units": units
    }

def _extract_pptx(file_path: str) -> Dict[str, Any]:
    from pptx import Presentation
    prs = Presentation(file_path)
    units = []
    total_slides = len(prs.slides)

    for slide_idx, slide in enumerate(prs.slides):
        slide_num = slide_idx + 1
        slide_texts = []
        heading = f"Slide {slide_num}"

        # Check for title
        if slide.shapes.title and slide.shapes.title.text.strip():
            heading = f"Slide {slide_num}: {slide.shapes.title.text.strip()[:60]}"

        for shape in slide.shapes:
            if shape.has_text_frame:
                for paragraph in shape.text_frame.paragraphs:
                    line = paragraph.text.strip()
                    if line and line not in slide_texts:
                        slide_texts.append(line)
            elif shape.has_table:
                for row in shape.table.rows:
                    row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                    if row_cells:
                        slide_texts.append(" | ".join(row_cells))

        combined_text = "\n".join(slide_texts).strip()
        if combined_text:
            units.append({
                "unit_type": "slide",
                "unit_number": slide_num,
                "page": slide_num,
                "heading": heading,
                "text": combined_text
            })

    if total_slides > 0 and len(units) == 0:
        raise ValueError("The PowerPoint presentation contains slides, but no extractable text shapes were found.")

    if len(units) == 0:
        raise ValueError("The PowerPoint presentation contains no slides.")

    return {
        "unit_type": "slide",
        "unit_count": total_slides,
        "units": units
    }

def _extract_docx(file_path: str) -> Dict[str, Any]:
    import docx
    doc = docx.Document(file_path)
    units = []

    current_heading = "Document Introduction"
    current_paragraphs = []
    section_num = 1

    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue

        # Check if paragraph is heading
        if para.style and para.style.name.startswith("Heading"):
            if current_paragraphs:
                units.append({
                    "unit_type": "section",
                    "unit_number": section_num,
                    "page": section_num,
                    "heading": current_heading,
                    "text": "\n".join(current_paragraphs)
                })
                section_num += 1
                current_paragraphs = []
            current_heading = text
        else:
            current_paragraphs.append(text)

    # Process tables
    for table in doc.tables:
        table_lines = []
        for row in table.rows:
            row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if row_cells:
                table_lines.append(" | ".join(row_cells))
        if table_lines:
            current_paragraphs.append("\n".join(table_lines))

    if current_paragraphs:
        units.append({
            "unit_type": "section",
            "unit_number": section_num,
            "page": section_num,
            "heading": current_heading,
            "text": "\n".join(current_paragraphs)
        })

    if not units:
        raise ValueError("The Word document is empty or has no extractable text.")

    return {
        "unit_type": "section",
        "unit_count": len(units),
        "units": units
    }

def _extract_txt(file_path: str) -> Dict[str, Any]:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read().strip()
    except UnicodeDecodeError:
        with open(file_path, "r", encoding="latin-1") as f:
            content = f.read().strip()

    if not content:
        raise ValueError("The text file is empty.")

    # Split by double newlines or substantial sections
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", content) if p.strip()]
    units = []
    
    # If small, treat as single section; if large, chunk into sections of ~300 words
    current_section = []
    current_words = 0
    sec_num = 1

    for p in paragraphs:
        words = len(p.split())
        current_section.append(p)
        current_words += words
        if current_words >= 250:
            units.append({
                "unit_type": "section",
                "unit_number": sec_num,
                "page": sec_num,
                "heading": f"Section {sec_num}",
                "text": "\n\n".join(current_section)
            })
            sec_num += 1
            current_section = []
            current_words = 0

    if current_section:
        units.append({
            "unit_type": "section",
            "unit_number": sec_num,
            "page": sec_num,
            "heading": f"Section {sec_num}",
            "text": "\n\n".join(current_section)
        })

    return {
        "unit_type": "section",
        "unit_count": len(units),
        "units": units
    }

def _extract_markdown(file_path: str) -> Dict[str, Any]:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read().strip()
    except UnicodeDecodeError:
        with open(file_path, "r", encoding="latin-1") as f:
            content = f.read().strip()

    if not content:
        raise ValueError("The markdown file is empty.")

    lines = content.split("\n")
    units = []
    current_heading = "Overview"
    current_lines = []
    sec_num = 1

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("#"):
            if current_lines:
                units.append({
                    "unit_type": "section",
                    "unit_number": sec_num,
                    "page": sec_num,
                    "heading": current_heading,
                    "text": "\n".join(current_lines).strip()
                })
                sec_num += 1
                current_lines = []
            current_heading = stripped.lstrip("#").strip()
        else:
            current_lines.append(line)

    if current_lines:
        units.append({
            "unit_type": "section",
            "unit_number": sec_num,
            "page": sec_num,
            "heading": current_heading,
            "text": "\n".join(current_lines).strip()
        })

    return {
        "unit_type": "section",
        "unit_count": len(units),
        "units": units
    }
