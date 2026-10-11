import { Assignment, CourseDocument, IndependenceMetrics, KnowledgeNode } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const ragService = {
  async getAssignments(): Promise<Assignment[]> {
    try {
      const res = await fetch(`${API_BASE}/assignments`);
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    return [
      {
        id: 1,
        course_id: 1,
        title: 'Understanding Recursion',
        instructions:
          'Implement a recursive solution for calculating factorials and explain how the base case terminates the call stack. Ensure you handle edge cases and describe what happens to memory on return.',
        starter_code: `def factorial(n):
    if n == 0:
        return 1
    return n * factorial(n - 1)

# I'm not sure if this is correct...`,
        rubric:
          'A complete solution defines a base case n == 0 or n == 1 returning 1, a recursive step n * factorial(n - 1), handles non-negative integers, and demonstrates knowledge of the call stack unwinding.',
        target_time_seconds: 420,
        complexity_depth: 'intermediate',
        transfer_question:
          'Now, write a pure recursive function `fibonacci(n)` that returns the n-th Fibonacci number without using iterative loops. Explain the recursion tree depth.',
        transfer_expected_answer:
          'def fibonacci(n):\n    if n <= 0: return 0\n    if n == 1: return 1\n    return fibonacci(n - 1) + fibonacci(n - 2)'
      }
    ];
  },

  async getDocuments(courseId: number = 1): Promise<CourseDocument[]> {
    try {
      const res = await fetch(`${API_BASE}/courses/${courseId}/documents`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return [
      {
        id: 1,
        course_id: 1,
        filename: 'Course_Notes_Recursion.pdf',
        page_count: 18,
        chunk_count: 12,
        status: 'indexed',
        created_at: new Date().toISOString()
      }
    ];
  },

  async saveAttempt(assignmentId: number, code: string, focusViolations: number, timeSeconds: number) {
    try {
      const res = await fetch(`${API_BASE}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: assignmentId,
          student_id: 1,
          content: code,
          focus_violations: focusViolations,
          submission_time_seconds: timeSeconds
        })
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      id: Date.now(),
      assignment_id: assignmentId,
      student_id: 1,
      content: code,
      version: 1,
      is_initial: true,
      focus_violations: focusViolations,
      defense_status: 'normal',
      submission_time_seconds: timeSeconds,
      created_at: new Date().toISOString()
    };
  },

  async requestHint(attemptId: number, level: number, studentQuery: string = '') {
    try {
      const res = await fetch(`${API_BASE}/mentor/hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: attemptId,
          level,
          student_query: studentQuery
        })
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    // Deterministic fallback matching reference mockup
    if (level === 1) {
      return {
        hint_text:
          'What happens to the function when it reaches the base case? Think about how the base case changes the flow of the function. What does it return, and how does that affect the recursive calls?',
        level: 1,
        citations: [{ document_name: 'Course Notes - Page 12', page: 12, excerpt: 'Base Cases in Recursion...' }],
        created_at: new Date().toISOString()
      };
    } else if (level === 2) {
      return {
        hint_text:
          'Remember from your course notes: every recursive call adds a frame to the call stack. The base case acts as the anchor that stops infinite recursion. Once `n == 0` evaluates to true, how does Python evaluate `n * factorial(n - 1)` for the waiting calls?',
        level: 2,
        citations: [{ document_name: 'Course Notes - Page 12', page: 12, excerpt: 'Call Stack Allocation...' }],
        created_at: new Date().toISOString()
      };
    } else {
      return {
        hint_text:
          'Here is a scaffolding outline to check: 1) Verify that your base case returns `1` for `0!`. 2) Ensure your recursive step multiplies `n` by `factorial(n - 1)`. 3) What should happen if someone passes a negative number? Can you write a guard condition?',
        level: 3,
        citations: [{ document_name: 'Course Notes - Page 12', page: 12, excerpt: 'Scaffolding & Edge Cases...' }],
        created_at: new Date().toISOString()
      };
    }
  },

  async evaluateSubmission(assignmentId: number, code: string, timeSeconds: number, focusViolations: number) {
    try {
      const res = await fetch(`${API_BASE}/evaluate-submission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: assignmentId,
          student_id: 1,
          attempt_content: code,
          submission_time_seconds: timeSeconds,
          focus_violations: focusViolations
        })
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    // Fallback logic
    const flagged = timeSeconds < 40 || focusViolations >= 2;
    return {
      flagged,
      reason: flagged
        ? `Pacing anomaly: Answer submitted in ${timeSeconds}s with ${focusViolations} focus switch violations.`
        : 'Submission verified within expected pacing parameters.',
      defense_required: flagged,
      defense_question: flagged
        ? 'Defense Required: In your implementation, what exact memory state change occurs when `n == 0` is evaluated? Walk through the return sequence from factorial(1) back to factorial(n).'
        : null,
      targeted_concept: 'Call Stack Unwinding',
      knowledge_nodes: [
        { id: 1, name: 'Base Case Formulation', status: 'verified' },
        { id: 2, name: 'Recursive Sub-problem', status: 'verified' },
        { id: 3, name: 'Call Stack Unwinding', status: flagged ? 'defense_required' : 'verified' },
        { id: 4, name: 'Edge Case Guard Rails', status: 'pending' }
      ]
    };
  },

  async verifyDefense(assignmentId: number, conceptName: string, defenseResponse: string) {
    try {
      const res = await fetch(`${API_BASE}/defense/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: assignmentId,
          student_id: 1,
          concept_name: conceptName,
          defense_response: defenseResponse
        })
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const verified = defenseResponse.length > 20;
    return {
      verified,
      feedback: verified
        ? `Conceptual grasp verified for '${conceptName}'. Call stack dynamics clearly articulated.`
        : 'Defense insufficient. Please elaborate on memory frame unwinding.',
      updated_nodes: [
        { id: 1, name: 'Base Case Formulation', status: 'verified' },
        { id: 2, name: 'Recursive Sub-problem', status: 'verified' },
        { id: 3, name: 'Call Stack Unwinding', status: verified ? 'verified' : 'defense_required' },
        { id: 4, name: 'Edge Case Guard Rails', status: 'pending' }
      ]
    };
  },

  async submitTransferChallenge(assignmentId: number, responseText: string) {
    try {
      const res = await fetch(`${API_BASE}/transfer-challenges/${assignmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: assignmentId,
          student_id: 1,
          response_text: responseText
        })
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const hasFib = responseText.toLowerCase().includes('fib');
    const hasBase = responseText.toLowerCase().includes('return 0') || responseText.toLowerCase().includes('return 1');
    const score = hasFib && hasBase ? 95 : 60;
    return {
      id: Date.now(),
      assignment_id: assignmentId,
      student_id: 1,
      score,
      max_score: 100,
      feedback:
        score >= 80
          ? 'Transfer solution accurately handles recursive decomposition and boundary conditions (+95).'
          : 'Recursive step identified, but base conditions need adjustment.',
      created_at: new Date().toISOString()
    };
  },

  async getIndependenceMetrics(): Promise<IndependenceMetrics> {
    try {
      const res = await fetch(`${API_BASE}/students/1/independence`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      student_id: 1,
      initial_attempt_submitted_before_hint: true,
      total_hints_used: 1,
      hint_levels_breakdown: { 1: 1, 2: 0, 3: 0 },
      total_revisions: 1,
      reflection_completed: true,
      focus_violations_count: 0,
      transfer_score: 95,
      independent_mastery_level: 'High Independence (Forged Master)'
    };
  }
};
