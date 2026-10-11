'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
  Award,
  AlertTriangle,
  Lightbulb,
  Compass
} from 'lucide-react';
import { Quiz, QuizQuestionItem, QuizAttemptResult, QuizAnswerEvaluation } from '../types';
import { ragService } from '../lib/ragService';

interface StudentQuizViewProps {
  courseId?: number;
  onOpenArena?: () => void;
}

export const StudentQuizView: React.FC<StudentQuizViewProps> = ({
  courseId = 1,
  onOpenArena
}) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Active Quiz State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<Record<number, string>>({});
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizAttemptResult | null>(null);
  const [activeCitationOpen, setActiveCitationOpen] = useState(false);
  const [quizMode, setQuizMode] = useState<'practice' | 'assessment'>('assessment');

  // Load published quizzes
  useEffect(() => {
    async function fetchQuizzes() {
      setIsLoading(true);
      try {
        const list = await ragService.getQuizzes(courseId);
        setQuizzes(list.filter((q) => q.status === 'published'));
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuizzes();
  }, [courseId]);

  const handleStartQuiz = async (quiz: Quiz, mode: 'practice' | 'assessment' = 'assessment') => {
    try {
      const fullQuiz = await ragService.getQuiz(quiz.id);
      setSelectedQuiz(fullQuiz);
      setQuizMode(mode);
      setCurrentQuestionIdx(0);
      setStudentAnswers({});
      setIsReviewMode(false);
      setQuizResult(null);
      setActiveCitationOpen(false);
    } catch (e) {
      alert('Failed to load quiz questions. Please try again.');
    }
  };

  const handleSelectAnswer = (qId: number, answerText: string) => {
    setStudentAnswers((prev) => ({
      ...prev,
      [qId]: answerText
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!selectedQuiz) return;
    setIsSubmitting(true);
    try {
      const result = await ragService.submitQuizAttempt(selectedQuiz.id, studentAnswers, quizMode);
      setQuizResult(result);
      setIsReviewMode(false);
    } catch (e: any) {
      alert(e.message || 'Failed to submit quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset to quiz catalog
  const handleBackToQuizzes = () => {
    setSelectedQuiz(null);
    setQuizResult(null);
    setIsReviewMode(false);
    setStudentAnswers({});
  };

  const questions = selectedQuiz?.questions || [];
  const currentQ = questions[currentQuestionIdx];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(studentAnswers).filter((k) => studentAnswers[Number(k)]?.trim()).length;
  const progressPercent = totalQuestions > 0 ? Math.round(((currentQuestionIdx + 1) / totalQuestions) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ---------------- QUIZ CATALOG (When no quiz is active) ---------------- */}
      {!selectedQuiz && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2E7A68]">
                Student Learning Center
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0F2E2E] mt-1">
                Course Quizzes & Conceptual Checks
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                Test your conceptual understanding and reasoning with interactive assessments generated directly from your teacher's study materials. No programming code required.
              </p>
            </div>

            {onOpenArena && (
              <button
                onClick={onOpenArena}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs hover:scale-105 transition-all shrink-0 cursor-pointer"
              >
                <Compass className="w-4 h-4 text-emerald-300" />
                <span>Play Algorithm Arena</span>
              </button>
            )}
          </div>

          {/* Loading state */}
          {isLoading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
              Loading published quizzes...
            </div>
          ) : quizzes.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-serif font-bold text-slate-800 text-base">No Quizzes Published Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Your instructor has not published any quizzes for this course yet. Check back soon or visit the Teacher Dashboard to generate one!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {quiz.difficulty.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        ~{quiz.questions_count || 5} mins
                      </span>
                    </div>

                    <h3 className="text-lg font-serif font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
                      {quiz.title}
                    </h3>

                    {quiz.topic && (
                      <p className="text-xs text-slate-600 font-medium">
                        Topic: <span className="text-slate-800">{quiz.topic}</span>
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="truncate">
                        Source: {quiz.selected_document_names?.[0] || 'Course Materials'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      onClick={() => handleStartQuiz(quiz, 'practice')}
                      className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 px-3 py-2 rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer"
                    >
                      Practice Mode
                    </button>

                    <button
                      onClick={() => handleStartQuiz(quiz, 'assessment')}
                      className="bg-[#113A35] hover:bg-[#0c2a26] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Take Quiz</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------- ACTIVE QUIZ RUNNER ---------------- */}
      {selectedQuiz && !quizResult && !isReviewMode && currentQ && (
        <div className="space-y-6">
          {/* Top Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleBackToQuizzes}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Exit</span>
                </button>
                <span className="text-slate-300">|</span>
                <span className="font-serif font-bold text-slate-900 text-sm sm:text-base">
                  {selectedQuiz.title}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  Question {currentQuestionIdx + 1} of {totalQuestions}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {quizMode === 'practice' ? 'Practice Mode' : 'Assessment Mode'}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#113A35] h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Question Display Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800">
                  {currentQ.question_type.replace('_', ' ').toUpperCase()}
                </span>
                {currentQ.source_citation && (
                  <button
                    onClick={() => setActiveCitationOpen(!activeCitationOpen)}
                    className="text-xs text-emerald-800 hover:text-emerald-950 font-medium flex items-center gap-1.5 cursor-pointer bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Citation: {currentQ.source_citation}</span>
                    {activeCitationOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>

              <h2 className="text-base sm:text-lg font-serif font-bold text-slate-900 leading-snug">
                {currentQ.question_text}
              </h2>
            </div>

            {/* Expandable Citation Drawer */}
            {activeCitationOpen && currentQ.source_excerpt && (
              <div className="bg-[#FAF9F5] p-4 rounded-xl border border-emerald-200 text-xs text-slate-700 space-y-1.5 animate-in fade-in">
                <span className="font-bold text-emerald-950 text-[11px] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-700" />
                  Supporting Excerpt from {currentQ.source_citation}:
                </span>
                <p className="font-serif italic text-slate-700 leading-relaxed pl-2 border-l-2 border-emerald-500">
                  "{currentQ.source_excerpt}"
                </p>
              </div>
            )}

            {/* Answer Options Area (Strictly No Code) */}
            <div className="space-y-3 pt-2">
              {/* Multiple Choice Options */}
              {currentQ.question_type === 'multiple_choice' && (
                <div className="grid grid-cols-1 gap-2.5">
                  {currentQ.options.map((opt, oIdx) => {
                    const isSelected = studentAnswers[currentQ.id || currentQuestionIdx] === opt;
                    const letter = String.fromCharCode(65 + oIdx);

                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => handleSelectAnswer(currentQ.id || currentQuestionIdx, opt)}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50/90 border-[#113A35] ring-2 ring-[#113A35]/20 shadow-xs'
                            : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isSelected
                              ? 'bg-[#113A35] text-white'
                              : 'bg-white border border-slate-300 text-slate-700'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* True / False Options */}
              {currentQ.question_type === 'true_false' && (
                <div className="grid grid-cols-2 gap-4">
                  {['True', 'False'].map((choice) => {
                    const isSelected = studentAnswers[currentQ.id || currentQuestionIdx] === choice;
                    return (
                      <button
                        key={choice}
                        type="button"
                        onClick={() => handleSelectAnswer(currentQ.id || currentQuestionIdx, choice)}
                        className={`p-5 rounded-2xl border text-center font-bold text-sm sm:text-base transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 border-[#113A35] ring-2 ring-[#113A35]/20 text-[#113A35] shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {choice}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Short Answer / Conceptual Scenario Textarea */}
              {(currentQ.question_type === 'short_answer' ||
                (currentQ.question_type === 'conceptual_scenario' && currentQ.options.length === 0)) && (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={studentAnswers[currentQ.id || currentQuestionIdx] || ''}
                    onChange={(e) => handleSelectAnswer(currentQ.id || currentQuestionIdx, e.target.value)}
                    placeholder="Explain your reasoning based on the course materials... (No code required)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#113A35]/30 focus:border-[#113A35]"
                  />
                  <p className="text-[11px] text-slate-500 italic">
                    Focus on explaining the underlying concepts, invariants, and memory mechanics.
                  </p>
                </div>
              )}

              {/* Conceptual Scenario with Options */}
              {currentQ.question_type === 'conceptual_scenario' && currentQ.options.length > 0 && (
                <div className="grid grid-cols-1 gap-2.5">
                  {currentQ.options.map((opt, oIdx) => {
                    const isSelected = studentAnswers[currentQ.id || currentQuestionIdx] === opt;
                    const letter = String.fromCharCode(65 + oIdx);

                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => handleSelectAnswer(currentQ.id || currentQuestionIdx, opt)}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50/90 border-[#113A35] ring-2 ring-[#113A35]/20 shadow-xs'
                            : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isSelected
                              ? 'bg-[#113A35] text-white'
                              : 'bg-white border border-slate-300 text-slate-700'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Practice Mode Instant Explanation */}
            {quizMode === 'practice' && studentAnswers[currentQ.id || currentQuestionIdx] && (
              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-1.5 animate-in fade-in">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-emerald-700" />
                  Practice Feedback:
                </span>
                <p className="text-emerald-900 leading-relaxed">{currentQ.explanation}</p>
              </div>
            )}
          </div>

          {/* Bottom Navigation Buttons */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => {
                if (currentQuestionIdx > 0) {
                  setCurrentQuestionIdx((prev) => prev - 1);
                  setActiveCitationOpen(false);
                }
              }}
              disabled={currentQuestionIdx === 0}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-xs hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {currentQuestionIdx < totalQuestions - 1 ? (
              <button
                onClick={() => {
                  setCurrentQuestionIdx((prev) => prev + 1);
                  setActiveCitationOpen(false);
                }}
                className="bg-[#113A35] hover:bg-[#0c2a26] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Next Question</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setIsReviewMode(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Review & Submit</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ---------------- REVIEW SCREEN (Before Final Submit) ---------------- */}
      {selectedQuiz && !quizResult && isReviewMode && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-serif font-bold text-slate-900">
              Review Your Answers
            </h2>
            <p className="text-xs text-slate-500">
              Double check your selections before final evaluation. You have answered{' '}
              <span className="font-bold text-emerald-800">{answeredCount}</span> of{' '}
              <span className="font-bold text-slate-800">{totalQuestions}</span> questions.
            </p>
          </div>

          <div className="space-y-3">
            {questions.map((q, qIdx) => {
              const ans = studentAnswers[q.id || qIdx];
              return (
                <div
                  key={qIdx}
                  onClick={() => {
                    setCurrentQuestionIdx(qIdx);
                    setIsReviewMode(false);
                  }}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/60 hover:bg-slate-100/60 transition-all flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="space-y-1 flex-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      Question {qIdx + 1} • {q.question_type.replace('_', ' ')}
                    </span>
                    <p className="font-semibold text-xs text-slate-900 line-clamp-1">{q.question_text}</p>
                    <p className="text-xs text-slate-600 truncate">
                      {ans ? (
                        <span className="text-emerald-900 font-medium">Your answer: {ans}</span>
                      ) : (
                        <span className="text-rose-600 font-medium">Not answered yet</span>
                      )}
                    </p>
                  </div>

                  <span className="text-xs font-semibold text-emerald-800 shrink-0">
                    Edit →
                  </span>
                </div>
              );
            })}
          </div>

          {answeredCount < totalQuestions && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>You have unanswered questions. You can still submit, but unanswered questions will be marked incorrect.</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setIsReviewMode(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Back to Questions
            </button>

            <button
              onClick={handleSubmitQuiz}
              disabled={isSubmitting}
              className="bg-[#113A35] hover:bg-[#0c2a26] text-white px-7 py-3 rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Evaluating Submission...</span>
              ) : (
                <>
                  <span>Submit Final Assessment</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ---------------- RESULTS & EXPLANATIONS SCREEN ---------------- */}
      {selectedQuiz && quizResult && (
        <div className="space-y-6">
          {/* Big Score Card */}
          <div className="bg-gradient-to-r from-[#0F2E2E] via-[#113A35] to-[#1F5F50] text-white p-6 sm:p-8 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 inline-block">
                Assessment Complete
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                {selectedQuiz.title}
              </h2>
              <p className="text-xs text-emerald-100/80">
                Evaluation completed against grounded course study rubrics.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 shrink-0 text-center">
              <div>
                <span className="text-3xl sm:text-4xl font-serif font-bold text-emerald-300">
                  {quizResult.percentage}%
                </span>
                <span className="text-[11px] text-emerald-100 block font-medium mt-0.5">
                  {quizResult.score} / {quizResult.max_score} Points
                </span>
              </div>
            </div>
          </div>

          {/* Question Breakdown with Grounded Citations */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
            <h3 className="font-serif font-bold text-slate-900 text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-700" />
              Question-by-Question Learning Review
            </h3>

            <div className="space-y-4">
              {quizResult.answers.map((evalItem, eIdx) => {
                const questionObj = questions.find((q) => q.id === evalItem.question_id) || questions[eIdx];

                return (
                  <div
                    key={eIdx}
                    className={`p-5 rounded-2xl border transition-all space-y-3 ${
                      evalItem.is_correct
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-rose-50/40 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500">
                          Question {eIdx + 1}
                        </span>
                        <h4 className="font-serif font-bold text-slate-900 text-sm">
                          {questionObj?.question_text || `Question ${eIdx + 1}`}
                        </h4>
                      </div>

                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shrink-0 ${
                          evalItem.is_correct
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-rose-100 text-rose-900'
                        }`}
                      >
                        {evalItem.is_correct ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Correct (+{evalItem.score})</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Incorrect (0.0)</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Responses comparison */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white/80 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase mb-0.5">
                          Your Answer:
                        </span>
                        <span className="text-slate-800 font-medium">
                          {evalItem.student_response || 'No answer submitted'}
                        </span>
                      </div>

                      <div className="p-3 bg-white/80 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase mb-0.5">
                          Verified Correct Answer:
                        </span>
                        <span className="text-emerald-900 font-bold">
                          {evalItem.correct_answer}
                        </span>
                      </div>
                    </div>

                    {/* Feedback & Grounded Citation */}
                    <div className="bg-white/90 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <p className="text-slate-700 leading-relaxed font-medium">
                        {evalItem.feedback}
                      </p>

                      {evalItem.source_citation && (
                        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500">
                          <span className="font-semibold text-emerald-800 flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            Grounded in: {evalItem.source_citation}
                          </span>
                          {evalItem.source_excerpt && (
                            <span className="italic text-slate-600 line-clamp-1">
                              "{evalItem.source_excerpt}"
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => handleStartQuiz(selectedQuiz, quizMode)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Quiz</span>
            </button>

            <button
              onClick={handleBackToQuizzes}
              className="bg-[#113A35] hover:bg-[#0c2a26] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>Back to Quiz Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
