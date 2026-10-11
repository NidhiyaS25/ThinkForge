'use client';

import React, { useState } from 'react';
import { Target, Lock, CheckCircle2, Send, ChevronRight, Award, AlertCircle } from 'lucide-react';

interface IndependentChallengeProps {
  question: string;
  onSubmit: (response: string) => Promise<{ score: number; max_score: number; feedback: string }>;
  completedScore?: number | null;
  feedback?: string | null;
}

export const IndependentChallenge: React.FC<IndependentChallengeProps> = ({
  question,
  onSubmit,
  completedScore,
  feedback
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState(`def fibonacci(n):
    # Pure recursive transfer problem without AI hints
    if n <= 0:
        return 0
    if n == 1:
        return 1
    return fibonacci(n - 1) + fibonacci(n - 2)
`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scoreResult, setScoreResult] = useState<{ score: number; max_score: number; feedback: string } | null>(
    completedScore !== null && completedScore !== undefined
      ? { score: completedScore, max_score: 100, feedback: feedback || 'Previously evaluated.' }
      : null
  );

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setIsSubmitting(true);
    try {
      const result = await onSubmit(code);
      setScoreResult(result);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
      {/* Banner / Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/70 flex items-center justify-center text-indigo-700">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 text-sm">
                Independent Challenge
              </h4>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-500" />
                AI Disabled
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Try a related problem without AI hints to verify real, independent concept retention.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {scoreResult && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>Score: {scoreResult.score}/{scoreResult.max_score}</span>
            </div>
          )}
          <ChevronRight
            className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          />
        </div>
      </div>

      {/* Expanded Challenge Workspace */}
      {isOpen && (
        <div className="p-5 border-t border-slate-100 bg-slate-50/30 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 text-xs space-y-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Transfer Problem Prompt
            </span>
            <p className="text-slate-800 leading-relaxed font-medium">
              {question || "Now, write a pure recursive function `fibonacci(n)` that returns the n-th Fibonacci number without using iterative loops. Explain the recursion tree depth."}
            </p>
          </div>

          {/* AI Disabled Lock Notice */}
          <div className="bg-rose-50/60 border border-rose-200/70 rounded-xl p-3 flex items-center gap-2.5 text-xs text-rose-900">
            <Lock className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Independence Mode Active:</strong> All Socratic AI mentor calls and hints are disabled for this transfer challenge.
            </span>
          </div>

          {/* Code Editor */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Your Independent Solution:</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={7}
              className="w-full bg-white font-mono text-xs p-3.5 rounded-xl border border-slate-200 text-slate-900 leading-relaxed outline-none focus:ring-2 focus:ring-indigo-700/20 focus:border-indigo-700"
              placeholder="def fibonacci(n): ..."
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Evaluated deterministically against assignment rubric.
            </span>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !code.trim()}
              className="inline-flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white px-5 py-2.5 rounded-xl font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Evaluating...' : 'Submit Independent Solution'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Result Card */}
          {scoreResult && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Transfer Evaluation: {scoreResult.score} / {scoreResult.max_score}
                </span>
                <span className="font-semibold text-emerald-800">
                  {scoreResult.score >= 80 ? 'Mastery Confirmed' : 'Partial Retention'}
                </span>
              </div>
              <p className="text-emerald-950 leading-relaxed">
                {scoreResult.feedback}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
