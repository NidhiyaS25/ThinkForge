'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Crown,
  Trophy,
  Info,
  CheckCircle2,
  HelpCircle,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { PenguinArray } from './PenguinArray';
import { PathPup, PathPupState } from './PathPup';
import {
  generateSelectionSortTrace,
  SortingTraceStep,
  SORTING_PRESETS
} from '../../lib/sortingAlgorithms';

interface SelectionSortGameProps {
  onBackToHub?: () => void;
  onCompareWithBubble?: (initialArr: number[]) => void;
}

export const SelectionSortGame: React.FC<SelectionSortGameProps> = ({
  onBackToHub,
  onCompareWithBubble
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('standard');
  const [customInput, setCustomInput] = useState<string>('');

  // Initial array and trace
  const initialArray = useRef<number[]>([5, 2, 4, 1, 3]);
  const [trace, setTrace] = useState<SortingTraceStep[]>(() =>
    generateSelectionSortTrace(initialArray.current)
  );
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(900);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  // PathPup Mascot State
  const [pupState, setPupState] = useState<PathPupState>('idle');
  const [pupMessage, setPupMessage] = useState<string>(
    "Welcome to Penguin Champion! In Selection Sort, we search the unsorted group for the shortest penguin and place it in front."
  );

  // Game Score & Stats
  const [score, setScore] = useState<number>(100);
  const [moves, setMoves] = useState<number>(0);

  const currentStep = trace[currentStepIndex] || trace[0];
  const isComplete = currentStepIndex >= trace.length - 1;

  // Initialize or reset game with an array
  const loadArray = useCallback((arr: number[]) => {
    initialArray.current = [...arr];
    const newTrace = generateSelectionSortTrace(arr);
    setTrace(newTrace);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setScore(100);
    setMoves(0);
    setPupState('idle');
    setPupMessage(
      `Penguins lined up! Ready for Pass 1. Find the shortest remaining penguin and move it to the champion position.`
    );
  }, []);

  // Preset Selection
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const found = SORTING_PRESETS.find((p) => p.id === presetId);
    if (found) loadArray(found.array);
  };

  // Custom Array Submission
  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = customInput
      .split(/[\s,]+/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 1 && n <= 20);

    if (parsed.length >= 3 && parsed.length <= 8) {
      loadArray(parsed);
      setCustomInput('');
    } else {
      setPupState('sad');
      setPupMessage("Please enter 3 to 8 numbers between 1 and 20 (e.g. 5, 2, 4, 1, 3).");
    }
  };

  // Step Forward
  const handleStepForward = useCallback(() => {
    if (currentStepIndex < trace.length - 1) {
      const nextIndex = currentStepIndex + 1;
      const nextStep = trace[nextIndex];
      setCurrentStepIndex(nextIndex);
      setMoves((m) => m + 1);

      if (nextStep.type === 'min_update') {
        setPupState('thinking');
        setPupMessage(
          nextStep.description || "Found a candidate minimum penguin! Tracking its position."
        );
      } else if (nextStep.type === 'swap') {
        setPupState('happy');
        setPupMessage("Pass complete! Crowned the minimum penguin into the first unsorted position.");
        setScore((s) => s + 10);
      } else if (nextStep.type === 'no_swap') {
        setPupState('happy');
        setPupMessage("Pass complete! The minimum penguin was already in its rightful place. No swap needed!");
        setScore((s) => s + 10);
      } else if (nextStep.type === 'complete') {
        setPupState('celebrating');
        setPupMessage("CHAMPION FOUND! ALL PENGUINS ARE SORTED! Selection Sort successfully finished!");
        setScore((s) => s + 25);
      }
    } else {
      setIsPlaying(false);
    }
  }, [currentStepIndex, trace]);

  // Step Backward
  const handleStepBackward = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      setIsPlaying(false);
      setPupState('thinking');
      setPupMessage("Stepped backward. Reviewing candidate minimum inspection.");
    }
  };

  // Auto-play Timer
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setTimeout(() => {
        if (currentStepIndex < trace.length - 1) {
          handleStepForward();
        } else {
          setIsPlaying(false);
        }
      }, playbackSpeedMs);
    }
    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, [isPlaying, currentStepIndex, trace.length, playbackSpeedMs, handleStepForward]);

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Title & Badge */}
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-serif font-bold text-xl text-[#0F2E2E] flex items-center gap-2">
              <span>👑</span>
              <span>Selection Sort: Penguin Champion</span>
            </h3>
            <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-amber-300">
              Minimum Scanner
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Scan the unsorted portion, select the minimum remaining penguin, and crown them to the front!
          </p>
        </div>

        {/* Score & Counters */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-900 font-bold px-3 py-1.5 rounded-xl border border-emerald-200">
            <Trophy className="w-3.5 h-3.5 text-emerald-600" />
            <span>Score: {score}</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 text-slate-600 font-mono px-3 py-1.5 rounded-xl border border-slate-200 text-[11px]">
            <span>Pass: {currentStep.pass}</span>
            <span>•</span>
            <span>Cmps: {currentStep.comparisonsCount}</span>
            <span>•</span>
            <span>Swaps: {currentStep.swapsCount}</span>
          </div>
        </div>
      </div>

      {/* 2. Main Arena Card: Mascot + Penguin Array */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 text-white rounded-3xl border border-slate-700/80 p-4 sm:p-6 shadow-xl space-y-6 relative overflow-hidden">
        {/* Subtle Arctic Texture */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* PathPup Companion Banner */}
        <div className="relative z-10 bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/80 p-3 sm:p-4">
          <PathPup state={pupState} message={pupMessage} size="md" />
        </div>

        {/* Visual Penguin Stage */}
        <div className="relative z-10 bg-slate-950/60 rounded-2xl border border-slate-800/90 p-4">
          <PenguinArray
            array={currentStep.array}
            comparedIndices={currentStep.comparedIndices}
            swappedIndices={currentStep.swappedIndices}
            currentMinIndex={currentStep.currentMinIndex}
            sortedIndices={currentStep.sortedIndices}
          />
        </div>

        {/* Educational Operation Explanation Banner */}
        <div className="relative z-10 flex items-center justify-between text-xs bg-amber-950/50 border border-amber-500/30 rounded-xl px-4 py-2.5 text-amber-100">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-medium">{currentStep.description}</span>
          </div>
          <span className="text-[11px] font-mono text-amber-300/70 shrink-0">
            Step {currentStepIndex + 1} of {trace.length}
          </span>
        </div>

        {/* 3. Interactive Gameplay Controls */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Pause' : 'Play Automatically'}</span>
            </button>

            <button
              onClick={handleStepBackward}
              disabled={currentStepIndex === 0}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
              title="Step Backward"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={handleStepForward}
              disabled={isComplete}
              className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer disabled:opacity-40"
            >
              <SkipForward className="w-4 h-4" />
              <span>Next Operation ➔</span>
            </button>

            {/* Speed Buttons */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-[11px] font-mono text-slate-400 ml-2">
              <button
                onClick={() => setPlaybackSpeedMs(1200)}
                className={`px-2 py-0.5 rounded ${playbackSpeedMs === 1200 ? 'bg-slate-700 text-white' : ''}`}
              >
                0.5x
              </button>
              <button
                onClick={() => setPlaybackSpeedMs(800)}
                className={`px-2 py-0.5 rounded ${playbackSpeedMs === 800 ? 'bg-slate-700 text-white' : ''}`}
              >
                1x
              </button>
              <button
                onClick={() => setPlaybackSpeedMs(400)}
                className={`px-2 py-0.5 rounded ${playbackSpeedMs === 400 ? 'bg-slate-700 text-white' : ''}`}
              >
                2x
              </button>
            </div>
          </div>

          {/* Reset & Compare with Bubble */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadArray(initialArray.current)}
              className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            {isComplete && onCompareWithBubble && (
              <button
                onClick={() => onCompareWithBubble(initialArray.current)}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all hover:scale-105 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Compare with Bubble Sort ➔</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Array Presets & Custom Input Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Preset Selector */}
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

        {/* Custom Input Form */}
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

      {/* 5. Algorithm Theory & Complexity Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-1.5">
          <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            Time Complexity
          </h5>
          <div className="text-[11px] text-slate-600 space-y-1 font-mono">
            <div>Best: <strong>O(n²)</strong> (Always scans unsorted subarray)</div>
            <div>Average: <strong>O(n²)</strong></div>
            <div>Worst: <strong>O(n²)</strong></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-1.5">
          <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
            Stability & Swaps
          </h5>
          <div className="text-[11px] text-slate-600 space-y-1">
            <div>Space: <strong className="font-mono">O(1)</strong> (In-place)</div>
            <div>Stable: <strong className="text-rose-700">No</strong> (Long-range swaps break tie order)</div>
            <div>Swaps: <strong className="text-emerald-700 font-mono">O(n)</strong> (At most n - 1 swaps!)</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-1.5">
          <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            Key Invariant
          </h5>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            After pass <em>k</em>, the <em>k</em> smallest penguins are in their final positions at the left of the array. Exactly one placement swap occurs per pass.
          </p>
        </div>
      </div>
    </div>
  );
};
