'use client';

import React, { useState } from 'react';
import { BookOpen, Check, Code, FileText, HelpCircle, Paperclip, Send, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Assignment } from '../types';

interface AssignmentViewerProps {
  assignment: Assignment;
  code: string;
  onChangeCode: (newCode: string) => void;
  onSubmitAttempt: () => void;
  hasInitialAttempt: boolean;
  version: number;
  reflectionText: string;
  onChangeReflection: (text: string) => void;
  onSubmitReflection: () => void;
  hasReflectionSubmitted: boolean;
}

export const AssignmentViewer: React.FC<AssignmentViewerProps> = ({
  assignment,
  code,
  onChangeCode,
  onSubmitAttempt,
  hasInitialAttempt,
  version,
  reflectionText,
  onChangeReflection,
  onSubmitReflection,
  hasReflectionSubmitted
}) => {
  const [showRubric, setShowRubric] = useState(false);
  const lines = code.split('\n');

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Top Assignment Bar */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/40">
        <div className="flex items-center justify-between pb-2 text-xs">
          <span className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer">
            ← CS 101: Data Structures & Algorithms
          </span>
          <span className="bg-slate-200/70 text-slate-700 px-2.5 py-0.5 rounded-full font-medium text-[11px]">
            Attempt v{version}
          </span>
        </div>

        <h2 className="text-xl font-bold font-serif text-[#0F2E2E]">
          {assignment.title}
        </h2>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          {assignment.instructions}
        </p>

        {/* Collapsible Rubric */}
        <div className="mt-3">
          <button
            onClick={() => setShowRubric(!showRubric)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#1F5F50] hover:text-[#0F2E2E] transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{showRubric ? 'Hide Rubric & Grading Criteria' : 'View Rubric & Grading Criteria'}</span>
            {showRubric ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showRubric && (
            <div className="mt-2 p-3 bg-emerald-50/40 border border-emerald-200/70 rounded-xl text-xs text-slate-700 leading-relaxed space-y-1">
              <p className="font-semibold text-emerald-900">Grading Rubric:</p>
              <p>{assignment.rubric}</p>
            </div>
          )}
        </div>
      </div>

      {/* Code Editor Section */}
      <div className="flex-1 flex flex-col p-5 bg-white">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-2">
            <Code className="w-4 h-4 text-[#1F5F50]" />
            Your Answer (Python 3)
          </label>
          <span className="text-[11px] text-slate-400">
            {code.length} characters • {lines.length} lines
          </span>
        </div>

        {/* Editor Box with Line Numbers */}
        <div className="flex-1 flex border border-slate-200 rounded-xl bg-slate-50/70 overflow-hidden font-mono text-xs focus-within:ring-2 focus-within:ring-emerald-700/20 focus-within:border-emerald-700 transition-all">
          {/* Line Numbers Column */}
          <div className="bg-slate-100/80 px-3 py-3 border-r border-slate-200/60 select-none text-slate-400 text-right leading-relaxed">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Text Area */}
          <textarea
            value={code}
            onChange={(e) => onChangeCode(e.target.value)}
            spellCheck={false}
            className="flex-1 bg-transparent p-3 text-slate-900 leading-relaxed outline-none resize-none font-mono"
            placeholder="Write your recursive algorithm implementation here..."
          />
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-4">
          <button className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">
            <Paperclip className="w-3.5 h-3.5" />
            <span>Add attachment</span>
          </button>

          <div className="flex items-center gap-3">
            {!hasInitialAttempt && (
              <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
                Initial attempt required to unlock hints
              </span>
            )}
            <button
              onClick={onSubmitAttempt}
              className="inline-flex items-center gap-2 bg-[#113A35] hover:bg-[#0c2a26] text-white px-5 py-2.5 rounded-xl font-medium text-xs shadow-xs transition-all cursor-pointer"
            >
              <span>{hasInitialAttempt ? 'Submit Revision' : 'Submit Initial Attempt'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Post-Attempt Reflection Box */}
        {hasInitialAttempt && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#1F5F50]" />
                Reasoning Reflection
              </label>
              {hasReflectionSubmitted && (
                <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Reflection Saved
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={reflectionText}
                onChange={(e) => onChangeReflection(e.target.value)}
                placeholder="Explain the mental model or invariant you applied in this attempt..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
              <button
                onClick={onSubmitReflection}
                disabled={!reflectionText.trim()}
                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
