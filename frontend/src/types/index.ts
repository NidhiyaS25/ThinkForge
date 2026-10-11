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
  file_type?: string; // 'pdf' | 'pptx' | 'docx' | 'txt' | 'md'
  unit_type?: string; // 'page' | 'slide' | 'section'
  unit_count?: number;
  page_count: number;
  chunk_count: number;
  status: 'indexing' | 'indexed' | 'error';
  error_message?: string;
  extracted_preview?: string;
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

// ---------------- RAG QUIZ TYPES ----------------

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'conceptual_scenario';

export interface QuizQuestionItem {
  id?: number;
  order: number;
  question_type: QuestionType;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  source_citation: string;
  source_excerpt: string;
  chunk_id?: string;
  retrieval_rank: number;
  similarity_score: number;
  generation_reason: string;
  is_validated: boolean;
}

export interface RawTraceChunk {
  chunk_id: string;
  document_name: string;
  unit_label: string;
  rank: number;
  similarity_score: number;
  excerpt: string;
}

export interface RAGTraceInfo {
  selected_sources: string[];
  total_units: number;
  indexed_chunks: number;
  retrieval_query: string;
  retrieved_evidence_count: number;
  selected_context_chunks: number;
  generation_mode: string;
  source_validation_status: string;
  trace_steps: string[];
  raw_chunks: RawTraceChunk[];
}

export interface Quiz {
  id: number;
  course_id: number;
  title: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  selected_document_ids: number[];
  selected_document_names: string[];
  feedback_policy: 'immediate_practice' | 'post_submission_assessment';
  show_citations: boolean;
  include_explanations: boolean;
  status: 'draft' | 'published';
  questions_count?: number;
  rag_trace?: RAGTraceInfo;
  created_at: string;
  questions?: QuizQuestionItem[];
}

export interface QuizAnswerEvaluation {
  question_id: number;
  student_response: string;
  is_correct: boolean;
  score: number;
  correct_answer: string;
  explanation: string;
  source_citation: string;
  source_excerpt: string;
  feedback: string;
}

export interface QuizAttemptResult {
  attempt_id: number;
  quiz_id: number;
  score: number;
  max_score: number;
  percentage: number;
  status: string;
  mode: 'practice' | 'assessment';
  answers: QuizAnswerEvaluation[];
  created_at: string;
}
