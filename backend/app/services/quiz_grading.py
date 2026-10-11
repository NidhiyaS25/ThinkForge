import re
from typing import Dict, Any, List

def evaluate_quiz_answers(
    questions: List[Any],  # List of QuizQuestion model or dict
    submitted_answers: Dict[int, str]  # question_id -> student_response
) -> Dict[str, Any]:
    """
    Evaluates student quiz submissions deterministically:
    - Multiple-Choice & True/False: Exact normalized match against answer key
    - Short Answer & Conceptual: Rubric and key conceptual overlap scoring
    Returns:
    {
        "total_score": float,
        "max_score": float,
        "percentage": float,
        "evaluations": List[Dict]
    }
    """
    evaluations = []
    total_earned = 0.0
    max_possible = float(len(questions))

    for q in questions:
        q_id = q.id if hasattr(q, "id") else q.get("id")
        q_type = q.question_type if hasattr(q, "question_type") else q.get("question_type", "multiple_choice")
        correct_ans = (q.correct_answer if hasattr(q, "correct_answer") else q.get("correct_answer", "")).strip()
        explanation = q.explanation if hasattr(q, "explanation") else q.get("explanation", "")
        citation = q.source_citation if hasattr(q, "source_citation") else q.get("source_citation", "")
        excerpt = q.source_excerpt if hasattr(q, "source_excerpt") else q.get("source_excerpt", "")

        student_resp = str(submitted_answers.get(q_id, "")).strip()

        is_correct = False
        earned = 0.0
        feedback = ""

        if q_type == "multiple_choice":
            # Compare lowercase
            if student_resp.lower() == correct_ans.lower():
                is_correct = True
                earned = 1.0
                feedback = f"Correct. {explanation}"
            else:
                is_correct = False
                earned = 0.0
                feedback = f"Incorrect. Selected '{student_resp}'. Grounded answer: '{correct_ans}'. {explanation}"

        elif q_type == "true_false":
            norm_student = student_resp.lower()
            norm_correct = correct_ans.lower()
            if norm_student == norm_correct:
                is_correct = True
                earned = 1.0
                feedback = f"Correct. {explanation}"
            else:
                is_correct = False
                earned = 0.0
                feedback = f"Incorrect. Statement was {correct_ans}. {explanation}"

        elif q_type in ["short_answer", "conceptual_scenario"]:
            # If question has options, treat as selectable
            raw_options = q.options if hasattr(q, "options") else q.get("options", "[]")
            if isinstance(raw_options, str):
                import json
                try:
                    options_list = json.loads(raw_options)
                except Exception:
                    options_list = []
            else:
                options_list = raw_options

            if options_list and len(options_list) > 0:
                if student_resp.lower() == correct_ans.lower():
                    is_correct = True
                    earned = 1.0
                    feedback = f"Correct. {explanation}"
                else:
                    is_correct = False
                    earned = 0.0
                    feedback = f"Incorrect. Expected: '{correct_ans}'. {explanation}"
            else:
                # Semantic / keyword overlap check
                key_terms = [w.lower() for w in re.findall(r"\b[a-zA-Z]{4,}\b", correct_ans)]
                student_words = set(re.findall(r"\b[a-zA-Z]{4,}\b", student_resp.lower()))

                if not student_resp:
                    is_correct = False
                    earned = 0.0
                    feedback = f"No answer provided. Expected concept: {correct_ans}."
                else:
                    overlap_count = sum(1 for term in key_terms if term in student_words)
                    ratio = overlap_count / max(1, len(key_terms))

                    if ratio >= 0.4 or len(student_resp) > 25 and any(t in student_resp.lower() for t in key_terms):
                        is_correct = True
                        earned = 1.0
                        feedback = f"Excellent reasoning! Captured core principles: {correct_ans[:100]}... {explanation}"
                    elif ratio >= 0.2:
                        is_correct = True
                        earned = 0.5
                        feedback = f"Partial credit (0.5/1.0). Key concepts partially addressed. Reference: {correct_ans}. {explanation}"
                    else:
                        is_correct = False
                        earned = 0.0
                        feedback = f"Concept not sufficiently articulated. Expected: {correct_ans}. {explanation}"

        total_earned += earned
        evaluations.append({
            "question_id": q_id,
            "student_response": student_resp,
            "is_correct": is_correct,
            "score": earned,
            "correct_answer": correct_ans,
            "explanation": explanation,
            "source_citation": citation,
            "source_excerpt": excerpt,
            "feedback": feedback
        })

    percentage = round((total_earned / max(1.0, max_possible)) * 100.0, 1)

    return {
        "total_score": total_earned,
        "max_score": max_possible,
        "percentage": percentage,
        "evaluations": evaluations
    }
