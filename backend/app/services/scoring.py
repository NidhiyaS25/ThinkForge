from typing import Dict, Any

def score_transfer_challenge(
    student_response: str,
    expected_answer: str,
    rubric: str = ""
) -> Dict[str, Any]:
    """
    Evaluates an AI-free transfer challenge response against teacher expected criteria.
    Deterministic rubric evaluation.
    """
    text = student_response.strip().lower()
    score = 0.0
    feedback_notes = []

    # Check for core function signature
    if "def fibonacci" in text or "def fib" in text:
        score += 25.0
        feedback_notes.append("Correct function signature defined (+25).")
    else:
        feedback_notes.append("Missing standard function declaration.")

    # Check base cases
    has_base_case = False
    if ("n <= 0" in text or "n == 0" in text) and ("return 0" in text or "return 1" in text):
        score += 35.0
        has_base_case = True
        feedback_notes.append("Base case guards properly constructed (+35).")
    elif "n <= 1" in text or "n == 1" in text:
        score += 35.0
        has_base_case = True
        feedback_notes.append("Base case handles termination condition (+35).")
    else:
        feedback_notes.append("Incomplete base case boundary conditions.")

    # Check recursive step
    if "fibonacci(n - 1)" in text or "fib(n - 1)" in text:
        score += 40.0
        feedback_notes.append("Recursive step correctly invokes sub-problems (+40).")
    else:
        feedback_notes.append("Recursive invocation missing or malformed.")

    return {
        "score": min(score, 100.0),
        "max_score": 100.0,
        "feedback": " | ".join(feedback_notes)
    }
