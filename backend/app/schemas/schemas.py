from pydantic import BaseModel, Field
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
    class Config:
        from_attributes = True

class DocumentResponse(BaseModel):
    id: int
    course_id: int
    filename: str
    page_count: int
    chunk_count: int
    status: str
    error_message: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

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
    class Config:
        from_attributes = True

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
    class Config:
        from_attributes = True

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
    class Config:
        from_attributes = True

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
