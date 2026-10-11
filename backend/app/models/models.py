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

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    storage_path = Column(String(500), nullable=False)
    page_count = Column(Integer, default=0)
    chunk_count = Column(Integer, default=0)
    status = Column(String(50), default="indexed")  # indexing, indexed, error
    error_message = Column(Text, nullable=True)
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
