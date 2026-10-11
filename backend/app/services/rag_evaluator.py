import re
from typing import Dict, Any, List

def evaluate_submission_integrity(
    attempt_content: str,
    submission_time_seconds: int,
    focus_violations: int,
    target_time_seconds: int = 420,
    rubric: str = ""
) -> Dict[str, Any]:
    """
    Evaluates student submission for anti-cheat anomalies:
    1. Suspiciously fast submission (< 20% of target pacing time).
    2. Multiple focus violations (switching tabs / pasting).
    3. Overly generic / synthetic LLM signatures or lack of intermediate logic explanation.
    Returns whether defense is required, targeted concept, and Socratic interrogation question.
    """
    content_len = len(attempt_content.strip())
    flagged = False
    reasons = []

    # 1. Pacing anomaly: Fast submission for substantial code
    if submission_time_seconds < (target_time_seconds * 0.15) and content_len > 40:
        flagged = True
        reasons.append("Pacing anomaly: Answer submitted in unusually rapid time.")

    # 2. Window blur / Tab switch violations
    if focus_violations >= 2:
        flagged = True
        reasons.append(f"Focus integrity: {focus_violations} window blur / tab-switch violations detected.")

    # 3. Synthetic boilerplate or lack of step-by-step depth
    ai_clichés = ["as an ai", "certainly, here is", "in conclusion", "to summarize", "let's break down"]
    if any(phrase in attempt_content.lower() for phrase in ai_clichés):
        flagged = True
        reasons.append("Detected synthetic AI phrasing patterns.")

    # Even if not flagged by rule 1 or 2, if code contains recursion without explanation
    # we simulate intermediate concept defense if 'factorial' is used
    if not flagged and "return n *" in attempt_content and focus_violations > 0:
        flagged = True
        reasons.append("Focus interruptions noted during critical recursive step formation.")

    if flagged:
        targeted_concept = "Call Stack Unwinding"
        defense_question = (
            "Defense Required: In your implementation, what exact memory state change occurs "
            "when `n == 0` is evaluated? Walk through the return sequence from factorial(1) back to factorial(n)."
        )
        return {
            "flagged": True,
            "defense_required": True,
            "reason": " | ".join(reasons),
            "targeted_concept": targeted_concept,
            "defense_question": defense_question
        }

    return {
        "flagged": False,
        "defense_required": False,
        "reason": "Submission within expected focus and pacing thresholds.",
        "targeted_concept": None,
        "defense_question": None
    }

def verify_student_defense(
    concept_name: str,
    defense_response: str
) -> Dict[str, Any]:
    """
    Evaluates whether the student's Socratic defense shows genuine conceptual grasp.
    """
    response_lower = defense_response.lower()
    keywords = ["stack", "frame", "unwind", "pop", "push", "return", "base", "call", "memory", "1"]

    matches = [k for k in keywords if k in response_lower]
    # If student provided substantive reasoning with relevant concepts
    if len(defense_response.strip()) >= 25 and len(matches) >= 2:
        return {
            "verified": True,
            "feedback": f"Conceptual grasp verified for '{concept_name}'. Call stack dynamics clearly articulated."
        }
    else:
        return {
            "verified": False,
            "feedback": "Defense insufficient. Please explain how frames are popped from the stack when the base case returns."
        }
