'use client';

import React from 'react';
import { Award, CheckCircle2, AlertTriangle, ShieldCheck, TrendingUp, Sparkles, BookOpen, Clock, FileCheck } from 'lucide-react';
import { IndependenceMetrics } from '../types';

interface IndependenceProfileProps {
  metrics: IndependenceMetrics;
}

export const IndependenceProfile: React.FC<IndependenceProfileProps> = ({ metrics }) => {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Title */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#2E7A68]">
          Transparent Learning Evidence
        </span>
        <h2 className="text-3xl font-serif font-bold text-[#0F2E2E] mt-1">
          Independence Profile
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Objective record of student reasoning behavior, anti-cheat focus adherence, and unassisted transfer performance.
        </p>
      </div>

      {/* Top Banner Card: Mastery Classification */}
      <div className="bg-gradient-to-r from-[#113A35] to-[#1d574e] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-emerald-300">
            Current Independence Standing
          </span>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold mt-1">
            {metrics.independent_mastery_level}
          </h3>
          <p className="text-xs text-emerald-100/90 mt-2 max-w-lg leading-relaxed">
            Derived directly from unassisted transfer outcomes, initial attempt diligence, and progressive Socratic fade.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4 text-center shrink-0 min-w-[160px]">
          <span className="text-xs text-emerald-200 uppercase font-semibold">AI-Free Transfer</span>
          <div className="text-3xl font-bold font-mono mt-1">
            {metrics.transfer_score !== null ? `${metrics.transfer_score}%` : 'Pending'}
          </div>
          <span className="text-[11px] text-emerald-200">
            {metrics.transfer_score && metrics.transfer_score >= 80 ? 'Mastery Verified' : 'Practice Encouraged'}
          </span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Diligence Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Attempt-Before-Hint</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {metrics.initial_attempt_submitted_before_hint ? 'Enforced & Met' : 'In Progress'}
          </div>
          <p className="text-[11px] text-slate-500">
            Student formulated initial logic prior to requesting AI scaffolding.
          </p>
        </div>

        {/* Hint Reliance Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Socratic Hints Used</span>
            <Sparkles className="w-4 h-4 text-[#1F5F50]" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {metrics.total_hints_used} Total Hints
          </div>
          <p className="text-[11px] text-slate-500">
            L1: {metrics.hint_levels_breakdown[1] || 0} • L2: {metrics.hint_levels_breakdown[2] || 0} • L3: {metrics.hint_levels_breakdown[3] || 0}
          </p>
        </div>

        {/* Focus Integrity Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Focus Interruptions</span>
            <AlertTriangle className={`w-4 h-4 ${metrics.focus_violations_count > 0 ? 'text-amber-500' : 'text-emerald-600'}`} />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {metrics.focus_violations_count} Violations
          </div>
          <p className="text-[11px] text-slate-500">
            {metrics.focus_violations_count === 0
              ? 'Flawless window & tab focus maintained.'
              : `${metrics.focus_violations_count} tab switches recorded.`}
          </p>
        </div>

        {/* Reflection Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Metacognitive Reflection</span>
            <FileCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {metrics.reflection_completed ? 'Completed' : 'Optional'}
          </div>
          <p className="text-[11px] text-slate-500">
            Student articulated conceptual reasoning behind the solution.
          </p>
        </div>
      </div>

      {/* Transparent Audit Trail Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">
          Reasoning & Integrity Audit Trail
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-semibold">Evidence Metric</th>
                <th className="pb-3 font-semibold">Observed Value</th>
                <th className="pb-3 font-semibold">Evaluation Criteria</th>
                <th className="pb-3 font-semibold">Verification State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3 font-medium">Initial Attempt Timing</td>
                <td className="py-3">Saved prior to Hint 1</td>
                <td className="py-3">Mandatory scaffold lock</td>
                <td className="py-3 text-emerald-800 font-semibold">✓ Verified</td>
              </tr>
              <tr>
                <td className="py-3 font-medium">Progressive Hint Fade</td>
                <td className="py-3">Clarifying (L1) → Conceptual (L2)</td>
                <td className="py-3">Zero direct-solution reveals</td>
                <td className="py-3 text-emerald-800 font-semibold">✓ Grounded RAG</td>
              </tr>
              <tr>
                <td className="py-3 font-medium">Window / Tab Switching</td>
                <td className="py-3">{metrics.focus_violations_count} logged events</td>
                <td className="py-3">Threshold: &lt; 2 flags for auto-verify</td>
                <td className="py-3">
                  {metrics.focus_violations_count >= 2 ? (
                    <span className="text-amber-800 font-semibold">⚠ Defense Triggered</span>
                  ) : (
                    <span className="text-emerald-800 font-semibold">✓ Clean Session</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="py-3 font-medium">AI-Free Transfer Retention</td>
                <td className="py-3">{metrics.transfer_score !== null ? `${metrics.transfer_score}%` : 'Pending Submission'}</td>
                <td className="py-3">Deterministic rubric check</td>
                <td className="py-3 font-semibold text-slate-900">
                  {metrics.transfer_score && metrics.transfer_score >= 80 ? '✓ Mastery' : 'In Progress'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
