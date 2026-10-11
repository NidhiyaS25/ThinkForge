'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { HeroSection } from '../components/HeroSection';
import { AssignmentViewer } from '../components/AssignmentViewer';
import { SocraticChat } from '../components/SocraticChat';
import { KnowledgeGraph } from '../components/KnowledgeGraph';
import { DefenseBanner } from '../components/DefenseBanner';
import { IndependentChallenge } from '../components/IndependentChallenge';
import { TeacherDashboard } from '../components/TeacherDashboard';
import { IndependenceProfile } from '../components/IndependenceProfile';
import { AlgorithmArena } from '../components/arena/AlgorithmArena';
import { useFocusMonitor } from '../hooks/useFocusMonitor';
import { ragService } from '../lib/ragService';
import { Compass } from 'lucide-react';
import {
  Assignment,
  CourseDocument,
  HintMessage,
  KnowledgeNode,
  IndependenceMetrics,
  AssistanceLevel
} from '../types';

export default function Home() {
  const [currentView, setCurrentView] = useState<'hero' | 'workspace' | 'teacher' | 'profile' | 'arena'>('workspace');

  // Anti-Cheat Focus Monitor Hook
  const { isActive, violationCount, statusMessage } = useFocusMonitor({
    enabled: currentView === 'workspace',
    penaltySeconds: 30,
    onViolation: (count, reason) => {
      console.warn(`[AntiCheat] Focus violation ${count}: ${reason}`);
    }
  });

  // Timer State
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  // Assignment & Workspace State
  const [assignment, setAssignment] = useState<Assignment>({
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
  });

  const [code, setCode] = useState(assignment.starter_code);
  const [hasInitialAttempt, setHasInitialAttempt] = useState(false);
  const [attemptVersion, setAttemptVersion] = useState(1);
  const [reflectionText, setReflectionText] = useState('');
  const [hasReflectionSubmitted, setHasReflectionSubmitted] = useState(false);

  // Socratic Chat & Mentoring State
  const [currentHintLevel, setCurrentHintLevel] = useState<AssistanceLevel>(1);
  const [messages, setMessages] = useState<HintMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      level: 1,
      text: 'What happens to the function when it reaches the base case? Think about how the base case changes the flow of the function. What does it return, and how does that affect the recursive calls?',
      citations: [
        {
          document_name: 'Course Notes - Page 12',
          page: 12,
          excerpt: 'Base Cases in Recursion: Without a base case, recursion continues infinitely...'
        }
      ],
      timestamp: '10:32 AM'
    }
  ]);
  const [isStreamingHint, setIsStreamingHint] = useState(false);

  // Socratic Anti-Cheat & Defense Required State
  const [isDefenseMode, setIsDefenseMode] = useState(false);
  const [defenseReason, setDefenseReason] = useState<string>('');
  const [defenseQuestion, setDefenseQuestion] = useState<string>('');

  // Knowledge Graph Nodes
  const [knowledgeNodes, setKnowledgeNodes] = useState<KnowledgeNode[]>([
    { id: 1, name: 'Base Case Formulation', status: 'verified' },
    { id: 2, name: 'Recursive Sub-problem', status: 'verified' },
    { id: 3, name: 'Call Stack Unwinding', status: 'pending' },
    { id: 4, name: 'Edge Case Guard Rails', status: 'pending' }
  ]);

  // Documents & Metrics
  const [documents, setDocuments] = useState<CourseDocument[]>([]);
  const [independenceMetrics, setIndependenceMetrics] = useState<IndependenceMetrics>({
    student_id: 1,
    initial_attempt_submitted_before_hint: false,
    total_hints_used: 1,
    hint_levels_breakdown: { 1: 1, 2: 0, 3: 0 },
    total_revisions: 0,
    reflection_completed: false,
    focus_violations_count: 0,
    transfer_score: null,
    independent_mastery_level: 'Progressing (Guided Practitioner)'
  });

  // Load initial documents and assignments
  useEffect(() => {
    async function loadInitialData() {
      const docs = await ragService.getDocuments(1);
      setDocuments(docs);
      const metrics = await ragService.getIndependenceMetrics();
      setIndependenceMetrics((prev) => ({
        ...prev,
        focus_violations_count: violationCount
      }));
    }
    loadInitialData();
  }, [violationCount]);

  // Submission handler
  const handleSubmitAttempt = async () => {
    // 1. Save attempt record
    await ragService.saveAttempt(assignment.id, code, violationCount, secondsElapsed);
    setHasInitialAttempt(true);
    setAttemptVersion((prev) => prev + 1);

    // 2. Evaluate submission for anti-cheat anomalies & synthetic patterns
    const evalResult = await ragService.evaluateSubmission(
      assignment.id,
      code,
      secondsElapsed,
      violationCount
    );

    if (evalResult.defense_required) {
      setIsDefenseMode(true);
      setDefenseReason(evalResult.reason || 'Pacing or focus anomaly flagged.');
      setDefenseQuestion(
        evalResult.defense_question ||
          'Defense Required: In your implementation, what exact memory state change occurs when `n == 0` is evaluated? Walk through the return sequence from factorial(1) back to factorial(n).'
      );

      // Add defense challenge to chat
      setMessages((prev) => [
        ...prev,
        {
          id: `defense-${Date.now()}`,
          sender: 'ai',
          text:
            evalResult.defense_question ||
            'Defense Required: Walk through the return sequence from factorial(1) back to factorial(n).',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isDefenseQuestion: true
        }
      ]);

      // Update knowledge node status to defense_required
      setKnowledgeNodes((prev) =>
        prev.map((node) =>
          node.name === 'Call Stack Unwinding' ? { ...node, status: 'defense_required' } : node
        )
      );
    } else {
      setIsDefenseMode(false);
      // Auto-verify node
      setKnowledgeNodes((prev) =>
        prev.map((node) =>
          node.name === 'Call Stack Unwinding' ? { ...node, status: 'verified' } : node
        )
      );
    }
  };

  // Request progressive Socratic Hint
  const handleRequestHint = async (level: AssistanceLevel, query?: string) => {
    setCurrentHintLevel(level);
    setIsStreamingHint(true);

    if (query) {
      setMessages((prev) => [
        ...prev,
        {
          id: `student-${Date.now()}`,
          sender: 'student',
          text: query,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }

    try {
      const hint = await ragService.requestHint(assignment.id, level, query);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          level,
          text: hint.hint_text,
          citations: hint.citations,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      // Update metrics
      setIndependenceMetrics((prev) => ({
        ...prev,
        total_hints_used: prev.total_hints_used + 1,
        hint_levels_breakdown: {
          ...prev.hint_levels_breakdown,
          [level]: (prev.hint_levels_breakdown[level] || 0) + 1
        }
      }));
    } finally {
      setIsStreamingHint(false);
    }
  };

  // Socratic Defense Verification
  const handleVerifyDefense = async (defenseAnswer: string) => {
    // Add student message to chat
    setMessages((prev) => [
      ...prev,
      {
        id: `def-ans-${Date.now()}`,
        sender: 'student',
        text: defenseAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    const result = await ragService.verifyDefense(assignment.id, 'Call Stack Unwinding', defenseAnswer);

    // AI feedback message
    setMessages((prev) => [
      ...prev,
      {
        id: `def-ver-${Date.now()}`,
        sender: 'ai',
        text: result.feedback,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    if (result.verified) {
      setIsDefenseMode(false);
      setKnowledgeNodes((prev) =>
        prev.map((node) =>
          node.name === 'Call Stack Unwinding' ? { ...node, status: 'verified' } : node
        )
      );
    }
  };

  // Submit Reflection
  const handleSubmitReflection = () => {
    if (!reflectionText.trim()) return;
    setHasReflectionSubmitted(true);
    setIndependenceMetrics((prev) => ({
      ...prev,
      reflection_completed: true
    }));
  };

  // Submit Transfer Challenge
  const handleSubmitTransfer = async (transferResponse: string) => {
    const res = await ragService.submitTransferChallenge(assignment.id, transferResponse);
    setIndependenceMetrics((prev) => ({
      ...prev,
      transfer_score: res.score,
      independent_mastery_level:
        res.score >= 80 ? 'High Independence (Forged Master)' : 'Progressing (Guided Practitioner)'
    }));
    return res;
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentView={currentView}
        onNavigate={setCurrentView}
        isFocused={isActive}
        violationCount={violationCount}
        timerSeconds={assignment.target_time_seconds}
        isTimerPaused={isTimerPaused}
        onTimeChange={(elapsed) => setSecondsElapsed(elapsed)}
      />

      {/* Main Body Switcher */}
      <main className="flex-1 flex flex-col">
        {currentView === 'hero' && (
          <HeroSection
            onStartLearning={() => setCurrentView('workspace')}
            onExploreHowItWorks={() => setCurrentView('workspace')}
            onOpenTeacherDashboard={() => setCurrentView('teacher')}
            onOpenArena={() => setCurrentView('arena')}
          />
        )}

        {currentView === 'arena' && (
          <AlgorithmArena onBack={() => setCurrentView('workspace')} />
        )}

        {currentView === 'teacher' && (
          <TeacherDashboard
            documents={documents}
            assignments={[assignment]}
            onUploadPDF={async (file) => {
              const newDocs = await ragService.getDocuments(1);
              setDocuments(newDocs);
            }}
            onCreateAssignment={async (data) => {
              setAssignment((prev) => ({ ...prev, ...(data as Assignment) }));
            }}
          />
        )}

        {currentView === 'profile' && (
          <IndependenceProfile metrics={independenceMetrics} />
        )}

        {currentView === 'workspace' && (
          <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Algorithm Arena Quick Entry Banner */}
            <div className="bg-gradient-to-r from-[#0F2E2E] via-[#113A35] to-[#1F5F50] rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-sm sm:text-base tracking-wide">
                      Algorithm Arena: Dijkstra's Path Challenge
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                      Mini-Game
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100/80 mt-0.5 leading-relaxed">
                    Think Strategically. Solve Algorithmically. Master shortest paths, edge relaxations, and algorithm sequences.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCurrentView('arena')}
                className="inline-flex items-center gap-2 bg-[#64D8B8] hover:bg-[#52cba9] text-[#0A2328] px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all hover:scale-105 shrink-0 cursor-pointer"
              >
                <span>Play Arena</span>
                <span className="text-sm">→</span>
              </button>
            </div>

            {/* Defense Required Alert Banner (When anti-cheat anomaly is flagged) */}
            {isDefenseMode && (
              <DefenseBanner
                reason={defenseReason}
                onJumpToDefense={() => {
                  const chatEl = document.getElementById('socratic-chat-container');
                  if (chatEl) chatEl.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            )}

            {/* Split Assessment Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
              {/* Left Column (7 cols): Assignment Viewer & Code Editor */}
              <div className="lg:col-span-7 flex flex-col">
                <AssignmentViewer
                  assignment={assignment}
                  code={code}
                  onChangeCode={setCode}
                  onSubmitAttempt={handleSubmitAttempt}
                  hasInitialAttempt={hasInitialAttempt}
                  version={attemptVersion}
                  reflectionText={reflectionText}
                  onChangeReflection={setReflectionText}
                  onSubmitReflection={handleSubmitReflection}
                  hasReflectionSubmitted={hasReflectionSubmitted}
                />
              </div>

              {/* Right Column (5 cols): Socratic Chat & Interrogator */}
              <div id="socratic-chat-container" className="lg:col-span-5 flex flex-col">
                <SocraticChat
                  hasInitialAttempt={hasInitialAttempt}
                  onRequestHint={handleRequestHint}
                  onVerifyDefense={handleVerifyDefense}
                  messages={messages}
                  currentLevel={currentHintLevel}
                  isDefenseMode={isDefenseMode}
                  defenseQuestion={defenseQuestion}
                  isStreaming={isStreamingHint}
                />
              </div>
            </div>

            {/* Visual Knowledge Graph Component */}
            <div className="w-full">
              <KnowledgeGraph nodes={knowledgeNodes} />
            </div>

            {/* Bottom Row: AI-Free Independent Challenge */}
            <div className="w-full">
              <IndependentChallenge
                question={assignment.transfer_question}
                onSubmit={handleSubmitTransfer}
                completedScore={independenceMetrics.transfer_score}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/60 py-6 px-4 text-center text-xs text-slate-500">
        <p className="font-medium text-slate-700">
          ThinkForge — “Don't replace thinking. Forge it.”
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          An AI that trains you to need it less. Socratic anti-cheat & dynamic timing verification.
        </p>
      </footer>
    </div>
  );
}
