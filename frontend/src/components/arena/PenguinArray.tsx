'use client';

import React from 'react';
import { Crown, CheckCircle2, ArrowUpDown } from 'lucide-react';

interface PenguinArrayProps {
  array: number[];
  comparedIndices?: [number, number] | null;
  swappedIndices?: [number, number] | null;
  currentMinIndex?: number | null;
  sortedIndices?: number[];
  onPenguinClick?: (index: number) => void;
  showIndices?: boolean;
  maxVal?: number;
}

export const PenguinArray: React.FC<PenguinArrayProps> = ({
  array,
  comparedIndices = null,
  swappedIndices = null,
  currentMinIndex = null,
  sortedIndices = [],
  onPenguinClick,
  showIndices = true,
  maxVal = Math.max(...array, 5)
}) => {
  return (
    <div className="w-full flex items-end justify-center gap-3 sm:gap-5 py-6 px-2 min-h-[260px] select-none overflow-x-auto">
      {array.map((value, idx) => {
        const isCompared =
          comparedIndices !== null &&
          (comparedIndices[0] === idx || comparedIndices[1] === idx);

        const isSwapping =
          swappedIndices !== null &&
          (swappedIndices[0] === idx || swappedIndices[1] === idx);

        const isMin = currentMinIndex === idx;
        const isSorted = sortedIndices.includes(idx);

        // Height proportional to numerical value: between 90px and 220px
        const heightPx = Math.max(85, Math.min(220, 60 + (value / maxVal) * 150));

        // Coloring by state
        let bellyColor = '#FFFFFF';
        let bodyColor = '#0F2E2E'; // Dark teal body
        let accentBorder = 'border-slate-300';
        let glowClass = '';

        if (isSwapping) {
          bodyColor = '#BE123C'; // Coral/Rose
          accentBorder = 'border-rose-400 ring-4 ring-rose-400/40';
          glowClass = 'scale-105 animate-pulse';
        } else if (isMin) {
          bodyColor = '#0F766E'; // Teal/Emerald
          accentBorder = 'border-emerald-400 ring-4 ring-emerald-400/40';
          glowClass = 'scale-105';
        } else if (isCompared) {
          bodyColor = '#0284C7'; // Cyan/Sky
          accentBorder = 'border-sky-400 ring-4 ring-sky-400/40';
          glowClass = 'scale-102';
        } else if (isSorted) {
          bodyColor = '#065F46'; // Forest emerald
          accentBorder = 'border-emerald-500/80';
        }

        return (
          <div
            key={`penguin-${idx}-${value}`}
            onClick={() => onPenguinClick && onPenguinClick(idx)}
            className={`flex flex-col items-center transition-all duration-300 ${glowClass} ${
              onPenguinClick ? 'cursor-pointer hover:scale-105' : ''
            }`}
            style={{ width: '64px' }}
          >
            {/* Status Floating Pill (Crown, Swap, Checkmark) */}
            <div className="h-6 flex items-center justify-center mb-1">
              {isMin && (
                <span className="flex items-center gap-1 bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm animate-bounce">
                  <Crown className="w-3 h-3 fill-slate-900" />
                  MIN
                </span>
              )}
              {isSwapping && !isMin && (
                <span className="flex items-center gap-1 bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
                  <ArrowUpDown className="w-3 h-3" />
                  SWAP
                </span>
              )}
              {isSorted && !isMin && (
                <span className="bg-emerald-100 text-emerald-800 p-0.5 rounded-full shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </span>
              )}
            </div>

            {/* Penguin SVG Character */}
            <div
              className={`relative w-full rounded-3xl transition-all duration-300 flex items-center justify-center drop-shadow-md ${accentBorder}`}
              style={{ height: `${heightPx}px` }}
            >
              <svg
                viewBox="0 0 70 120"
                preserveAspectRatio="none"
                className="w-full h-full overflow-visible"
              >
                {/* Flippers */}
                <ellipse cx="6" cy="65" rx="7" ry="24" fill={bodyColor} className="origin-top -rotate-12" />
                <ellipse cx="64" cy="65" rx="7" ry="24" fill={bodyColor} className="origin-top rotate-12" />

                {/* Main Body */}
                <ellipse cx="35" cy="60" rx="28" ry="52" fill={bodyColor} />

                {/* White Belly Patch */}
                <ellipse cx="35" cy="66" rx="19" ry="38" fill={bellyColor} />

                {/* Scarf / Collar */}
                <path
                  d="M 14 36 Q 35 44 56 36 Q 35 48 14 36"
                  fill={isSorted ? '#10B981' : isMin ? '#F59E0B' : '#0D9488'}
                />

                {/* Penguin Eyes */}
                {isSorted ? (
                  // Happy squinting eyes
                  <>
                    <path d="M 23 23 Q 27 19 31 23" stroke="#0F172A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <path d="M 39 23 Q 43 19 47 23" stroke="#0F172A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  </>
                ) : (
                  // Curious round eyes
                  <>
                    <circle cx="27" cy="22" r="4.5" fill="#FFFFFF" />
                    <circle cx="43" cy="22" r="4.5" fill="#FFFFFF" />
                    <circle cx="28" cy="22" r="2.5" fill="#0F172A" />
                    <circle cx="44" cy="22" r="2.5" fill="#0F172A" />
                  </>
                )}

                {/* Cute Orange Beak */}
                <polygon points="35,26 29,32 41,32" fill="#F97316" />

                {/* Orange Feet */}
                <ellipse cx="25" cy="114" rx="9" ry="5" fill="#F97316" />
                <ellipse cx="45" cy="114" rx="9" ry="5" fill="#F97316" />
              </svg>

              {/* Value Badge placed centered on the penguin's belly */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                <span
                  className={`font-mono font-black text-lg sm:text-xl drop-shadow-sm px-2 py-0.5 rounded-lg ${
                    isSorted
                      ? 'text-emerald-900 bg-emerald-100/90'
                      : isMin
                      ? 'text-amber-950 bg-amber-200/90'
                      : isCompared
                      ? 'text-sky-950 bg-sky-200/90'
                      : 'text-slate-900 bg-white/90'
                  }`}
                >
                  {value}
                </span>
              </div>
            </div>

            {/* Position Index Label */}
            {showIndices && (
              <span className="mt-2 text-[11px] font-mono font-semibold text-slate-500">
                idx[{idx}]
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
