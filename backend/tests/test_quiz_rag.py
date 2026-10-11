import pytest
import os
import json
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.init_db import init_db
from backend.app.services.document_extraction import extract_document_content
from backend.app.services.chunking import chunk_text
from backend.app.services.vector_store import vector_store
from backend.app.services.quiz_generator import generate_rag_quiz, regenerate_single_question
from backend.app.services.quiz_grading import evaluate_quiz_answers

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    init_db()

def test_multi_format_txt_and_md_extraction(tmp_path):
    # Test TXT
    txt_file = tmp_path / "lecture.txt"
    txt_file.write_text("Binary Search Trees. A binary search tree is a rooted binary tree data structure with the key of each internal node being greater than all the keys in the node's left subtree and less than those in its right subtree.")
    res_txt = extract_document_content(str(txt_file), "lecture.txt")
    assert res_txt["unit_type"] == "section"
    assert len(res_txt["units"]) >= 1
    assert "binary search tree" in res_txt["units"][0]["text"].lower()

    # Test Markdown
    md_file = tmp_path / "notes.md"
    md_file.write_text("# Graph Theory\n\nGraphs consist of vertices and edges.\n\n## Dijkstra Algorithm\n\nDijkstra algorithm finds the shortest paths between nodes in a graph with non-negative edge weights.")
    res_md = extract_document_content(str(md_file), "notes.md")
    assert res_md["unit_type"] == "section"
    assert len(res_md["units"]) >= 2
    assert "dijkstra" in res_md["units"][1]["text"].lower()

def test_legacy_ppt_and_empty_file_rejection(tmp_path):
    # Legacy PPT should raise descriptive ValueError
    ppt_file = tmp_path / "slides.ppt"
    ppt_file.write_text("dummy")
    with pytest.raises(ValueError) as exc:
        extract_document_content(str(ppt_file), "slides.ppt")
    assert "convert" in str(exc.value).lower()
    assert ".pptx" in str(exc.value).lower()

    # Empty TXT should raise ValueError
    empty_file = tmp_path / "empty.txt"
    empty_file.write_text("")
    with pytest.raises(ValueError) as exc_empty:
        extract_document_content(str(empty_file), "empty.txt")
    assert "empty" in str(exc_empty.value).lower()

def test_vector_store_multi_document_filter_and_deletion():
    # Add chunks for doc 101 and doc 102
    chunks_101 = [
        {
            "chunk_id": "c1_d101_u1_chk1",
            "course_id": 1,
            "document_id": 101,
            "document_name": "Doc101.pdf",
            "page": 1,
            "unit_type": "page",
            "unit_number": 1,
            "text": "Quicksort divides a large array into two smaller sub-arrays using a pivot."
        }
    ]
    chunks_102 = [
        {
            "chunk_id": "c1_d102_u1_chk1",
            "course_id": 1,
            "document_id": 102,
            "document_name": "Doc102.pptx",
            "page": 1,
            "unit_type": "slide",
            "unit_number": 1,
            "text": "Mergesort is a divide and conquer algorithm that splits arrays into halves and merges them."
        }
    ]
    vector_store.add_chunks(chunks_101)
    vector_store.add_chunks(chunks_102)

    # Search filtered to doc 101 only
    results_101 = vector_store.search("algorithm", course_id=1, document_id=101, top_k=2)
    assert len(results_101) > 0
    for r in results_101:
        assert r["metadata"]["document_id"] == 101

    # Delete doc 101 chunks
    vector_store.delete_document_chunks(101)
    results_after_del = vector_store.search("algorithm", course_id=1, document_id=101, top_k=2)
    # Shouldn't find doc 101
    for r in results_after_del:
        assert r["metadata"].get("document_id") != 101

def test_rag_quiz_generation_and_evidence_trace():
    docs_meta = [
        {
            "id": 1,
            "filename": "Course_Notes_Recursion.pdf",
            "unit_type": "page",
            "unit_count": 18,
            "chunk_count": 12
        }
    ]
    quiz_res = generate_rag_quiz(
        course_id=1,
        document_ids=[1],
        documents_meta=docs_meta,
        topic="Base Case and Stack Memory",
        num_questions=3,
        difficulty="intermediate",
        question_types=["multiple_choice", "true_false", "short_answer"]
    )

    assert "questions" in quiz_res
    assert len(quiz_res["questions"]) == 3
    assert "rag_trace" in quiz_res

    trace = quiz_res["rag_trace"]
    assert "selected_sources" in trace
    assert trace["retrieved_evidence_count"] > 0
    assert "generation_mode" in trace
    assert len(trace["trace_steps"]) >= 3

    # Check evidence citations on every question
    for q in quiz_res["questions"]:
        assert q["source_citation"] != ""
        assert q["source_excerpt"] != ""
        assert q["similarity_score"] > 0.0
        assert q["generation_reason"] != ""
        assert q["is_validated"] is True

def test_quiz_grading_evaluation():
    class MockQuestion:
        def __init__(self, id, q_type, correct, explanation=""):
            self.id = id
            self.question_type = q_type
            self.correct_answer = correct
            self.explanation = explanation
            self.source_citation = "Notes — Page 1"
            self.source_excerpt = "Sample excerpt"
            self.options = "[]"

    questions = [
        MockQuestion(1, "multiple_choice", "Halts recursion and unwinds call stack"),
        MockQuestion(2, "true_false", "True"),
        MockQuestion(3, "short_answer", "Activation frames popped when base case is reached")
    ]

    # Student answers: Q1 correct, Q2 wrong, Q3 conceptually strong
    student_answers = {
        1: "Halts recursion and unwinds call stack",
        2: "False",
        3: "Activation frames are popped from stack on base case"
    }

    eval_result = evaluate_quiz_answers(questions, student_answers)
    assert eval_result["total_score"] >= 2.0  # Q1 is 1.0, Q3 is 1.0 or 0.5
    assert len(eval_result["evaluations"]) == 3
    assert eval_result["evaluations"][0]["is_correct"] is True
    assert eval_result["evaluations"][1]["is_correct"] is False

def test_quiz_api_lifecycle():
    # 1. List quizzes
    list_res = client.get("/api/courses/1/quizzes")
    assert list_res.status_code == 200
    quizzes = list_res.json()
    assert len(quizzes) >= 1
    quiz_id = quizzes[0]["id"]

    # 2. Get specific quiz
    quiz_detail = client.get(f"/api/quizzes/{quiz_id}")
    assert quiz_detail.status_code == 200
    q_data = quiz_detail.json()
    assert len(q_data["questions"]) >= 1

    # 3. Submit attempt
    attempt_payload = {
        "quiz_id": quiz_id,
        "student_id": 1,
        "mode": "practice",
        "answers": {
            q_data["questions"][0]["id"]: q_data["questions"][0]["correct_answer"]
        }
    }
    submit_res = client.post(f"/api/quizzes/{quiz_id}/attempts", json=attempt_payload)
    assert submit_res.status_code == 200
    res_data = submit_res.json()
    assert res_data["score"] >= 1.0
    assert len(res_data["answers"]) >= 1
    assert res_data["answers"][0]["is_correct"] is True
