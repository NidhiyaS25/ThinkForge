'use client';

import React from 'react';

export type PathPupState = 'idle' | 'thinking' | 'happy' | 'sad' | 'celebrating';

interface PathPupProps {
  state: PathPupState;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PathPup: React.FC<PathPupProps> = ({
  state = 'idle',
  message,
  size = 'md',
  className = ''
}) => {
  // Default pedagogical messages based on state
  const defaultMessages: Record<PathPupState, string> = {
    idle: "Ready to explore! Select the next step.",
    thinking: "Hmm... Let's analyze the algorithmic invariant.",
    happy: "Woof! That's the right next step! Great reasoning!",
    sad: "Oops! Let's check those distances together. Every mistake teaches us something!",
    celebrating: "PAW-SOME! YOU DID IT! Every smart decision brought you closer to the goal!"
  };

  const displayMessage = message || defaultMessages[state];

  // Dimension scaling
  const dimensions = {
    sm: { width: 72, height: 72, textClass: 'text-[11px]' },
    md: { width: 96, height: 96, textClass: 'text-xs' },
    lg: { width: 128, height: 128, textClass: 'text-sm' }
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* PathPup Inline SVG Mascot Character */}
      <div
        className={`relative shrink-0 transition-transform duration-300 ${
          state === 'happy' ? 'animate-bounce' : state === 'celebrating' ? 'animate-pulse scale-105' : ''
        }`}
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-md"
        >
          {/* Subtle Shadow */}
          <ellipse cx="50" cy="94" rx="30" ry="5" fill="#0F172A" opacity="0.15" />

          {/* Wagging Tail */}
          <path
            d="M 28 65 Q 16 50 20 40 Q 24 52 32 60"
            fill="#E0A96D"
            stroke="#C0844D"
            strokeWidth="1.5"
            className={state === 'happy' || state === 'celebrating' ? 'origin-bottom-right animate-pulse' : ''}
          />

          {/* Dog Body */}
          <ellipse cx="50" cy="68" rx="24" ry="20" fill="#E8B87D" stroke="#C0844D" strokeWidth="2" />
          {/* White Chest Patch */}
          <ellipse cx="50" cy="72" rx="13" ry="12" fill="#FFF8F0" />

          {/* Front Paws */}
          <ellipse cx="40" cy="88" rx="6" ry="5" fill="#FFF8F0" stroke="#C0844D" strokeWidth="1.5" />
          <ellipse cx="60" cy="88" rx="6" ry="5" fill="#FFF8F0" stroke="#C0844D" strokeWidth="1.5" />

          {/* ThinkForge Teal Collar & Medal */}
          <path d="M 34 56 Q 50 63 66 56" stroke="#0F766E" strokeWidth="4" strokeLinecap="round" fill="none" />
          <circle cx="50" cy="61" r="3.5" fill="#2DD4BF" stroke="#115E59" strokeWidth="1" />

          {/* Dog Head */}
          <circle cx="50" cy="38" r="22" fill="#E8B87D" stroke="#C0844D" strokeWidth="2" />

          {/* Left & Right Ears */}
          {state === 'sad' ? (
            // Drooping sad ears
            <>
              <path d="M 29 32 Q 18 42 22 56 Q 30 52 33 38" fill="#C0844D" stroke="#9A6235" strokeWidth="1.5" />
              <path d="M 71 32 Q 82 42 78 56 Q 70 52 67 38" fill="#C0844D" stroke="#9A6235" strokeWidth="1.5" />
            </>
          ) : (
            // Happy perked ears
            <>
              <path d="M 30 32 Q 18 18 26 12 Q 38 20 34 34" fill="#C0844D" stroke="#9A6235" strokeWidth="1.5" />
              <path d="M 70 32 Q 82 18 74 12 Q 62 20 66 34" fill="#C0844D" stroke="#9A6235" strokeWidth="1.5" />
            </>
          )}

          {/* Dog Snout / Muzzle */}
          <ellipse cx="50" cy="44" rx="10" ry="7.5" fill="#FFF8F0" stroke="#C0844D" strokeWidth="1.5" />
          {/* Black Nose */}
          <ellipse cx="50" cy="40" rx="3.5" ry="2.5" fill="#1E293B" />

          {/* Facial Expressions based on State */}
          {state === 'happy' || state === 'celebrating' ? (
            // Happy squinting crescent eyes & open smiling mouth
            <>
              <path d="M 40 32 Q 44 28 48 32" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M 52 32 Q 56 28 60 32" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              {/* Joyful open mouth with pink tongue */}
              <path d="M 46 46 Q 50 53 54 46 Z" fill="#F43F5E" />
            </>
          ) : state === 'sad' ? (
            // Sad droopy eyes with tiny tear
            <>
              <ellipse cx="44" cy="33" rx="2.5" ry="3.5" fill="#1E293B" />
              <ellipse cx="56" cy="33" rx="2.5" ry="3.5" fill="#1E293B" />
              {/* Sad curved mouth */}
              <path d="M 46 48 Q 50 44 54 48" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              {/* Tear */}
              <circle cx="59" cy="38" r="1.5" fill="#38BDF8" />
            </>
          ) : state === 'thinking' ? (
            // Looking up pensively
            <>
              <ellipse cx="43" cy="30" rx="2.5" ry="3.5" fill="#1E293B" />
              <ellipse cx="57" cy="30" rx="2.5" ry="3.5" fill="#1E293B" />
              <line x1="46" y1="46" x2="54" y2="46" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
            </>
          ) : (
            // Idle friendly open eyes
            <>
              <ellipse cx="44" cy="32" rx="2.5" ry="3.5" fill="#1E293B" />
              <ellipse cx="56" cy="32" rx="2.5" ry="3.5" fill="#1E293B" />
              <circle cx="45" cy="31" r="1" fill="#FFFFFF" />
              <circle cx="57" cy="31" r="1" fill="#FFFFFF" />
              <path d="M 46 45 Q 50 48 54 45" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </>
          )}

          {/* Party Hat when Celebrating */}
          {state === 'celebrating' && (
            <g transform="translate(50, 16)">
              <polygon points="-8,4 0,-16 8,4" fill="#F59E0B" stroke="#D97706" strokeWidth="1" />
              <circle cx="0" cy="-16" r="2.5" fill="#2DD4BF" />
              <line x1="-5" y1="-2" x2="5" y2="-2" stroke="#EF4444" strokeWidth="1.5" />
            </g>
          )}
        </svg>
      </div>

      {/* Speech Bubble Feedback */}
      <div
        className={`relative max-w-sm rounded-2xl px-3.5 py-2.5 shadow-xs border transition-all ${
          state === 'happy' || state === 'celebrating'
            ? 'bg-emerald-50/90 border-emerald-200/90 text-emerald-900'
            : state === 'sad'
            ? 'bg-rose-50/90 border-rose-200/90 text-rose-900'
            : state === 'thinking'
            ? 'bg-sky-50/90 border-sky-200/90 text-sky-900'
            : 'bg-white border-slate-200/90 text-slate-800'
        }`}
      >
        {/* Bubble pointer triangle */}
        <div
          className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 border-l border-b ${
            state === 'happy' || state === 'celebrating'
              ? 'bg-emerald-50 border-emerald-200'
              : state === 'sad'
              ? 'bg-rose-50 border-rose-200'
              : state === 'thinking'
              ? 'bg-sky-50 border-sky-200'
              : 'bg-white border-slate-200'
          }`}
        />

        <div className="relative flex items-center gap-1.5 font-bold tracking-tight text-[10px] uppercase opacity-75 mb-0.5">
          <span>PathPup</span>
          <span>•</span>
          <span>
            {state === 'happy'
              ? 'Excited'
              : state === 'sad'
              ? 'Encouraging'
              : state === 'celebrating'
              ? 'Winner!'
              : state === 'thinking'
              ? 'Pondering'
              : 'Companion'}
          </span>
        </div>
        <p className={`relative ${dimensions.textClass} font-medium leading-relaxed`}>
          {displayMessage}
        </p>
      </div>
    </div>
  );
};
