import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.init_db import init_db
from backend.app.services.chunking import chunk_text
from backend.app.services.scoring import score_transfer_challenge
from backend.app.services.rag_evaluator import evaluate_submission_integrity, verify_student_defense
from backend.app.services.socratic_mentor import generate_socratic_hint

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    init_db()

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "ThinkForge"
    assert "Forge it" in data["tagline"]

def test_chunking_metadata_preservation():
    pages = [
        {"page": 1, "text": "This is page 1 content. " * 30},
        {"page": 12, "text": "Base Cases in Recursion. A base case stops infinite recursion. " * 25}
    ]
    chunks = chunk_text(pages, course_id=1, document_id=1, chunk_size=50, overlap=10)
    assert len(chunks) > 1
    # Check that metadata is preserved
    for chk in chunks:
        assert chk["course_id"] == 1
        assert chk["document_id"] == 1
        assert chk["page"] in [1, 12]
        assert "chunk_id" in chk

def test_mentor_progressive_hint_levels():
    contexts = [{
        "text": "Base Cases in Recursion: Without a base case, recursion continues infinitely.",
        "metadata": {"document_name": "Course Notes - Page 12", "page": 12}
    }]
    # Level 1
    h1 = generate_socratic_hint("Recursion", "Write factorial", "def factorial(n):", 1, contexts)
    assert h1["level"] == 1
    assert "base case" in h1["hint_text"].lower()
    assert len(h1["citations"]) > 0

    # Level 2
    h2 = generate_socratic_hint("Recursion", "Write factorial", "def factorial(n):", 2, contexts)
    assert h2["level"] == 2
    assert "call stack" in h2["hint_text"].lower() or "base case" in h2["hint_text"].lower()

    # Level 3
    h3 = generate_socratic_hint("Recursion", "Write factorial", "def factorial(n):", 3, contexts)
    assert h3["level"] == 3
    assert "scaffold" in h3["hint_text"].lower() or "guard" in h3["hint_text"].lower()

def test_anti_cheat_evaluation_and_defense_trigger():
    # Suspiciously fast submission (< 60s) with focus violations
    result = evaluate_submission_integrity(
        attempt_content="def factorial(n):\n    return 1 if n <= 1 else n * factorial(n - 1)",
        submission_time_seconds=15,  # 15s is suspiciously fast
        focus_violations=2,
        target_time_seconds=420
    )
    assert result["flagged"] is True
    assert result["defense_required"] is True
    assert "Defense Required" in result["defense_question"]

def test_socratic_defense_verification():
    # Student responds with good conceptual depth
    defense = verify_student_defense(
        concept_name="Call Stack Unwinding",
        defense_response="When the base case returns 1, each frame is popped off the call stack and multiplied by n until the initial call completes."
    )
    assert defense["verified"] is True

    # Poor response
    poor_defense = verify_student_defense(
        concept_name="Call Stack Unwinding",
        defense_response="I just ran the code and it worked."
    )
    assert poor_defense["verified"] is False

def test_deterministic_transfer_scoring():
    good_code = """
def fibonacci(n):
    if n <= 0:
        return 0
    if n == 1:
        return 1
    return fibonacci(n - 1) + fibonacci(n - 2)
"""
    result = score_transfer_challenge(good_code, expected_answer="", rubric="")
    assert result["score"] >= 90.0

def test_get_assignments_and_independence_profile():
    # List assignments
    resp = client.get("/api/assignments")
    assert resp.status_code == 200
    assignments = resp.json()
    assert len(assignments) >= 1
    assert assignments[0]["title"] == "Understanding Recursion"

    # Check independence profile
    resp_indep = client.get("/api/students/1/independence")
    assert resp_indep.status_code == 200
    data = resp_indep.json()
    assert "independent_mastery_level" in data
    assert "total_hints_used" in data
