import json
from sqlalchemy import text
from backend.app.models.models import Base, Course, Assignment, Student, Document, KnowledgeNode, Quiz, QuizQuestion
from backend.app.db.session import engine, SessionLocal

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check SQLite migrations for documents table
        with engine.connect() as conn:
            try:
                # Add columns if not already present
                res = conn.execute(text("PRAGMA table_info(documents)"))
                cols = [r[1] for r in res.fetchall()]
                if "file_type" not in cols:
                    conn.execute(text("ALTER TABLE documents ADD COLUMN file_type VARCHAR(20) DEFAULT 'pdf'"))
                if "unit_type" not in cols:
                    conn.execute(text("ALTER TABLE documents ADD COLUMN unit_type VARCHAR(30) DEFAULT 'page'"))
                if "unit_count" not in cols:
                    conn.execute(text("ALTER TABLE documents ADD COLUMN unit_count INTEGER DEFAULT 0"))
                if "extracted_preview" not in cols:
                    conn.execute(text("ALTER TABLE documents ADD COLUMN extracted_preview TEXT"))
                conn.commit()
            except Exception as e:
                # Ignore if not sqlite or columns already present
                pass

        # Check if default course exists
        existing_course = db.query(Course).filter(Course.title == "CS 101: Computer Science Fundamentals").first()
        if not existing_course:
            course = Course(
                title="CS 101: Computer Science Fundamentals",
                description="Core concepts of algorithms, data structures, recursion, and computational thinking."
            )
            db.add(course)
            db.commit()
            db.refresh(course)

            # Seed Course Document (Course Notes - Page 12)
            doc = Document(
                course_id=course.id,
                filename="Course_Notes_Recursion.pdf",
                storage_path="./data/uploads/Course_Notes_Recursion.pdf",
                file_type="pdf",
                unit_type="page",
                unit_count=18,
                page_count=18,
                chunk_count=12,
                status="indexed",
                extracted_preview="Course Notes - Understanding Recursion and Call Stacks. Recursion is a programming technique where a function calls itself to solve a smaller instance of the same problem. Base Cases in Recursion: Without a base case, recursion continues infinitely causing a stack overflow."
            )
            db.add(doc)
            db.commit()
            db.refresh(doc)

            # Seed Assignment: Understanding Recursion
            assignment = Assignment(
                course_id=course.id,
                title="Understanding Recursion",
                instructions="Implement a recursive solution for calculating factorials and explain how the base case terminates the call stack. Ensure you handle edge cases and describe what happens to memory on return.",
                starter_code="""def factorial(n):
    if n == 0:
        return 1
    return n * factorial(n - 1)

# I'm not sure if this is correct...""",
                rubric="A complete solution defines a base case n == 0 or n == 1 returning 1, a recursive step n * factorial(n - 1), handles non-negative integers, and demonstrates knowledge of the call stack unwinding.",
                target_time_seconds=420,  # 7 minutes dynamic timer
                complexity_depth="intermediate",
                transfer_question="Now, write a pure recursive function `fibonacci(n)` that returns the n-th Fibonacci number without using iterative loops. Explain the recursion tree depth.",
                transfer_expected_answer="def fibonacci(n):\n    if n <= 0: return 0\n    if n == 1: return 1\n    return fibonacci(n - 1) + fibonacci(n - 2)"
            )
            db.add(assignment)
            db.commit()
            db.refresh(assignment)

            # Seed Student
            student = Student(
                name="Alex River",
                email="alex@thinkforge.edu"
            )
            db.add(student)
            db.commit()
            db.refresh(student)

            # Seed Initial Knowledge Nodes
            nodes = [
                KnowledgeNode(
                    assignment_id=assignment.id,
                    student_id=student.id,
                    concept_name="Base Case Formulation",
                    status="verified"
                ),
                KnowledgeNode(
                    assignment_id=assignment.id,
                    student_id=student.id,
                    concept_name="Recursive Sub-problem",
                    status="verified"
                ),
                KnowledgeNode(
                    assignment_id=assignment.id,
                    student_id=student.id,
                    concept_name="Call Stack Unwinding",
                    status="pending"
                ),
                KnowledgeNode(
                    assignment_id=assignment.id,
                    student_id=student.id,
                    concept_name="Edge Case Guard Rails",
                    status="pending"
                ),
            ]
            db.add_all(nodes)
            db.commit()

            # Seed Sample Published Quiz
            sample_quiz = Quiz(
                course_id=course.id,
                title="Recursion & Call Stack Foundations",
                topic="Recursion and Memory Stack Mechanics",
                difficulty="intermediate",
                selected_document_ids=json.dumps([doc.id]),
                selected_document_names=json.dumps([doc.filename]),
                feedback_policy="immediate_practice",
                show_citations=True,
                include_explanations=True,
                status="published",
                rag_trace=json.dumps({
                    "selected_sources": [doc.filename],
                    "total_units": 18,
                    "indexed_chunks": 12,
                    "retrieval_query": "Recursion base case and call stack unwinding",
                    "retrieved_evidence_count": 5,
                    "selected_context_chunks": 3,
                    "generation_mode": "RAG Grounded Generation",
                    "source_validation_status": "Passed - Grounded in cited materials",
                    "trace_steps": [
                        "Retrieved 5 chunks from ChromaDB filtered to Course_Notes_Recursion.pdf",
                        "Validated semantic relevance against course knowledge base",
                        "Synthesized 3 conceptual questions with verified source citations"
                    ],
                    "raw_chunks": [
                        {
                            "chunk_id": f"c{course.id}_d{doc.id}_u12_chk1",
                            "document_name": doc.filename,
                            "unit_label": "Page 12",
                            "rank": 1,
                            "similarity_score": 0.94,
                            "excerpt": "Base Cases in Recursion: Without a base case, recursion continues infinitely causing a stack overflow. When the base case is reached, the function ceases recursive invocations and begins unwinding the call stack."
                        }
                    ]
                })
            )
            db.add(sample_quiz)
            db.commit()
            db.refresh(sample_quiz)

            sample_questions = [
                QuizQuestion(
                    quiz_id=sample_quiz.id,
                    order=1,
                    question_type="multiple_choice",
                    question_text="What primary event occurs in execution memory once a recursive function reaches its base case?",
                    options=json.dumps([
                        "It ceases pushing activation frames and begins unwinding the call stack",
                        "It allocates double the memory on the heap to optimize garbage collection",
                        "It converts the recursion tree into an iterative for-loop in bytecode",
                        "It pauses execution indefinitely until the user provides additional input"
                    ]),
                    correct_answer="It ceases pushing activation frames and begins unwinding the call stack",
                    explanation="According to the course notes, when the base case is reached, recursive invocations stop and return values are popped off the call stack.",
                    source_citation="Course_Notes_Recursion.pdf — Page 12",
                    source_excerpt="When the base case is reached, the function ceases recursive invocations and begins unwinding the call stack.",
                    chunk_id=f"c{course.id}_d{doc.id}_u12_chk1",
                    retrieval_rank=1,
                    similarity_score=0.94,
                    generation_reason="Assesses understanding of runtime memory behavior during recursion termination.",
                    is_validated=True
                ),
                QuizQuestion(
                    quiz_id=sample_quiz.id,
                    order=2,
                    question_type="true_false",
                    question_text="True or False: Omitting a base case in a recursive function causes continuous stack frame allocation until a stack overflow occurs.",
                    options=json.dumps(["True", "False"]),
                    correct_answer="True",
                    explanation="True. Each recursive call pushes a new frame onto the call stack. Without a terminating base case, memory is quickly exhausted.",
                    source_citation="Course_Notes_Recursion.pdf — Page 12",
                    source_excerpt="Without a base case, recursion continues infinitely causing a stack overflow.",
                    chunk_id=f"c{course.id}_d{doc.id}_u12_chk1",
                    retrieval_rank=1,
                    similarity_score=0.94,
                    generation_reason="Tests conceptual awareness of termination limits and failure modes.",
                    is_validated=True
                ),
                QuizQuestion(
                    quiz_id=sample_quiz.id,
                    order=3,
                    question_type="short_answer",
                    question_text="In your own words, why is every recursive call considered a separate sub-problem in computational thinking?",
                    options=json.dumps([]),
                    correct_answer="Each call solves a smaller instance of the same problem with its own isolated scope and state",
                    explanation="Recursive decomposition divides a larger problem into progressively smaller, identical sub-problems until an irreducible base case is reached.",
                    source_citation="Course_Notes_Recursion.pdf — Page 1",
                    source_excerpt="Recursion is a programming technique where a function calls itself to solve a smaller instance of the same problem.",
                    chunk_id=f"c{course.id}_d{doc.id}_u1_chk1",
                    retrieval_rank=2,
                    similarity_score=0.89,
                    generation_reason="Evaluates concise conceptual summarization of recursive sub-problems.",
                    is_validated=True
                )
            ]
            db.add_all(sample_questions)
            db.commit()

            print("ThinkForge database initialized and seeded successfully.")
        else:
            # Check if quiz exists
            existing_quiz = db.query(Quiz).first()
            if not existing_quiz:
                first_course = db.query(Course).first()
                first_doc = db.query(Document).first()
                if first_course and first_doc:
                    q = Quiz(
                        course_id=first_course.id,
                        title="Recursion & Call Stack Foundations",
                        topic="Recursion and Memory Stack Mechanics",
                        difficulty="intermediate",
                        selected_document_ids=json.dumps([first_doc.id]),
                        selected_document_names=json.dumps([first_doc.filename]),
                        feedback_policy="immediate_practice",
                        show_citations=True,
                        include_explanations=True,
                        status="published",
                        rag_trace=json.dumps({
                            "selected_sources": [first_doc.filename],
                            "total_units": 18,
                            "indexed_chunks": 12,
                            "retrieval_query": "Recursion base case and call stack unwinding",
                            "retrieved_evidence_count": 5,
                            "selected_context_chunks": 3,
                            "generation_mode": "RAG Grounded Generation",
                            "source_validation_status": "Passed - Grounded in cited materials",
                            "trace_steps": ["Indexed ChromaDB chunks retrieved and verified"],
                            "raw_chunks": []
                        })
                    )
                    db.add(q)
                    db.commit()
                    db.refresh(q)

                    questions = [
                        QuizQuestion(
                            quiz_id=q.id,
                            order=1,
                            question_type="multiple_choice",
                            question_text="What primary event occurs in execution memory once a recursive function reaches its base case?",
                            options=json.dumps([
                                "It ceases pushing activation frames and begins unwinding the call stack",
                                "It allocates double the memory on the heap to optimize garbage collection",
                                "It converts the recursion tree into an iterative for-loop in bytecode",
                                "It pauses execution indefinitely until the user provides additional input"
                            ]),
                            correct_answer="It ceases pushing activation frames and begins unwinding the call stack",
                            explanation="When the base case is reached, recursive calls halt and stack frames unwind.",
                            source_citation=f"{first_doc.filename} — Page 12",
                            source_excerpt="When the base case is reached, the function ceases recursive invocations and begins unwinding the call stack.",
                            chunk_id="c1_d1_u12_chk1",
                            retrieval_rank=1,
                            similarity_score=0.94,
                            generation_reason="Assesses understanding of runtime memory behavior during recursion termination.",
                            is_validated=True
                        )
                    ]
                    db.add_all(questions)
                    db.commit()
            print("Database already contains seed records.")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
