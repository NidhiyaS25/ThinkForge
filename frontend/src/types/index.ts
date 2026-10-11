export type AssistanceLevel = 1 | 2 | 3;

export interface Citation {
  document_name: string;
  page: number;
  excerpt?: string;
}

export interface HintMessage {
  id: string;
  sender: 'ai' | 'student' | 'system';
  level?: AssistanceLevel;
  text: string;
  citations?: Citation[];
  timestamp: string;
  isDefenseQuestion?: boolean;
}

export interface KnowledgeNode {
  id: number | string;
  name: string;
  status: 'verified' | 'defense_required' | 'pending';
  question?: string;
  description?: string;
}

export interface Assignment {
  id: number;
  course_id: number;
  title: string;
  instructions: string;
  starter_code: string;
  rubric: string;
  target_time_seconds: number;
  complexity_depth: 'beginner' | 'intermediate' | 'advanced';
  transfer_question: string;
  transfer_expected_answer: string;
}

export interface CourseDocument {
  id: number;
  course_id: number;
  filename: string;
  page_count: number;
  chunk_count: number;
  status: 'indexing' | 'indexed' | 'error';
  error_message?: string;
  created_at: string;
}

export interface FocusState {
  isActive: boolean;
  violationCount: number;
  lastViolationTimestamp: number | null;
  statusMessage: string;
}

export interface IndependenceMetrics {
  student_id: number;
  initial_attempt_submitted_before_hint: boolean;
  total_hints_used: number;
  hint_levels_breakdown: Record<number, number>;
  total_revisions: number;
  reflection_completed: boolean;
  focus_violations_count: number;
  transfer_score: number | null;
  independent_mastery_level: string;
}
