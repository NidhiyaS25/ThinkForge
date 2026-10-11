'use client';

import React from 'react';
import { AlertTriangle, ShieldAlert, ArrowDown } from 'lucide-react';

interface DefenseBannerProps {
  reason: string;
  onJumpToDefense: () => void;
}

export const DefenseBanner: React.FC<DefenseBannerProps> = ({
  reason,
  onJumpToDefense
}) => {
  return (
    <div className="bg-amber-500/10 border-2 border-amber-500/60 rounded-2xl p-4 sm:p-5 text-amber-950 shadow-sm animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-amber-900 tracking-wide uppercase">
              Integrity Flag — Socratic Defense Required
            </span>
            <span className="bg-amber-200 text-amber-900 font-bold text-[10px] px-2 py-0.5 rounded-full">
              Anti-Cheat Active
            </span>
          </div>
          <p className="text-xs text-amber-900 mt-1 leading-relaxed">
            {reason || 'Anomalous pacing or focus interruptions detected. ThinkForge requires conceptual interrogation before this milestone can be verified.'}
          </p>
        </div>
      </div>

      <button
        onClick={onJumpToDefense}
        className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
      >
        <span>Respond to Socratic Interrogator</span>
        <ArrowDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
