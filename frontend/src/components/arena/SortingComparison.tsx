'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Layers,
  Scale,
  Award,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { PenguinArray } from './PenguinArray';
import {
  generateBubbleSortTrace,
  generateSelectionSortTrace,
  SortingTraceStep,
  SORTING_PRESETS
} from '../../lib/sortingAlgorithms';

interface SortingComparisonProps {
  initialArrayOverride?: number[];
  onBackToHub?: () => void;
}

export const SortingComparison: React.FC<SortingComparisonProps> = ({
  initialArrayOverride,
  onBackToHub
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('standard');
  const [customInput, setCustomInput] = useState<string>('');

  const baseArray = useRef<number[]>(initialArrayOverride || [5, 2, 4, 1, 3]);

  // Traces for both algorithms
  const [bubbleTrace, setBubbleTrace] = useState<SortingTraceStep[]>(() =>
    generateBubbleSortTrace(baseArray.current)
  );
  const [selectionTrace, setSelectionTrace] = useState<SortingTraceStep[]>(() =>
    generateSelectionSortTrace(baseArray.current)
  );

  const [bubbleStepIndex, setBubbleStepIndex] = useState<number>(0);
  const [selectionStepIndex, setSelectionStepIndex] = useState<number>(0);

  // Synchronized playback
  const [isPlayingBoth, setIsPlayingBoth] = useState<boolean>(false);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reflection question state
  const [selectedReflectionAnswer, setSelectedReflectionAnswer] = useState<string | null>(null);
  const [reflectionSubmitted, setReflectionSubmitted] = useState<boolean>(false);

  const currentBubbleStep = bubbleTrace[bubbleStepIndex] || bubbleTrace[0];
  const currentSelectionStep = selectionTrace[selectionStepIndex] || selectionTrace[0];

  const isBubbleComplete = bubbleStepIndex >= bubbleTrace.length - 1;
  const isSelectionComplete = selectionStepIndex >= selectionTrace.length - 1;
  const areBothComplete = isBubbleComplete && isSelectionComplete;

  // Load new array
  const loadArray = useCallback((arr: number[]) => {
    baseArray.current = [...arr];
    setBubbleTrace(generateBubbleSortTrace(arr));
    setSelectionTrace(generateSelectionSortTrace(arr));
    setBubbleStepIndex(0);
    setSelectionStepIndex(0);
    setIsPlayingBoth(false);
    setSelectedReflectionAnswer(null);
    setReflectionSubmitted(false);
  }, []);

  useEffect(() => {
    if (initialArrayOverride) {
      loadArray(initialArrayOverride);
    }
  }, [initialArrayOverride, loadArray]);

  // Preset Selection
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const found = SORTING_PRESETS.find((p) => p.id === presetId);
    if (found) loadArray(found.array);
  };

  // Custom Input
  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = customInput
      .split(/[\s,]+/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 1 && n <= 20);

    if (parsed.length >= 3 && parsed.length <= 7) {
      loadArray(parsed);
      setCustomInput('');
    }
  };

  // Step both
  const stepBoth = useCallback(() => {
    if (!isBubbleComplete) setBubbleStepIndex((prev) => Math.min(prev + 1, bubbleTrace.length - 1));
    if (!isSelectionComplete)
      setSelectionStepIndex((prev) => Math.min(prev + 1, selectionTrace.length - 1));
  }, [isBubbleComplete, isSelectionComplete, bubbleTrace.length, selectionTrace.length]);

  // Synchronized playback timer
  useEffect(() => {
    if (isPlayingBoth) {
      playTimerRef.current = setTimeout(() => {
        if (!isBubbleComplete || !isSelectionComplete) {
          stepBoth();
        } else {
          setIsPlayingBoth(false);
        }
      }, 700);
    }
    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, [isPlayingBoth, isBubbleComplete, isSelectionComplete, stepBoth]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-serif font-bold text-xl text-[#0F2E2E] flex items-center gap-2">
              <Scale className="w-5 h-5 text-teal-700" />
              <span>Sorting Showdown: Comparison Lab</span>
            </h3>
            <span className="bg-gradient-to-r from-teal-500 to-amber-500 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-xs">
              Live Head-to-Head
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare Bubble Sort and Selection Sort side-by-side using the exact same initial array.
          </p>
        </div>

        {/* Global Synchronization Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlayingBoth(!isPlayingBoth)}
            disabled={areBothComplete}
            className="inline-flex items-center gap-1.5 bg-[#64D8B8] hover:bg-[#52cba9] text-[#0A2328] px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all hover:scale-105 cursor-pointer disabled:opacity-40"
          >
            {isPlayingBoth ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlayingBoth ? 'Pause Simulations' : 'Run Both Simultaneously'}</span>
          </button>

          <button
            onClick={stepBoth}
            disabled={areBothComplete}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-40"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Step Both</span>
          </button>

          <button
            onClick={() => loadArray(baseArray.current)}
            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Both</span>
          </button>
        </div>
      </div>

      {/* 2. Side-by-Side Synchronized Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: BUBBLE SORT */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl border border-teal-500/30 p-4 sm:p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="font-bold text-sm text-teal-300 flex items-center gap-2">
                <span>🐧</span>
                <span>Bubble Sort (Penguin Parade)</span>
              </h4>
              <p className="text-[11px] text-slate-400">Repeatedly swaps adjacent out-of-order elements</p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="bg-teal-950 text-teal-300 border border-teal-700/60 px-2.5 py-1 rounded-lg">
                Cmps: <strong>{currentBubbleStep.comparisonsCount}</strong>
              </span>
              <span className="bg-rose-950 text-rose-300 border border-rose-700/60 px-2.5 py-1 rounded-lg">
                Swaps: <strong>{currentBubbleStep.swapsCount}</strong>
              </span>
            </div>
          </div>

          {/* Visual Array */}
          <div className="bg-slate-950/70 rounded-2xl border border-slate-800 p-2 min-h-[220px]">
            <PenguinArray
              array={currentBubbleStep.array}
              comparedIndices={currentBubbleStep.comparedIndices}
              swappedIndices={currentBubbleStep.swappedIndices}
              sortedIndices={currentBubbleStep.sortedIndices}
            />
          </div>

          <div className="text-[11px] bg-slate-800/80 rounded-xl p-2.5 text-slate-300 font-medium">
            {currentBubbleStep.description}
          </div>
        </div>

        {/* RIGHT: SELECTION SORT */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl border border-amber-500/30 p-4 sm:p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="font-bold text-sm text-amber-300 flex items-center gap-2">
                <span>👑</span>
                <span>Selection Sort (Penguin Champion)</span>
              </h4>
              <p className="text-[11px] text-slate-400">Scans unsorted portion to find & place minimum</p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="bg-teal-950 text-teal-300 border border-teal-700/60 px-2.5 py-1 rounded-lg">
                Cmps: <strong>{currentSelectionStep.comparisonsCount}</strong>
              </span>
              <span className="bg-amber-950 text-amber-300 border border-amber-700/60 px-2.5 py-1 rounded-lg">
                Swaps: <strong>{currentSelectionStep.swapsCount}</strong>
              </span>
            </div>
          </div>

          {/* Visual Array */}
          <div className="bg-slate-950/70 rounded-2xl border border-slate-800 p-2 min-h-[220px]">
            <PenguinArray
              array={currentSelectionStep.array}
              comparedIndices={currentSelectionStep.comparedIndices}
              swappedIndices={currentSelectionStep.swappedIndices}
              currentMinIndex={currentSelectionStep.currentMinIndex}
              sortedIndices={currentSelectionStep.sortedIndices}
            />
          </div>

          <div className="text-[11px] bg-slate-800/80 rounded-xl p-2.5 text-slate-300 font-medium">
            {currentSelectionStep.description}
          </div>
        </div>
      </div>

      {/* 3. Live Experiment Outcome Report (When Both are Done) */}
      {areBothComplete && (
        <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white rounded-3xl border border-emerald-500/40 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-emerald-400" />
            <h4 className="font-serif font-bold text-base sm:text-lg text-emerald-200">
              Live Experiment Report: Head-to-Head Statistics
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-700/80">
              <span className="text-slate-400 font-sans block mb-1">Swap Efficiency</span>
              <div className="text-emerald-400 font-bold text-sm">
                Selection Sort: {currentSelectionStep.swapsCount} swaps
              </div>
              <div className="text-slate-300 mt-1">
                Bubble Sort: {currentBubbleStep.swapsCount} swaps
              </div>
              <p className="font-sans text-[11px] text-slate-400 mt-2">
                {currentSelectionStep.swapsCount < currentBubbleStep.swapsCount
                  ? "Selection Sort performed fewer swaps (it performs at most n - 1 swaps total)!"
                  : "Both performed equal swaps on this test sequence."}
              </p>
            </div>

            <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-700/80">
              <span className="text-slate-400 font-sans block mb-1">Comparison Volume</span>
              <div className="text-teal-400 font-bold text-sm">
                Bubble Sort: {currentBubbleStep.comparisonsCount} comparisons
              </div>
              <div className="text-slate-300 mt-1">
                Selection Sort: {currentSelectionStep.comparisonsCount} comparisons
              </div>
              <p className="font-sans text-[11px] text-slate-400 mt-2">
                {currentBubbleStep.comparisonsCount < currentSelectionStep.comparisonsCount
                  ? "Bubble Sort's early-exit optimization reduced total comparisons!"
                  : "Both scanned pairwise elements according to their nested loops."}
              </p>
            </div>

            <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-700/80">
              <span className="text-slate-400 font-sans block mb-1">Stability Invariant</span>
              <div className="text-emerald-400 font-bold text-sm">Bubble Sort: Stable</div>
              <div className="text-rose-400 font-bold text-sm mt-1">Selection Sort: Unstable</div>
              <p className="font-sans text-[11px] text-slate-400 mt-2">
                Bubble only swaps strictly adjacent items (never jumping over equal items). Selection sort swaps over distance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Educational Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
            Algorithmic Specification Matrix
          </h4>
          <p className="text-[11px] text-slate-500">
            Rigorous mathematical comparison between adjacent-swap and selection strategies
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/40 text-[11px] uppercase font-bold text-slate-600">
                <th className="py-2.5 px-4">Property</th>
                <th className="py-2.5 px-4 text-teal-800">Bubble Sort (Penguin Parade)</th>
                <th className="py-2.5 px-4 text-amber-800">Selection Sort (Penguin Champion)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans text-xs">
              <tr>
                <td className="py-2.5 px-4 font-bold text-slate-900">Core Strategy</td>
                <td className="py-2.5 px-4 text-slate-700">Repeatedly swap adjacent out-of-order neighbors</td>
                <td className="py-2.5 px-4 text-slate-700">Repeatedly select the minimum remaining element</td>
              </tr>
              <tr className="bg-slate-50/30">
                <td className="py-2.5 px-4 font-bold text-slate-900">Best-Case Time</td>
                <td className="py-2.5 px-4 font-mono font-bold text-emerald-700">
                  O(n) <span className="font-sans font-normal text-slate-500">(with early-exit optimization)</span>
                </td>
                <td className="py-2.5 px-4 font-mono text-slate-700">
                  O(n²) <span className="font-sans font-normal text-slate-500">(always scans unsorted portion)</span>
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold text-slate-900">Average & Worst Time</td>
                <td className="py-2.5 px-4 font-mono text-slate-700">O(n²)</td>
                <td className="py-2.5 px-4 font-mono text-slate-700">O(n²)</td>
              </tr>
              <tr className="bg-slate-50/30">
                <td className="py-2.5 px-4 font-bold text-slate-900">Auxiliary Space</td>
                <td className="py-2.5 px-4 font-mono text-emerald-700 font-bold">O(1) in-place</td>
                <td className="py-2.5 px-4 font-mono text-emerald-700 font-bold">O(1) in-place</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold text-slate-900">Algorithm Stability</td>
                <td className="py-2.5 px-4 text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Stable (never reorders equal values)
                </td>
                <td className="py-2.5 px-4 text-rose-700 font-bold">
                  Unstable (long-range placement swaps alter tie order)
                </td>
              </tr>
              <tr className="bg-slate-50/30">
                <td className="py-2.5 px-4 font-bold text-slate-900">Typical Swaps</td>
                <td className="py-2.5 px-4 text-slate-700 font-mono">Up to O(n²) swaps</td>
                <td className="py-2.5 px-4 text-emerald-800 font-bold font-mono">At most n − 1 placement swaps</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold text-slate-900">Primary Advantage</td>
                <td className="py-2.5 px-4 text-slate-700">
                  Fast on nearly sorted inputs; stable; highly intuitive
                </td>
                <td className="py-2.5 px-4 text-slate-700">
                  Minimizes write/swap operations (crucial when memory writes are costly)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Interactive Socratic Reflection Question */}
      <div className="bg-gradient-to-r from-[#0F2E2E] to-[#113A35] text-white rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
          <HelpCircle className="w-4 h-4" />
          <span>Socratic Reflection: Why did they behave differently?</span>
        </div>

        <p className="text-xs sm:text-sm text-slate-200">
          Even though both algorithms have an average time complexity of O(n²), why did Selection Sort perform drastically fewer swaps on this array?
        </p>

        <div className="space-y-2 pt-1">
          {[
            {
              id: 'a',
              text: 'Selection Sort uses AI heuristics to predict where penguins belong without checking.',
              isCorrect: false
            },
            {
              id: 'b',
              text: 'Selection Sort delays swapping until it has scanned the entire remaining array, performing at most one placement swap per pass.',
              isCorrect: true
            },
            {
              id: 'c',
              text: 'Bubble Sort is not an in-place algorithm, so it copies penguins into memory.',
              isCorrect: false
            }
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelectedReflectionAnswer(opt.id)}
              className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                selectedReflectionAnswer === opt.id
                  ? 'bg-emerald-500/20 border-emerald-400 text-white font-semibold'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px]">
                  {opt.id.toUpperCase()}
                </span>
                <span>{opt.text}</span>
              </div>
            </button>
          ))}
        </div>

        {selectedReflectionAnswer && (
          <div className="pt-2">
            {selectedReflectionAnswer === 'b' ? (
              <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-xl p-3 text-xs text-emerald-200">
                <strong>Correct!</strong> Selection Sort scans all unsorted candidates before making an exchange, guaranteeing at most <em>n - 1</em> swaps. Bubble Sort on the other hand swaps eagerly whenever any adjacent pair is inverted!
              </div>
            ) : (
              <div className="bg-rose-500/20 border border-rose-400/40 rounded-xl p-3 text-xs text-rose-200">
                <strong>Not quite.</strong> Notice that Selection Sort scans silently and only executes <em>one</em> swap at the very end of each pass.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. Array Presets & Custom Input */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Educational Presets:</span>
          {SORTING_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                selectedPresetId === preset.id
                  ? 'bg-[#113A35] text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleApplyCustom} className="flex items-center gap-2 text-xs">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="e.g. 5, 2, 4, 1, 3"
            className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono outline-none focus:border-teal-600 w-36"
          />
          <button
            type="submit"
            className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-xl font-semibold transition-colors"
          >
            Load
          </button>
        </form>
      </div>
    </div>
  );
};
