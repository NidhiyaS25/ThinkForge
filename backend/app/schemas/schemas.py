from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

class CourseBase(BaseModel):
    title: str
    description: Optional[str] = ""

class CourseCreate(CourseBase):
    pass

class CourseResponse(CourseBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class DocumentResponse(BaseModel):
    id: int
    course_id: int
    filename: str
    file_type: str = "pdf"
    unit_type: str = "page"
    unit_count: int = 0
    page_count: int = 0
    chunk_count: int = 0
    status: str
    error_message: Optional[str] = None
    extracted_preview: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AssignmentBase(BaseModel):
    title: str
    instructions: str
    starter_code: Optional[str] = ""
    rubric: Optional[str] = ""
    target_time_seconds: int = 600
    complexity_depth: str = "intermediate"
    transfer_question: Optional[str] = ""
    transfer_expected_answer: Optional[str] = ""

class AssignmentCreate(AssignmentBase):
    course_id: int

class AssignmentResponse(AssignmentBase):
    id: int
    course_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AttemptCreate(BaseModel):
    assignment_id: int
    student_id: int
    content: str
    focus_violations: int = 0
    submission_time_seconds: int = 0

class AttemptResponse(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    content: str
    version: int
    is_initial: bool
    focus_violations: int
    defense_status: str
    submission_time_seconds: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Citation(BaseModel):
    document_name: str
    page: int
    excerpt: Optional[str] = None

class HintRequest(BaseModel):
    attempt_id: int
    level: int = Field(ge=1, le=3, description="Assistance level: 1 (Clarifying), 2 (Conceptual), 3 (Partial Outline)")
    student_query: Optional[str] = ""

class HintResponse(BaseModel):
    hint_text: str
    level: int
    citations: List[Citation] = []
    created_at: datetime

class ReflectionCreate(BaseModel):
    attempt_id: int
    reflection_text: str

class ReflectionResponse(BaseModel):
    id: int
    attempt_id: int
    reflection_text: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TransferSubmitRequest(BaseModel):
    assignment_id: int
    student_id: int
    response_text: str

class TransferSubmitResponse(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    score: float
    max_score: float
    feedback: str
    created_at: datetime

class EvaluationRequest(BaseModel):
    assignment_id: int
    student_id: int
    attempt_content: str
    submission_time_seconds: int
    focus_violations: int

class EvaluationResponse(BaseModel):
    flagged: bool
    reason: Optional[str] = None
    defense_required: bool
    defense_question: Optional[str] = None
    targeted_concept: Optional[str] = None
    knowledge_nodes: List[Dict[str, Any]] = []

class DefenseVerifyRequest(BaseModel):
    assignment_id: int
    student_id: int
    concept_name: str
    defense_response: str

class DefenseVerifyResponse(BaseModel):
    verified: bool
    feedback: str
    updated_nodes: List[Dict[str, Any]]

class IndependenceMetricResponse(BaseModel):
    student_id: int
    initial_attempt_submitted_before_hint: bool
    total_hints_used: int
    hint_levels_breakdown: Dict[int, int]
    total_revisions: int
    reflection_completed: bool
    focus_violations_count: int
    transfer_score: Optional[float] = None
    independent_mastery_level: str

# ----------------- RAG QUIZ SCHEMAS -----------------

class QuizQuestionItem(BaseModel):
    id: Optional[int] = None
    question_text: str
    question_type: str = "multiple_choice"  # multiple_choice, true_false, short_answer, conceptual_scenario
    options: List[str] = []
    correct_answer: str
    explanation: str = ""
    source_citation: str = ""
    source_excerpt: str = ""
    chunk_id: Optional[str] = ""
    retrieval_rank: int = 1
    similarity_score: float = 0.85
    generation_reason: str = ""
    is_validated: bool = True
    order: int = 1

class RAGTraceInfo(BaseModel):
    selected_sources: List[str] = []
    total_units: int = 0
    indexed_chunks: int = 0
    retrieval_query: str = ""
    retrieved_evidence_count: int = 0
    selected_context_chunks: int = 0
    generation_mode: str = "RAG Grounded Generation"
    source_validation_status: str = "Passed"
    trace_steps: List[str] = []
    raw_chunks: List[Dict[str, Any]] = []

class QuizGenerateRequest(BaseModel):
    course_id: int
    document_ids: List[int]
    title: str = "Course Knowledge Assessment"
    topic: str = ""
    num_questions: int = Field(default=5, ge=1, le=20)
    difficulty: str = "intermediate"
    question_types: List[str] = ["multiple_choice", "true_false", "short_answer", "conceptual_scenario"]
    feedback_policy: str = "immediate_practice"
    show_citations: bool = True
    include_explanations: bool = True

class QuizGenerateResponse(BaseModel):
    title: str
    topic: str
    difficulty: str
    questions: List[QuizQuestionItem]
    rag_trace: RAGTraceInfo

class RegenerateQuestionRequest(BaseModel):
    course_id: int
    document_ids: List[int]
    topic: str
    question_type: str
    difficulty: str = "intermediate"
    current_question_text: Optional[str] = ""

class QuizSaveRequest(BaseModel):
    course_id: int
    title: str
    topic: str = ""
    difficulty: str = "intermediate"
    selected_document_ids: List[int] = []
    selected_document_names: List[str] = []
    feedback_policy: str = "immediate_practice"
    show_citations: bool = True
    include_explanations: bool = True
    status: str = "published"  # draft, published
    rag_trace: Dict[str, Any] = {}
    questions: List[QuizQuestionItem]

class QuizResponse(BaseModel):
    id: int
    course_id: int
    title: str
    topic: str
    difficulty: str
    selected_document_ids: List[int] = []
    selected_document_names: List[str] = []
    feedback_policy: str
    show_citations: bool
    include_explanations: bool
    status: str
    questions_count: int = 0
    rag_trace: Optional[Dict[str, Any]] = None
    created_at: datetime
    questions: Optional[List[QuizQuestionItem]] = None
    model_config = ConfigDict(from_attributes=True)

class QuizAttemptSubmitRequest(BaseModel):
    quiz_id: int
    student_id: int = 1
    mode: str = "assessment"  # practice, assessment
    answers: Dict[int, str]  # question_id -> student answer string

class QuizAnswerEvaluation(BaseModel):
    question_id: int
    student_response: str
    is_correct: bool
    score: float
    correct_answer: str
    explanation: str
    source_citation: str
    source_excerpt: str
    feedback: str

class QuizAttemptResultResponse(BaseModel):
    attempt_id: int
    quiz_id: int
    score: float
    max_score: float
    percentage: float
    status: str
    mode: str
    answers: List[QuizAnswerEvaluation]
    created_at: datetime
