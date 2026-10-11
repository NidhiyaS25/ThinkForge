'use client';

import React, { useState } from 'react';
import { Sparkles, BookOpen, Send, ShieldAlert, CheckCircle2, ChevronRight, Lock } from 'lucide-react';
import { AssistanceLevel, HintMessage, Citation } from '../types';

interface SocraticChatProps {
  hasInitialAttempt: boolean;
  onRequestHint: (level: AssistanceLevel, query?: string) => void;
  onVerifyDefense?: (defenseAnswer: string) => void;
  messages: HintMessage[];
  currentLevel: AssistanceLevel;
  isDefenseMode?: boolean;
  defenseQuestion?: string;
  isStreaming?: boolean;
}

export const SocraticChat: React.FC<SocraticChatProps> = ({
  hasInitialAttempt,
  onRequestHint,
  onVerifyDefense,
  messages,
  currentLevel,
  isDefenseMode = false,
  defenseQuestion,
  isStreaming = false
}) => {
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;

    if (isDefenseMode && onVerifyDefense) {
      onVerifyDefense(inputText);
    } else {
      onRequestHint(currentLevel, inputText);
    }
    setInputText('');
  };

  const getLevelLabel = (lvl: AssistanceLevel) => {
    switch (lvl) {
      case 1:
        return 'Level 1: Clarifying Question';
      case 2:
        return 'Level 2: Conceptual Hint';
      case 3:
        return 'Level 3: Partial Outline';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700">
            {isDefenseMode ? (
              <ShieldAlert className="w-4 h-4 text-amber-600 animate-pulse" />
            ) : (
              <Sparkles className="w-4 h-4 text-emerald-700" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              {isDefenseMode ? 'Socratic Interrogator' : 'AI Mentor'}
              {isDefenseMode ? (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  Defense Required
                </span>
              ) : (
                <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
                  Grounded RAG
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              {isDefenseMode
                ? 'Defend your algorithmic logic to verify independent mastery'
                : 'Progressive guidance grounded in teacher course materials'}
            </p>
          </div>
        </div>

        {/* Level Selector Pills */}
        {!isDefenseMode && (
          <div className="flex items-center bg-slate-100/90 p-1 rounded-lg text-xs">
            {([1, 2, 3] as AssistanceLevel[]).map((lvl) => (
              <button
                key={lvl}
                onClick={() => hasInitialAttempt && onRequestHint(lvl)}
                disabled={!hasInitialAttempt}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  currentLevel === lvl
                    ? 'bg-white text-emerald-900 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                } ${!hasInitialAttempt ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                L{lvl}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* If no initial attempt exists yet */}
        {!hasInitialAttempt && (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-amber-900 text-xs flex items-start gap-3">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">AI Guidance Locked</p>
              <p className="text-amber-800 leading-relaxed">
                ThinkForge trains independent thinking. You must submit your first attempt in the editor before Socratic hints become available.
              </p>
            </div>
          </div>
        )}

        {/* Defense Alert Banner in Chat */}
        {isDefenseMode && defenseQuestion && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-semibold">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Socratic Interrogation Challenge</span>
            </div>
            <p className="text-slate-800 leading-relaxed font-medium">
              {defenseQuestion}
            </p>
            <p className="text-slate-500 text-[11px]">
              Explain the intermediate execution flow in your own words to unlock verification.
            </p>
          </div>
        )}

        {/* Message Bubble History */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'student' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl p-4 text-sm leading-relaxed ${
                msg.sender === 'student'
                  ? 'bg-emerald-800 text-white rounded-br-xs'
                  : msg.isDefenseQuestion
                  ? 'bg-amber-50 border border-amber-200 text-amber-950 rounded-bl-xs'
                  : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-bl-xs'
              }`}
            >
              {msg.sender === 'ai' && msg.level && (
                <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  {getLevelLabel(msg.level)}
                </div>
              )}
              <p className="whitespace-pre-wrap">{msg.text}</p>

              {/* Course Note Citation Chip (as in reference image) */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200/60">
                  {msg.citations.map((cite, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200/80 rounded-lg px-3 py-2 text-xs text-emerald-900 hover:bg-emerald-100/70 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="font-medium">
                          {cite.document_name} - Page {cite.page}
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {isStreaming && (
          <div className="flex items-center gap-2 text-slate-500 text-xs italic p-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
            Synthesizing Socratic hint from course materials...
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={!hasInitialAttempt && !isDefenseMode}
            placeholder={
              isDefenseMode
                ? 'Type your conceptual defense explaining the execution flow...'
                : hasInitialAttempt
                ? 'Ask a question or request reasoning guidance...'
                : 'Save an initial attempt to unlock AI guidance'
            }
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={(!hasInitialAttempt && !isDefenseMode) || !inputText.trim()}
            className="bg-emerald-800 hover:bg-emerald-900 text-white p-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
