import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from backend.app.db.session import get_db
from backend.app.models.models import Course, Document, Assignment, Student, Attempt, HintHistory, Reflection, TransferResult, KnowledgeNode
from backend.app.schemas.schemas import (
    CourseResponse, CourseCreate, DocumentResponse,
    AssignmentResponse, AssignmentCreate,
    AttemptResponse, AttemptCreate,
    HintRequest, HintResponse,
    ReflectionCreate, ReflectionResponse,
    TransferSubmitRequest, TransferSubmitResponse,
    EvaluationRequest, EvaluationResponse,
    DefenseVerifyRequest, DefenseVerifyResponse,
    IndependenceMetricResponse
)
from backend.app.core.config import settings
from backend.app.services.pdf_extraction import extract_text_from_pdf
from backend.app.services.chunking import chunk_text
from backend.app.services.vector_store import vector_store
from backend.app.services.socratic_mentor import generate_socratic_hint
from backend.app.services.rag_evaluator import evaluate_submission_integrity, verify_student_defense
from backend.app.services.scoring import score_transfer_challenge

router = APIRouter(prefix="/api")

@router.get("/health")
def health_check():
    return {"status": "ok", "app": "ThinkForge", "tagline": "Don't replace thinking. Forge it."}

# COURSES
@router.get("/courses", response_model=List[CourseResponse])
def list_courses(db: Session = Depends(get_db)):
    return db.query(Course).all()

@router.post("/courses", response_model=CourseResponse)
def create_course(course_in: CourseCreate, db: Session = Depends(get_db)):
    course = Course(title=course_in.title, description=course_in.description)
    db.add(course)
    db.commit()
    db.refresh(course)
    return course

# DOCUMENTS / PDF RAG
@router.get("/courses/{course_id}/documents", response_model=List[DocumentResponse])
def list_documents(course_id: int, db: Session = Depends(get_db)):
    return db.query(Document).filter(Document.course_id == course_id).all()

@router.post("/courses/{course_id}/documents", response_model=DocumentResponse)
async def upload_document(course_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF documents are supported.")

    file_path = os.path.join(settings.UPLOAD_DIR, f"{course_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        pages = extract_text_from_pdf(file_path)
        doc = Document(
            course_id=course_id,
            filename=file.filename,
            storage_path=file_path,
            page_count=len(pages),
            status="indexing"
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        chunks = chunk_text(pages, course_id=course_id, document_id=doc.id)
        vector_store.add_chunks(chunks)

        doc.chunk_count = len(chunks)
        doc.status = "indexed"
        db.commit()
        db.refresh(doc)
        return doc
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to index PDF: {str(e)}")

# ASSIGNMENTS
@router.get("/assignments", response_model=List[AssignmentResponse])
def list_assignments(db: Session = Depends(get_db)):
    return db.query(Assignment).all()

@router.get("/assignments/{assignment_id}", response_model=AssignmentResponse)
def get_assignment(assignment_id: int, db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment

@router.post("/assignments", response_model=AssignmentResponse)
def create_assignment(assign_in: AssignmentCreate, db: Session = Depends(get_db)):
    assignment = Assignment(
        course_id=assign_in.course_id,
        title=assign_in.title,
        instructions=assign_in.instructions,
        starter_code=assign_in.starter_code,
        rubric=assign_in.rubric,
        target_time_seconds=assign_in.target_time_seconds,
        complexity_depth=assign_in.complexity_depth,
        transfer_question=assign_in.transfer_question,
        transfer_expected_answer=assign_in.transfer_expected_answer
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment

# ATTEMPTS & REVISIONS
@router.post("/attempts", response_model=AttemptResponse)
def save_attempt(attempt_in: AttemptCreate, db: Session = Depends(get_db)):
    # Check if there is an existing attempt
    existing = db.query(Attempt).filter(
        Attempt.assignment_id == attempt_in.assignment_id,
        Attempt.student_id == attempt_in.student_id
    ).order_by(Attempt.version.desc()).first()

    version = 1 if not existing else existing.version + 1
    is_initial = True if not existing else False

    attempt = Attempt(
        assignment_id=attempt_in.assignment_id,
        student_id=attempt_in.student_id,
        content=attempt_in.content,
        version=version,
        is_initial=is_initial,
        focus_violations=attempt_in.focus_violations,
        submission_time_seconds=attempt_in.submission_time_seconds
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt

# SOCRATIC MENTOR HINTS
@router.post("/mentor/hint", response_model=HintResponse)
def request_hint(req: HintRequest, db: Session = Depends(get_db)):
    attempt = db.query(Attempt).filter(Attempt.id == req.attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found. You must save an initial attempt before requesting hints.")

    assignment = db.query(Assignment).filter(Assignment.id == attempt.assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # RAG Retrieval: course scoped
    retrieved = vector_store.search(
        query=f"{assignment.title} {attempt.content}",
        course_id=assignment.course_id,
        top_k=3
    )

    hint_data = generate_socratic_hint(
        assignment_title=assignment.title,
        assignment_instructions=assignment.instructions,
        student_attempt=attempt.content,
        level=req.level,
        retrieved_contexts=retrieved,
        student_query=req.student_query
    )

    # Persist hint history
    hint_record = HintHistory(
        attempt_id=attempt.id,
        level=req.level,
        prompt=req.student_query or "",
        hint_text=hint_data["hint_text"],
        citations=str([c["document_name"] for c in hint_data["citations"]])
    )
    db.add(hint_record)
    db.commit()

    return hint_data

# REFLECTION
@router.post("/attempts/{attempt_id}/reflection", response_model=ReflectionResponse)
def save_reflection(attempt_id: int, req: ReflectionCreate, db: Session = Depends(get_db)):
    attempt = db.query(Attempt).filter(Attempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    existing_ref = db.query(Reflection).filter(Reflection.attempt_id == attempt_id).first()
    if existing_ref:
        existing_ref.reflection_text = req.reflection_text
        db.commit()
        db.refresh(existing_ref)
        return existing_ref

    reflection = Reflection(attempt_id=attempt_id, reflection_text=req.reflection_text)
    db.add(reflection)
    db.commit()
    db.refresh(reflection)
    return reflection

# EVALUATE SUBMISSION INTEGRITY & DEFENSE REQUIRED
@router.post("/evaluate-submission", response_model=EvaluationResponse)
def evaluate_submission(req: EvaluationRequest, db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == req.assignment_id).first()
    target_time = assignment.target_time_seconds if assignment else 420
    rubric = assignment.rubric if assignment else ""

    eval_result = evaluate_submission_integrity(
        attempt_content=req.attempt_content,
        submission_time_seconds=req.submission_time_seconds,
        focus_violations=req.focus_violations,
        target_time_seconds=target_time,
        rubric=rubric
    )

    # Update knowledge node if defense is required
    if eval_result["defense_required"] and eval_result["targeted_concept"]:
        node = db.query(KnowledgeNode).filter(
            KnowledgeNode.assignment_id == req.assignment_id,
            KnowledgeNode.concept_name == eval_result["targeted_concept"]
        ).first()
        if node:
            node.status = "defense_required"
            node.defense_question = eval_result["defense_question"]
            db.commit()

    nodes = db.query(KnowledgeNode).filter(KnowledgeNode.assignment_id == req.assignment_id).all()
    node_list = [{"id": n.id, "name": n.concept_name, "status": n.status} for n in nodes]

    return {
        "flagged": eval_result["flagged"],
        "reason": eval_result["reason"],
        "defense_required": eval_result["defense_required"],
        "defense_question": eval_result["defense_question"],
        "targeted_concept": eval_result["targeted_concept"],
        "knowledge_nodes": node_list
    }

# DEFENSE VERIFICATION
@router.post("/defense/verify", response_model=DefenseVerifyResponse)
def verify_defense(req: DefenseVerifyRequest, db: Session = Depends(get_db)):
    result = verify_student_defense(req.concept_name, req.defense_response)
    if result["verified"]:
        node = db.query(KnowledgeNode).filter(
            KnowledgeNode.assignment_id == req.assignment_id,
            KnowledgeNode.concept_name == req.concept_name
        ).first()
        if node:
            node.status = "verified"
            node.defense_response = req.defense_response
            db.commit()

    nodes = db.query(KnowledgeNode).filter(KnowledgeNode.assignment_id == req.assignment_id).all()
    node_list = [{"id": n.id, "name": n.concept_name, "status": n.status} for n in nodes]

    return {
        "verified": result["verified"],
        "feedback": result["feedback"],
        "updated_nodes": node_list
    }

# AI-DISABLED TRANSFER CHALLENGE SUBMISSION
@router.post("/transfer-challenges/{assignment_id}/submit", response_model=TransferSubmitResponse)
def submit_transfer(assignment_id: int, req: TransferSubmitRequest, db: Session = Depends(get_db)):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    scoring = score_transfer_challenge(
        student_response=req.response_text,
        expected_answer=assignment.transfer_expected_answer or "",
        rubric=assignment.rubric or ""
    )

    transfer_res = TransferResult(
        assignment_id=assignment_id,
        student_id=req.student_id,
        response_text=req.response_text,
        score=scoring["score"],
        max_score=scoring["max_score"],
        feedback=scoring["feedback"]
    )
    db.add(transfer_res)
    db.commit()
    db.refresh(transfer_res)

    return {
        "id": transfer_res.id,
        "assignment_id": transfer_res.assignment_id,
        "student_id": transfer_res.student_id,
        "score": transfer_res.score,
        "max_score": transfer_res.max_score,
        "feedback": transfer_res.feedback,
        "created_at": transfer_res.created_at
    }

# INDEPENDENCE PROFILE METRICS
@router.get("/students/{student_id}/independence", response_model=IndependenceMetricResponse)
def get_independence_metrics(student_id: int, db: Session = Depends(get_db)):
    attempts = db.query(Attempt).filter(Attempt.student_id == student_id).all()
    total_hints = db.query(HintHistory).join(Attempt).filter(Attempt.student_id == student_id).all()
    transfer = db.query(TransferResult).filter(TransferResult.student_id == student_id).first()

    breakdown = {1: 0, 2: 0, 3: 0}
    for h in total_hints:
        if h.level in breakdown:
            breakdown[h.level] += 1

    total_violations = sum(a.focus_violations for a in attempts)
    initial_before_hint = len(attempts) > 0 and len(total_hints) <= 3

    # Derive mastery level based on transfer score and hint reliance
    transfer_score = transfer.score if transfer else 0.0
    if transfer_score >= 80 and len(total_hints) <= 2:
        mastery = "High Independence (Forged Master)"
    elif transfer_score >= 60:
        mastery = "Progressing (Guided Practitioner)"
    else:
        mastery = "Scaffold Dependent (Needs Practice)"

    return {
        "student_id": student_id,
        "initial_attempt_submitted_before_hint": initial_before_hint,
        "total_hints_used": len(total_hints),
        "hint_levels_breakdown": breakdown,
        "total_revisions": max(0, len(attempts) - 1),
        "reflection_completed": any(a.reflection is not None for a in attempts),
        "focus_violations_count": total_violations,
        "transfer_score": transfer_score if transfer else None,
        "independent_mastery_level": mastery
    }

# KNOWLEDGE GRAPH NODES
@router.get("/assignments/{assignment_id}/knowledge-graph")
def get_knowledge_graph(assignment_id: int, db: Session = Depends(get_db)):
    nodes = db.query(KnowledgeNode).filter(KnowledgeNode.assignment_id == assignment_id).all()
    return [{"id": n.id, "name": n.concept_name, "status": n.status, "question": n.defense_question} for n in nodes]
