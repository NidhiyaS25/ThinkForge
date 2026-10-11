import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    documents = relationship("Document", back_populates="course", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="course", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="course", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    storage_path = Column(String(500), nullable=False)
    file_type = Column(String(20), default="pdf")
    unit_type = Column(String(30), default="page")  # page, slide, section
    unit_count = Column(Integer, default=0)
    page_count = Column(Integer, default=0)
    chunk_count = Column(Integer, default=0)
    status = Column(String(50), default="indexed")  # indexing, indexed, error
    error_message = Column(Text, nullable=True)
    extracted_preview = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    course = relationship("Course", back_populates="documents")

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    instructions = Column(Text, nullable=False)
    starter_code = Column(Text, default="")
    rubric = Column(Text, default="")
    target_time_seconds = Column(Integer, default=600)  # Pacing timer based on complexity
    complexity_depth = Column(String(50), default="intermediate")
    transfer_question = Column(Text, default="")
    transfer_expected_answer = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    course = relationship("Course", back_populates="assignments")
    attempts = relationship("Attempt", back_populates="assignment", cascade="all, delete-orphan")
    transfer_results = relationship("TransferResult", back_populates="assignment", cascade="all, delete-orphan")
    knowledge_nodes = relationship("KnowledgeNode", back_populates="assignment", cascade="all, delete-orphan")

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    attempts = relationship("Attempt", back_populates="student", cascade="all, delete-orphan")
    transfer_results = relationship("TransferResult", back_populates="student", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="student", cascade="all, delete-orphan")

class Attempt(Base):
    __tablename__ = "attempts"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    content = Column(Text, nullable=False)
    version = Column(Integer, default=1)
    is_initial = Column(Boolean, default=True)
    focus_violations = Column(Integer, default=0)
    defense_status = Column(String(50), default="normal")  # normal, defense_required, verified
    submission_time_seconds = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    assignment = relationship("Assignment", back_populates="attempts")
    student = relationship("Student", back_populates="attempts")
    hints = relationship("HintHistory", back_populates="attempt", cascade="all, delete-orphan")
    reflection = relationship("Reflection", back_populates="attempt", uselist=False, cascade="all, delete-orphan")

class HintHistory(Base):
    __tablename__ = "hint_histories"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("attempts.id"), nullable=False)
    level = Column(Integer, nullable=False)  # 1, 2, or 3
    prompt = Column(Text, default="")
    hint_text = Column(Text, nullable=False)
    citations = Column(Text, default="")  # JSON string or comma-separated references
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    attempt = relationship("Attempt", back_populates="hints")

class Reflection(Base):
    __tablename__ = "reflections"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("attempts.id"), unique=True, nullable=False)
    reflection_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    attempt = relationship("Attempt", back_populates="reflection")

class TransferResult(Base):
    __tablename__ = "transfer_results"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    response_text = Column(Text, nullable=False)
    score = Column(Float, default=0.0)
    max_score = Column(Float, default=100.0)
    feedback = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    assignment = relationship("Assignment", back_populates="transfer_results")
    student = relationship("Student", back_populates="transfer_results")

class KnowledgeNode(Base):
    __tablename__ = "knowledge_nodes"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    concept_name = Column(String(255), nullable=False)
    status = Column(String(50), default="pending")  # verified, defense_required, pending
    defense_question = Column(Text, nullable=True)
    defense_response = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    assignment = relationship("Assignment", back_populates="knowledge_nodes")

# RAG QUIZ MODELS

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    topic = Column(String(255), default="")
    difficulty = Column(String(50), default="intermediate")  # beginner, intermediate, advanced
    selected_document_ids = Column(Text, default="[]")  # JSON list
    selected_document_names = Column(Text, default="[]")  # JSON list
    feedback_policy = Column(String(50), default="immediate_practice")  # immediate_practice, post_submission_assessment
    show_citations = Column(Boolean, default=True)
    include_explanations = Column(Boolean, default=True)
    status = Column(String(50), default="draft")  # draft, published
    rag_trace = Column(Text, default="{}")  # JSON string of RAG diagnostic trace
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    course = relationship("Course", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan", order_by="QuizQuestion.order")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), default="multiple_choice")  # multiple_choice, true_false, short_answer, conceptual_scenario
    options = Column(Text, default="[]")  # JSON string list of option strings
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, default="")
    source_citation = Column(String(255), default="")  # e.g., "Lecture 4.pptx — Slide 7"
    source_excerpt = Column(Text, default="")
    chunk_id = Column(String(100), default="")
    retrieval_rank = Column(Integer, default=1)
    similarity_score = Column(Float, default=0.85)
    generation_reason = Column(Text, default="")
    is_validated = Column(Boolean, default=True)
    order = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    quiz = relationship("Quiz", back_populates="questions")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    mode = Column(String(50), default="assessment")  # practice, assessment
    score = Column(Float, default=0.0)
    max_score = Column(Float, default=100.0)
    status = Column(String(50), default="submitted")  # in_progress, submitted
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)

    quiz = relationship("Quiz", back_populates="attempts")
    student = relationship("Student", back_populates="quiz_attempts")
    answers = relationship("QuizAnswer", back_populates="attempt", cascade="all, delete-orphan")

class QuizAnswer(Base):
    __tablename__ = "quiz_answers"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("quiz_attempts.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("quiz_questions.id"), nullable=False)
    student_response = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)
    score = Column(Float, default=0.0)
    feedback = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    attempt = relationship("QuizAttempt", back_populates="answers")
