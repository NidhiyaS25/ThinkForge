import os
import shutil
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from backend.app.db.session import get_db
from backend.app.models.models import (
    Course, Document, Assignment, Student, Attempt,
    HintHistory, Reflection, TransferResult, KnowledgeNode,
    Quiz, QuizQuestion, QuizAttempt, QuizAnswer
)
from backend.app.schemas.schemas import (
    CourseResponse, CourseCreate, DocumentResponse,
    AssignmentResponse, AssignmentCreate,
    AttemptResponse, AttemptCreate,
    HintRequest, HintResponse,
    ReflectionCreate, ReflectionResponse,
    TransferSubmitRequest, TransferSubmitResponse,
    EvaluationRequest, EvaluationResponse,
    DefenseVerifyRequest, DefenseVerifyResponse,
    IndependenceMetricResponse,
    QuizGenerateRequest, QuizGenerateResponse,
    RegenerateQuestionRequest, QuizQuestionItem,
    QuizSaveRequest, QuizResponse,
    QuizAttemptSubmitRequest, QuizAttemptResultResponse
)
from backend.app.core.config import settings
from backend.app.services.document_extraction import extract_document_content
from backend.app.services.chunking import chunk_text
from backend.app.services.vector_store import vector_store
from backend.app.services.socratic_mentor import generate_socratic_hint
from backend.app.services.rag_evaluator import evaluate_submission_integrity, verify_student_defense
from backend.app.services.scoring import score_transfer_challenge
from backend.app.services.quiz_generator import generate_rag_quiz, regenerate_single_question
from backend.app.services.quiz_grading import evaluate_quiz_answers

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

# DOCUMENTS / MULTI-FORMAT RAG INGESTION
@router.get("/courses/{course_id}/documents", response_model=List[DocumentResponse])
def list_documents(course_id: int, db: Session = Depends(get_db)):
    return db.query(Document).filter(Document.course_id == course_id).all()

@router.post("/courses/{course_id}/documents", response_model=DocumentResponse)
async def upload_document(course_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = [".pdf", ".pptx", ".docx", ".txt", ".text", ".md", ".markdown"]

    if ext == ".ppt":
        raise HTTPException(
            status_code=400,
            detail="Legacy PowerPoint .ppt is not supported. Please convert your presentation to .pptx before uploading."
        )

    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Supported formats: .pdf, .pptx, .docx, .txt, .md"
        )

    # Save to upload dir
    clean_filename = f"{course_id}_{os.path.basename(file.filename)}"
    file_path = os.path.join(settings.UPLOAD_DIR, clean_filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # File size validation (limit to 30MB)
    size_mb = os.path.getsize(file_path) / (1024 * 1024)
    if size_mb > 30.0:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail="File size exceeds maximum allowed limit of 30MB.")

    try:
        # Extract text preserving unit metadata
        extraction_result = extract_document_content(file_path, file.filename)
        unit_type = extraction_result["unit_type"]
        unit_count = extraction_result["unit_count"]
        units = extraction_result["units"]

        # Generate preview
        preview_text = "\n".join([u["text"] for u in units[:3]])[:800]

        file_type_clean = ext.lstrip(".").lower()
        if file_type_clean in ["text", "txt"]:
            file_type_clean = "txt"
        elif file_type_clean in ["markdown", "md"]:
            file_type_clean = "md"

        doc = Document(
            course_id=course_id,
            filename=file.filename,
            storage_path=file_path,
            file_type=file_type_clean,
            unit_type=unit_type,
            unit_count=unit_count,
            page_count=unit_count,  # backward compatibility
            extracted_preview=preview_text,
            status="indexing"
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        # Chunk text
        chunks = chunk_text(
            pages_data=units,
            course_id=course_id,
            document_id=doc.id,
            document_name=file.filename
        )

        # Index in ChromaDB
        vector_store.add_chunks(chunks)

        doc.chunk_count = len(chunks)
        doc.status = "indexed"
        db.commit()
        db.refresh(doc)
        return doc
    except ValueError as ve:
        db.rollback()
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        db.rollback()
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to process and index document: {str(e)}")

@router.get("/documents/{document_id}/preview")
def get_document_preview(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {
        "id": doc.id,
        "filename": doc.filename,
        "file_type": doc.file_type,
        "unit_type": doc.unit_type,
        "unit_count": doc.unit_count,
        "chunk_count": doc.chunk_count,
        "preview": doc.extracted_preview or "No preview available"
    }

@router.delete("/documents/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove vector chunks from ChromaDB
    vector_store.delete_document_chunks(doc.id)

    # Remove storage file if exists
    if os.path.exists(doc.storage_path):
        try:
            os.remove(doc.storage_path)
        except Exception:
            pass

    db.delete(doc)
    db.commit()
    return {"status": "success", "message": f"Document '{doc.filename}' and its vector records were deleted safely."}

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

# ----------------- RAG QUIZ ENDPOINTS -----------------

@router.post("/courses/{course_id}/quizzes/generate", response_model=QuizGenerateResponse)
def generate_quiz(course_id: int, req: QuizGenerateRequest, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Fetch selected documents
    docs = db.query(Document).filter(
        Document.course_id == course_id,
        Document.id.in_(req.document_ids)
    ).all()

    if not docs:
        raise HTTPException(status_code=400, detail="No valid documents selected for this course.")

    docs_meta = [
        {
            "id": d.id,
            "filename": d.filename,
            "unit_type": d.unit_type,
            "unit_count": d.unit_count,
            "page_count": d.page_count,
            "chunk_count": d.chunk_count
        }
        for d in docs
    ]

    generated_data = generate_rag_quiz(
        course_id=course_id,
        document_ids=[d.id for d in docs],
        documents_meta=docs_meta,
        topic=req.topic,
        num_questions=req.num_questions,
        difficulty=req.difficulty,
        question_types=req.question_types,
        feedback_policy=req.feedback_policy,
        show_citations=req.show_citations,
        include_explanations=req.include_explanations
    )

    return generated_data

@router.post("/quizzes/regenerate-question")
def regenerate_question(req: RegenerateQuestionRequest, db: Session = Depends(get_db)):
    q = regenerate_single_question(
        course_id=req.course_id,
        document_ids=req.document_ids,
        topic=req.topic,
        question_type=req.question_type,
        difficulty=req.difficulty,
        current_question_text=req.current_question_text or ""
    )
    return q

@router.post("/courses/{course_id}/quizzes", response_model=QuizResponse)
def save_quiz(course_id: int, req: QuizSaveRequest, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    quiz = Quiz(
        course_id=course_id,
        title=req.title,
        topic=req.topic,
        difficulty=req.difficulty,
        selected_document_ids=json.dumps(req.selected_document_ids),
        selected_document_names=json.dumps(req.selected_document_names),
        feedback_policy=req.feedback_policy,
        show_citations=req.show_citations,
        include_explanations=req.include_explanations,
        status=req.status,
        rag_trace=json.dumps(req.rag_trace)
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    # Save questions
    for idx, q_data in enumerate(req.questions):
        q = QuizQuestion(
            quiz_id=quiz.id,
            order=idx + 1,
            question_type=q_data.question_type,
            question_text=q_data.question_text,
            options=json.dumps(q_data.options),
            correct_answer=q_data.correct_answer,
            explanation=q_data.explanation,
            source_citation=q_data.source_citation,
            source_excerpt=q_data.source_excerpt,
            chunk_id=q_data.chunk_id or "",
            retrieval_rank=q_data.retrieval_rank,
            similarity_score=q_data.similarity_score,
            generation_reason=q_data.generation_reason,
            is_validated=q_data.is_validated
        )
        db.add(q)
    db.commit()
    db.refresh(quiz)

    # Format response
    questions_list = []
    for q in quiz.questions:
        opts = json.loads(q.options) if q.options else []
        questions_list.append(QuizQuestionItem(
            id=q.id,
            question_text=q.question_text,
            question_type=q.question_type,
            options=opts,
            correct_answer=q.correct_answer,
            explanation=q.explanation,
            source_citation=q.source_citation,
            source_excerpt=q.source_excerpt,
            chunk_id=q.chunk_id,
            retrieval_rank=q.retrieval_rank,
            similarity_score=q.similarity_score,
            generation_reason=q.generation_reason,
            is_validated=q.is_validated,
            order=q.order
        ))

    return QuizResponse(
        id=quiz.id,
        course_id=quiz.course_id,
        title=quiz.title,
        topic=quiz.topic,
        difficulty=quiz.difficulty,
        selected_document_ids=json.loads(quiz.selected_document_ids) if quiz.selected_document_ids else [],
        selected_document_names=json.loads(quiz.selected_document_names) if quiz.selected_document_names else [],
        feedback_policy=quiz.feedback_policy,
        show_citations=quiz.show_citations,
        include_explanations=quiz.include_explanations,
        status=quiz.status,
        questions_count=len(questions_list),
        rag_trace=json.loads(quiz.rag_trace) if quiz.rag_trace else {},
        created_at=quiz.created_at,
        questions=questions_list
    )

@router.get("/courses/{course_id}/quizzes", response_model=List[QuizResponse])
def list_quizzes(course_id: int, db: Session = Depends(get_db)):
    quizzes = db.query(Quiz).filter(Quiz.course_id == course_id).order_by(Quiz.created_at.desc()).all()
    resp = []
    for q in quizzes:
        resp.append(QuizResponse(
            id=q.id,
            course_id=q.course_id,
            title=q.title,
            topic=q.topic,
            difficulty=q.difficulty,
            selected_document_ids=json.loads(q.selected_document_ids) if q.selected_document_ids else [],
            selected_document_names=json.loads(q.selected_document_names) if q.selected_document_names else [],
            feedback_policy=q.feedback_policy,
            show_citations=q.show_citations,
            include_explanations=q.include_explanations,
            status=q.status,
            questions_count=len(q.questions),
            rag_trace=json.loads(q.rag_trace) if q.rag_trace else {},
            created_at=q.created_at,
            questions=[]
        ))
    return resp

@router.get("/quizzes/{quiz_id}", response_model=QuizResponse)
def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions_list = []
    for q in quiz.questions:
        opts = json.loads(q.options) if q.options else []
        questions_list.append(QuizQuestionItem(
            id=q.id,
            question_text=q.question_text,
            question_type=q.question_type,
            options=opts,
            correct_answer=q.correct_answer,
            explanation=q.explanation,
            source_citation=q.source_citation,
            source_excerpt=q.source_excerpt,
            chunk_id=q.chunk_id,
            retrieval_rank=q.retrieval_rank,
            similarity_score=q.similarity_score,
            generation_reason=q.generation_reason,
            is_validated=q.is_validated,
            order=q.order
        ))

    return QuizResponse(
        id=quiz.id,
        course_id=quiz.course_id,
        title=quiz.title,
        topic=quiz.topic,
        difficulty=quiz.difficulty,
        selected_document_ids=json.loads(quiz.selected_document_ids) if quiz.selected_document_ids else [],
        selected_document_names=json.loads(quiz.selected_document_names) if quiz.selected_document_names else [],
        feedback_policy=quiz.feedback_policy,
        show_citations=quiz.show_citations,
        include_explanations=quiz.include_explanations,
        status=quiz.status,
        questions_count=len(questions_list),
        rag_trace=json.loads(quiz.rag_trace) if quiz.rag_trace else {},
        created_at=quiz.created_at,
        questions=questions_list
    )

@router.post("/quizzes/{quiz_id}/attempts", response_model=QuizAttemptResultResponse)
def submit_quiz_attempt(quiz_id: int, req: QuizAttemptSubmitRequest, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    student = db.query(Student).filter(Student.id == req.student_id).first()
    if not student:
        student = db.query(Student).first()
        student_id = student.id if student else 1
    else:
        student_id = student.id

    # Grade attempt
    eval_result = evaluate_quiz_answers(quiz.questions, req.answers)

    # Persist attempt
    attempt = QuizAttempt(
        quiz_id=quiz.id,
        student_id=student_id,
        mode=req.mode,
        score=eval_result["total_score"],
        max_score=eval_result["max_score"],
        status="submitted"
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    # Persist answers
    for eval_item in eval_result["evaluations"]:
        ans = QuizAnswer(
            attempt_id=attempt.id,
            question_id=eval_item["question_id"],
            student_response=eval_item["student_response"],
            is_correct=eval_item["is_correct"],
            score=eval_item["score"],
            feedback=eval_item["feedback"]
        )
        db.add(ans)
    db.commit()

    return {
        "attempt_id": attempt.id,
        "quiz_id": quiz.id,
        "score": eval_result["total_score"],
        "max_score": eval_result["max_score"],
        "percentage": eval_result["percentage"],
        "status": "submitted",
        "mode": req.mode,
        "answers": eval_result["evaluations"],
        "created_at": attempt.submitted_at
    }

@router.get("/quizzes/{quiz_id}/attempts")
def list_quiz_attempts(quiz_id: int, db: Session = Depends(get_db)):
    attempts = db.query(QuizAttempt).filter(QuizAttempt.quiz_id == quiz_id).order_by(QuizAttempt.submitted_at.desc()).all()
    return [
        {
            "id": a.id,
            "student_id": a.student_id,
            "mode": a.mode,
            "score": a.score,
            "max_score": a.max_score,
            "percentage": round((a.score / max(1.0, a.max_score)) * 100.0, 1),
            "submitted_at": a.submitted_at
        }
        for a in attempts
    ]
