'use client';

import React from 'react';
import { Timer } from './Timer';
import { ShieldCheck, ShieldAlert, BookOpen, GraduationCap, Sparkles, User, HelpCircle } from 'lucide-react';

interface HeaderProps {
  currentView: 'hero' | 'workspace' | 'quizzes' | 'teacher' | 'profile' | 'arena';
  onNavigate: (view: 'hero' | 'workspace' | 'quizzes' | 'teacher' | 'profile' | 'arena') => void;
  isFocused?: boolean;
  violationCount?: number;
  timerSeconds?: number;
  isTimerPaused?: boolean;
  onTimeChange?: (elapsed: number, remaining: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  isFocused = true,
  violationCount = 0,
  timerSeconds = 420,
  isTimerPaused = false,
  onTimeChange
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#FAF9F5]/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div
          onClick={() => onNavigate('hero')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-8 h-8 text-[#1F5F50] transition-transform group-hover:scale-105">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.5V11h-4V9.5C8.8 8.8 8 7.5 8 6a4 4 0 0 1 4-4z"/>
              <path d="M10 14a2 2 0 1 0 4 0v-3h-4v3z"/>
              <path d="M12 18v4"/>
              <path d="M8 22h8"/>
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-[#0F2E2E] font-serif">
            ThinkForge
          </span>
        </div>

        {/* Dynamic Focus Lock & Timer (Visible in workspace mode) */}
        {currentView === 'workspace' && (
          <div className="hidden md:flex items-center gap-3">
            {/* Live Focus Monitor Badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                isFocused
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-300 text-rose-800 animate-bounce'
              }`}
            >
              {isFocused ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-600" />
              )}
              <span>
                {isFocused
                  ? violationCount > 0
                    ? `Active (${violationCount} Violations Logged)`
                    : 'Active (Focus Locked)'
                  : 'Focus Violation Detected!'}
              </span>
            </div>

            {/* Dynamic Countdown Timer */}
            <Timer
              initialSeconds={timerSeconds}
              complexityDepth="intermediate"
              isPaused={isTimerPaused}
              violationCount={violationCount}
              penaltySecondsPerViolation={30}
              onTimeChange={onTimeChange}
            />
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-3 text-xs sm:text-sm font-medium text-slate-700">
          <button
            onClick={() => onNavigate('workspace')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              currentView === 'workspace'
                ? 'bg-[#113A35] text-white font-semibold'
                : 'hover:text-[#113A35]'
            }`}
          >
            Assessment Workspace
          </button>

          <button
            onClick={() => onNavigate('quizzes')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              currentView === 'quizzes'
                ? 'bg-[#113A35] text-white font-semibold'
                : 'hover:text-[#113A35]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>My Quizzes</span>
          </button>

          <button
            onClick={() => onNavigate('teacher')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              currentView === 'teacher'
                ? 'bg-[#113A35] text-white font-semibold'
                : 'hover:text-[#113A35]'
            }`}
          >
            For Teachers
          </button>

          <button
            onClick={() => onNavigate('profile')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              currentView === 'profile'
                ? 'bg-[#113A35] text-white font-semibold'
                : 'hover:text-[#113A35]'
            }`}
          >
            Independence Profile
          </button>

          <button
            onClick={() => onNavigate('arena')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              currentView === 'arena'
                ? 'bg-gradient-to-r from-emerald-800 to-teal-800 text-white font-bold shadow-xs'
                : 'text-emerald-900 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/70 font-semibold'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Algorithm Arena</span>
          </button>

          {currentView === 'hero' ? (
            <button
              onClick={() => onNavigate('workspace')}
              className="bg-[#113A35] hover:bg-[#0c2a26] text-white px-4 py-2 rounded-full font-medium transition-all shadow-xs ml-2 cursor-pointer"
            >
              Get Started
            </button>
          ) : (
            <button
              onClick={() => onNavigate('hero')}
              className="text-slate-500 hover:text-slate-800 px-3 py-1.5 text-xs cursor-pointer"
            >
              Home
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
