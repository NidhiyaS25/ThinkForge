from backend.app.models.models import Base, Course, Assignment, Student, Document, KnowledgeNode
from backend.app.db.session import engine, SessionLocal

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
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
                page_count=18,
                chunk_count=12,
                status="indexed"
            )
            db.add(doc)
            db.commit()

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
            print("ThinkForge database initialized and seeded successfully.")
        else:
            print("Database already contains seed records.")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
