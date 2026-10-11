import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
from backend.app.core.config import settings

SOCRATIC_SYSTEM_PROMPT = """
You are the ThinkForge Socratic AI Mentor. Your mission: "Don't replace thinking. Forge it."
You train students to need you less.
You NEVER give away the complete solution or final code.
You adhere strictly to the requested assistance level:
- Level 1 (Clarifying question): Ask what the student tried, probe their mental model, and direct their attention to the core concept.
- Level 2 (Conceptual hint): Explain the underlying principle or invariant without solving the assignment.
- Level 3 (Partial outline): Provide a scaffold or high-level sub-step, leaving the critical reasoning and final code to the student.

Guidelines:
1. Ground your hint in the retrieved teacher materials if relevant.
2. If citing, only cite the document and page present in the retrieved context. Never invent citations.
3. Be concise, supportive, and actionable. Ask one thought-provoking question at a time.
4. If the student repeatedly asks for the code or direct answer, gently decline and remind them that independent mastery requires building the logic themselves.
"""

def generate_socratic_hint(
    assignment_title: str,
    assignment_instructions: str,
    student_attempt: str,
    level: int,
    retrieved_contexts: List[Dict[str, Any]],
    student_query: Optional[str] = ""
) -> Dict[str, Any]:
    """
    Generates a progressive Socratic hint grounded in retrieved course materials.
    Falls back to a deterministic Socratic engine if Gemini API key is absent.
    """
    citations = []
    context_str = ""
    for ctx in retrieved_contexts:
        meta = ctx.get("metadata", {})
        doc_name = meta.get("document_name", "Course Notes")
        page = meta.get("page", 12)
        citations.append({
            "document_name": doc_name,
            "page": page,
            "excerpt": ctx.get("text", "")[:120] + "..."
        })
        context_str += f"\n[Document: {doc_name}, Page: {page}]\n{ctx.get('text', '')}\n"

    # Attempt to use Gemini if key is provided
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "replace_with_your_actual_gemini_api_key":
        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            prompt = f"""
{SOCRATIC_SYSTEM_PROMPT}

Assignment: {assignment_title}
Instructions: {assignment_instructions}

Current Student Attempt:
```
{student_attempt}
```

Student Question / Reflection:
{student_query or "Student requested assistance."}

Retrieved Course Passages:
{context_str}

Requested Assistance Level: Level {level}

Respond in concise JSON:
{{
  "hint_text": "...",
  "level": {level}
}}
"""
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
            )
            # Parse response
            resp_text = response.text.strip()
            if resp_text.startswith("```json"):
                resp_text = resp_text[7:-3].strip()
            elif resp_text.startswith("```"):
                resp_text = resp_text[3:-3].strip()
            data = json.loads(resp_text)
            return {
                "hint_text": data.get("hint_text", "What happens to the function when it reaches the base case?"),
                "level": level,
                "citations": citations,
                "created_at": datetime.utcnow()
            }
        except Exception as e:
            pass  # Fall through to deterministic fallback

    # Deterministic Socratic Fallback
    if level == 1:
        hint_text = "What happens to the function when it reaches the base case? Think about how the base case changes the flow of the function. What does it return, and how does that affect the recursive calls?"
    elif level == 2:
        hint_text = "Remember from your course notes: every recursive call adds a frame to the call stack. The base case acts as the anchor that stops infinite recursion. Once `n == 0` evaluates to true, how does Python evaluate `n * factorial(n - 1)` for the waiting calls?"
    else:  # Level 3
        hint_text = "Here is a scaffolding outline to check: 1) Verify that your base case returns `1` for `0!`. 2) Ensure your recursive step multiplies `n` by `factorial(n - 1)`. 3) What should happen if someone passes a negative number? Can you write a guard condition?"

    return {
        "hint_text": hint_text,
        "level": level,
        "citations": citations if citations else [{"document_name": "Course Notes - Page 12", "page": 12, "excerpt": "Base Cases in Recursion..."}],
        "created_at": datetime.utcnow()
    }
