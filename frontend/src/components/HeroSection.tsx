'use client';

import React from 'react';
import { ArrowRight, BookOpen, Brain, CheckCircle, ChevronRight, Code2, Sparkles, Target, Compass, Lock } from 'lucide-react';

interface HeroSectionProps {
  onStartLearning: () => void;
  onExploreHowItWorks: () => void;
  onOpenTeacherDashboard: () => void;
  onOpenArena?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartLearning,
  onExploreHowItWorks,
  onOpenTeacherDashboard,
  onOpenArena
}) => {
  return (
    <div className="relative overflow-hidden bg-[#FAF9F5] text-slate-900 min-h-[92vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Decorative Radial Gradient & Shapes */}
      <div className="absolute top-10 right-0 -mr-20 w-[520px] h-[520px] bg-[#1F4E45]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-[#3B7A6D]/8 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Typography & CTAs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-flex items-center gap-2">
            <span className="w-6 h-[2px] bg-[#2E7A68]"></span>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2E7A68]">
              Build Independent Thinkers
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-serif tracking-tight text-[#0F2E2E] leading-[1.08]">
            Don't Replace <br />
            Thinking. <br />
            <span className="text-[#1F5F50] font-bold">Forge It.</span>
          </h1>

          <p className="text-lg text-slate-600 leading-relaxed max-w-lg font-sans">
            An AI learning mentor that helps you reason through problems, understand the concepts, and build the confidence to solve challenges on your own.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onStartLearning}
              className="inline-flex items-center gap-3 bg-[#113A35] hover:bg-[#0c2a26] text-white px-7 py-3.5 rounded-full font-medium shadow-md shadow-[#113A35]/15 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <span>Start Learning</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onExploreHowItWorks}
              className="inline-flex items-center gap-2 bg-transparent hover:bg-[#113A35]/5 text-[#113A35] border border-[#113A35]/50 px-6 py-3.5 rounded-full font-medium transition-all cursor-pointer"
            >
              Explore How It Works
            </button>
          </div>

          <p className="text-xs text-slate-500 pt-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7A68]"></span>
            Guided by AI. Grounded in your course materials. Proven through independent practice.
          </p>
        </div>

        {/* Right Column: Hero Interactive Workspace Preview Card */}
        <div className="lg:col-span-7 relative">
          <div
            onClick={onStartLearning}
            className="group cursor-pointer relative bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden transition-all duration-300 hover:shadow-3xl hover:border-[#2E7A68]/40"
          >
            {/* Top Bar Hint Badge */}
            <div className="absolute top-3 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-[#113A35] text-white text-xs px-3 py-1 rounded-full shadow flex items-center gap-1.5 font-medium">
              <span>Click to Enter Live Workspace</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>

            <div className="grid grid-cols-12 min-h-[460px]">
              {/* Mockup Sidebar */}
              <div className="col-span-3 bg-[#0D2229] text-slate-300 p-4 flex flex-col justify-between hidden sm:flex">
                <div className="space-y-6">
                  {/* Brand Mark in Sidebar */}
                  <div className="flex items-center gap-2.5 text-white pt-1">
                    <div className="w-6 h-6 text-[#40916C]">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.5V11h-4V9.5C8.8 8.8 8 7.5 8 6a4 4 0 0 1 4-4z"/>
                        <path d="M10 14a2 2 0 1 0 4 0v-3h-4v3z"/>
                        <path d="M12 18v4"/>
                        <path d="M8 22h8"/>
                      </svg>
                    </div>
                    <span className="font-bold text-sm tracking-tight text-white">ThinkForge</span>
                  </div>

                  {/* Navigation Links */}
                  <nav className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#17383D] text-[#64D8B8] font-medium">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                      My Learning
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-400 hover:text-white">
                      <Code2 className="w-4 h-4" />
                      Assignments
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-400 hover:text-white">
                      <BookOpen className="w-4 h-4" />
                      Study Materials
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-400 hover:text-white">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="20" x2="18" y2="10"/>
                        <line x1="12" y1="20" x2="12" y2="4"/>
                        <line x1="6" y1="20" x2="6" y2="14"/>
                      </svg>
                      Progress
                    </div>
                  </nav>
                </div>

                <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-3">
                  Settings & Profile
                </div>
              </div>

              {/* Main Workspace Preview Content */}
              <div className="col-span-12 sm:col-span-9 p-5 flex flex-col justify-between bg-slate-50/50">
                {/* Header breadcrumb & guided indicator */}
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 text-xs">
                    <span className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1">
                      ← Back to Assignments
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-600">Guided → Independent</span>
                      <div className="flex items-center gap-1">
                        <span className="w-5 h-2 rounded-full bg-[#113A35]"></span>
                        <span className="w-2 h-2 rounded-full bg-[#113A35]"></span>
                        <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold font-serif text-slate-900 mt-3 mb-4">
                    Understanding Recursion
                  </h3>

                  {/* Split Preview Grid: Code Editor & AI Mentor Card */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                    {/* Left: Code Editor Mock */}
                    <div className="md:col-span-7 bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
                      <div className="text-[11px] font-semibold text-slate-700 mb-2">Your Answer</div>
                      <div className="font-mono text-xs bg-slate-50 p-2.5 rounded-lg text-slate-800 border border-slate-200/60 space-y-1">
                        <div className="flex gap-3">
                          <span className="text-slate-400 select-none">1</span>
                          <span className="text-blue-700 font-semibold">def</span> factorial(n):
                        </div>
                        <div className="flex gap-3">
                          <span className="text-slate-400 select-none">2</span>
                          <span className="pl-4">
                            <span className="text-purple-700 font-semibold">if</span> n == 0:
                          </span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-slate-400 select-none">3</span>
                          <span className="pl-8">
                            <span className="text-purple-700 font-semibold">return</span> 1
                          </span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-slate-400 select-none">4</span>
                          <span className="pl-4">
                            <span className="text-purple-700 font-semibold">return</span> n * factorial(n - 1)
                          </span>
                        </div>
                        <div className="flex gap-3 text-slate-400 italic">
                          <span className="select-none">5</span>
                          <span># I'm not sure if this is correct...</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-2 text-[11px]">
                        <span className="text-slate-500 hover:text-slate-800">📎 Add attachment</span>
                        <span className="bg-[#113A35] text-white px-3 py-1 rounded-md font-medium text-xs">
                          Submit
                        </span>
                      </div>
                    </div>

                    {/* Right: AI Mentor Card */}
                    <div className="md:col-span-5 bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#113A35] mb-2">
                          <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-[#1F5F50]" />
                          </div>
                          <span>AI Mentor</span>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-800 mb-1 leading-snug">
                          What happens to the function when it reaches the base case?
                        </p>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          Think about how the base case changes the flow of the function. What does it return, and how does that affect the recursive calls?
                        </p>
                      </div>

                      {/* Course Notes Reference Chip */}
                      <div className="mt-3 bg-emerald-50/80 border border-emerald-200/90 rounded-lg p-2 flex items-center justify-between text-[10px] text-emerald-900 font-medium">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Course Notes - Page 12</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-emerald-700" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Independent Challenge Banner (As in Reference) */}
                <div className="mt-3.5 bg-white border border-slate-200/90 rounded-xl p-3 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Independent Challenge</h4>
                      <p className="text-[10px] text-slate-500">Try a related problem without AI hints.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#113A35]"></span>
                      <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                      <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Algorithm Arena Feature Card Showcase */}
      {onOpenArena && (
        <div className="max-w-7xl mx-auto w-full mt-14 pt-8 border-t border-slate-200/80">
          <div className="bg-gradient-to-r from-[#0F2E2E] via-[#113A35] to-[#1F5F50] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden group">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-emerald-400/5 blur-2xl pointer-events-none" />

            <div className="space-y-2 relative z-10">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Interactive Mini-Game</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                Algorithm Arena
              </h3>
              <p className="text-emerald-100/80 text-xs sm:text-sm max-w-xl leading-relaxed">
                <em>Think Strategically. Solve Algorithmically.</em> Master Dijkstra's pathfinding, graph edge relaxations, and algorithmic sequencing through real-time puzzle challenges.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 relative z-10">
              <button
                onClick={onOpenArena}
                className="inline-flex items-center gap-2 bg-[#64D8B8] hover:bg-[#52cba9] text-[#0A2328] px-7 py-3.5 rounded-full font-bold text-sm shadow-lg shadow-emerald-950/20 transition-all hover:scale-105 cursor-pointer"
              >
                <span>Play Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
