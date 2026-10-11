'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  ArrowUpDown,
  Trophy,
  Sparkles,
  Info,
  CheckCircle2,
  HelpCircle,
  Clock,
  Layers
} from 'lucide-react';
import { PenguinArray } from './PenguinArray';
import { PathPup, PathPupState } from './PathPup';
import {
  generateBubbleSortTrace,
  SortingTraceStep,
  SORTING_PRESETS
} from '../../lib/sortingAlgorithms';

interface BubbleSortGameProps {
  onBackToHub?: () => void;
  onCompareWithSelection?: (initialArr: number[]) => void;
}

type SubMode = 'play' | 'predict' | 'watch';

export const BubbleSortGame: React.FC<BubbleSortGameProps> = ({
  onBackToHub,
  onCompareWithSelection
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('standard');
  const [subMode, setSubMode] = useState<SubMode>('play');
  const [customInput, setCustomInput] = useState<string>('');

  // Initial array and trace
  const initialArray = useRef<number[]>([5, 2, 4, 1, 3]);
  const [trace, setTrace] = useState<SortingTraceStep[]>(() =>
    generateBubbleSortTrace(initialArray.current)
  );
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // Playback state (Mode C)
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(900);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  // PathPup Mascot State
  const [pupState, setPupState] = useState<PathPupState>('idle');
  const [pupMessage, setPupMessage] = useState<string>(
    "Welcome to Penguin Parade! In Bubble Sort, adjacent penguins compare heights and swap if the left is taller."
  );

  // Game Score & Stats
  const [score, setScore] = useState<number>(100);
  const [moves, setMoves] = useState<number>(0);
  const [mistakes, setMistakes] = useState<number>(0);

  // Mode B: Prediction state
  const [predictionFeedback, setPredictionFeedback] = useState<string | null>(null);

  const currentStep = trace[currentStepIndex] || trace[0];
  const isComplete = currentStepIndex >= trace.length - 1;

  // Initialize or reset game with an array
  const loadArray = useCallback((arr: number[]) => {
    initialArray.current = [...arr];
    const newTrace = generateBubbleSortTrace(arr);
    setTrace(newTrace);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setScore(100);
    setMoves(0);
    setMistakes(0);
    setPredictionFeedback(null);
    setPupState('idle');
    setPupMessage(
      `Penguins lined up! Ready for Pass 1. Compare adjacent neighbors and bubble the tallest penguin to the right.`
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
      setPupMessage("Please enter 3 to 8 numbers between 1 and 20 (e.g. 6, 2, 8, 3, 5).");
    }
  };

  // Step Forward
  const handleStepForward = useCallback(() => {
    if (currentStepIndex < trace.length - 1) {
      const nextIndex = currentStepIndex + 1;
      const nextStep = trace[nextIndex];
      setCurrentStepIndex(nextIndex);

      if (nextStep.type === 'swap') {
        setPupState('happy');
        setPupMessage("Nice swap! The taller penguin steps to the right.");
      } else if (nextStep.type === 'pass_complete') {
        setPupState('happy');
        setPupMessage(`Pass ${nextStep.pass} finished! The largest remaining penguin reached the end.`);
      } else if (nextStep.type === 'complete') {
        setPupState('celebrating');
        setPupMessage("FLIP-TASTIC! EVERY PENGUIN IS IN ORDER! The array is fully sorted!");
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
      setPupMessage("Stepped back one operation. Let's analyze the previous state.");
    }
  };

  // Mode C Auto-play Timer
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

  // Mode A: Interactive Decision Handling
  const handleInteractiveDecision = (userWantsSwap: boolean) => {
    if (isComplete) return;

    // Check if next step in trace is a swap
    const nextStep = trace[currentStepIndex + 1];
    if (!nextStep) return;

    setMoves((m) => m + 1);

    const actualNeedsSwap = nextStep.type === 'swap';

    if (userWantsSwap === actualNeedsSwap) {
      // Correct decision!
      setScore((s) => s + 10);
      setPupState('happy');
      setPupMessage(
        actualNeedsSwap
          ? "Spot on! The left penguin is taller, so they swap places!"
          : "Exactly right! They are already in ascending order, so no swap needed."
      );
      handleStepForward();
    } else {
      // Mistake
      setMistakes((m) => m + 1);
      setScore((s) => Math.max(0, s - 5));
      setPupState('sad');
      setPupMessage(
        actualNeedsSwap
          ? "Oops! The left penguin is taller than the right. They must swap to bubble up!"
          : "Hold on! The left penguin is already shorter or equal. A swap would reverse their correct order!"
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Title & Badge */}
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-serif font-bold text-xl text-[#0F2E2E] flex items-center gap-2">
              <span>🐧</span>
              <span>Bubble Sort: Penguin Parade</span>
            </h3>
            <span className="bg-emerald-100 text-emerald-900 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-emerald-300">
              Interactive Sort
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare adjacent neighbors. Swap when out of order. Bubble the largest penguin to the end!
          </p>
        </div>

        {/* Sub-Mode Selector */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => {
              setSubMode('play');
              setIsPlaying(false);
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              subMode === 'play'
                ? 'bg-white text-[#113A35] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mode A: Play the Sort
          </button>
          <button
            onClick={() => {
              setSubMode('predict');
              setIsPlaying(false);
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              subMode === 'predict'
                ? 'bg-white text-[#113A35] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mode B: Predict Move
          </button>
          <button
            onClick={() => setSubMode('watch')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              subMode === 'watch'
                ? 'bg-white text-[#113A35] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mode C: Watch & Learn
          </button>
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
        {/* Subtle Arctic Snowy Texture */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#64D8B8_1px,transparent_1px)] [background-size:16px_16px]" />

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
            sortedIndices={currentStep.sortedIndices}
          />
        </div>

        {/* Educational Operation Explanation Banner */}
        <div className="relative z-10 flex items-center justify-between text-xs bg-teal-950/60 border border-teal-500/30 rounded-xl px-4 py-2.5 text-teal-100">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="font-medium">{currentStep.description}</span>
          </div>
          <span className="text-[11px] font-mono text-teal-300/70 shrink-0">
            Step {currentStepIndex + 1} of {trace.length}
          </span>
        </div>

        {/* 3. Interactive Gameplay Controls */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800">
          {/* SubMode A: Play the Sort Buttons */}
          {subMode === 'play' && !isComplete && (
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-300 mr-1">Your Decision:</span>
              <button
                onClick={() => handleInteractiveDecision(true)}
                className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all hover:scale-105 cursor-pointer"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Swap Penguins</span>
              </button>

              <button
                onClick={() => handleInteractiveDecision(false)}
                className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all hover:scale-105 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Keep Order (No Swap)</span>
              </button>

              <button
                onClick={() => handleStepForward()}
                className="inline-flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>Auto-Step</span>
              </button>
            </div>
          )}

          {/* SubMode B: Predict Move */}
          {subMode === 'predict' && !isComplete && (
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-semibold text-amber-300">
                Predict: Do the compared penguins need a swap?
              </span>
              <button
                onClick={() => {
                  const next = trace[currentStepIndex + 1];
                  if (next?.type === 'swap') {
                    setPredictionFeedback('✅ Correct! Since left > right, they must swap.');
                    setScore((s) => s + 15);
                    setPupState('happy');
                  } else {
                    setPredictionFeedback('❌ Incorrect. Left <= right, so they stay in order.');
                    setMistakes((m) => m + 1);
                    setPupState('sad');
                  }
                }}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs"
              >
                Yes, Must Swap
              </button>
              <button
                onClick={() => {
                  const next = trace[currentStepIndex + 1];
                  if (next?.type !== 'swap') {
                    setPredictionFeedback('✅ Correct! Already in relative order.');
                    setScore((s) => s + 15);
                    setPupState('happy');
                  } else {
                    setPredictionFeedback('❌ Incorrect. Left is taller, so swap is needed.');
                    setMistakes((m) => m + 1);
                    setPupState('sad');
                  }
                }}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-3 py-1.5 rounded-lg text-xs"
              >
                No, Keep Order
              </button>
              {predictionFeedback && (
                <span className="text-xs font-medium text-emerald-300">{predictionFeedback}</span>
              )}
            </div>
          )}

          {/* SubMode C: Watch and Learn Controls */}
          {subMode === 'watch' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="inline-flex items-center gap-1.5 bg-[#64D8B8] hover:bg-[#52cba9] text-[#0A2328] px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlaying ? 'Pause' : 'Play Animation'}</span>
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
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
                title="Step Forward"
              >
                <SkipForward className="w-4 h-4" />
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
          )}

          {/* Reset & Reset to Preset */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadArray(initialArray.current)}
              className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            {isComplete && onCompareWithSelection && (
              <button
                onClick={() => onCompareWithSelection(initialArray.current)}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all hover:scale-105 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Compare with Selection Sort ➔</span>
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
            placeholder="e.g. 7, 2, 9, 1, 4"
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
            <div>Best: <strong className="text-emerald-700">O(n)</strong> (with early exit)</div>
            <div>Average: <strong>O(n²)</strong></div>
            <div>Worst: <strong>O(n²)</strong> (reversed array)</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-1.5">
          <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Stability & Space
          </h5>
          <div className="text-[11px] text-slate-600 space-y-1">
            <div>Space: <strong className="font-mono">O(1)</strong> (In-place)</div>
            <div>Stable: <strong className="text-emerald-700">Yes</strong> (Preserves equal items)</div>
            <div>Swaps: <strong>O(n²)</strong> in worst case</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-1.5">
          <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            Key Invariant
          </h5>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            After pass <em>k</em>, the <em>k</em> largest penguins are guaranteed to be in their final sorted positions at the right of the array.
          </p>
        </div>
      </div>
    </div>
  );
};
