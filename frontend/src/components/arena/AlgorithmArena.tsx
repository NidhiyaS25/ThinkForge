'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Trophy,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Layers,
  MousePointerClick,
  ChevronUp,
  ChevronDown,
  Award,
  ArrowRight,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { GraphCanvas } from './GraphCanvas';
import { DistanceTable } from './DistanceTable';
import {
  GRAPH_CHALLENGES,
  GraphChallenge,
  runFullDijkstra,
  DIJKSTRA_ALGORITHM_STEPS,
  EDGE_SELECTION_PUZZLES,
  AlgorithmStepItem,
  EdgeChallengePuzzle
} from '../../lib/graphAlgorithms';

interface AlgorithmArenaProps {
  onBack: () => void;
}

type GameMode = 'dijkstra_path' | 'build_algorithm' | 'edge_selection';
type Difficulty = 'easy' | 'medium' | 'hard';

export const AlgorithmArena: React.FC<AlgorithmArenaProps> = ({ onBack }) => {
  // Mode & Difficulty
  const [gameMode, setGameMode] = useState<GameMode>('dijkstra_path');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');

  // Active Challenge Data
  const challenge = GRAPH_CHALLENGES[difficulty];
  const fullDijkstra = useRef(runFullDijkstra(challenge));

  // Game Metrics & HUD
  const [score, setScore] = useState<number>(100);
  const [moves, setMoves] = useState<number>(0);
  const [mistakes, setMistakes] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [highScore, setHighScore] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Mode A: Dijkstra Live Game State
  const [distances, setDistances] = useState<Record<string, number>>({});
  const [previous, setPrevious] = useState<Record<string, string | null>>({});
  const [visitedNodeIds, setVisitedNodeIds] = useState<Set<string>>(new Set());
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [candidateNodeIds, setCandidateNodeIds] = useState<Set<string>>(new Set());
  const [relaxedEdgeIds, setRelaxedEdgeIds] = useState<Set<string>>(new Set());
  const [pathEdgeIds, setPathEdgeIds] = useState<Set<string>>(new Set());
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [reconstructedPath, setReconstructedPath] = useState<string[]>([]);
  const [submittingPathMode, setSubmittingPathMode] = useState<boolean>(false);

  // Alerts & Educational Guidance
  const [guidanceMessage, setGuidanceMessage] = useState<{
    type: 'info' | 'success' | 'warning' | 'error';
    text: string;
  }>({
    type: 'info',
    text: `Challenge started! Select the source node (${challenge.source}) to initialize Dijkstra's traversal.`
  });

  // Mode B: Build the Algorithm State
  const [shuffledSteps, setShuffledSteps] = useState<AlgorithmStepItem[]>([]);
  const [modeBSubmitted, setModeBSubmitted] = useState<boolean>(false);
  const [modeBScore, setModeBScore] = useState<{ correct: number; total: number } | null>(null);

  // Mode C: Edge Selection Puzzle State
  const [puzzleIndex, setPuzzleIndex] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [puzzleSubmitted, setPuzzleSubmitted] = useState<boolean>(false);

  // Initialize or reset challenge
  const resetGame = useCallback(() => {
    fullDijkstra.current = runFullDijkstra(GRAPH_CHALLENGES[difficulty]);
    const initDist: Record<string, number> = {};
    const initPrev: Record<string, string | null> = {};

    GRAPH_CHALLENGES[difficulty].nodes.forEach((n) => {
      initDist[n.id] = n.id === GRAPH_CHALLENGES[difficulty].source ? 0 : Infinity;
      initPrev[n.id] = null;
    });

    setDistances(initDist);
    setPrevious(initPrev);
    setVisitedNodeIds(new Set());
    setCurrentNodeId(null);
    setCandidateNodeIds(new Set([GRAPH_CHALLENGES[difficulty].source]));
    setRelaxedEdgeIds(new Set());
    setPathEdgeIds(new Set());
    setSelectedEdgeId(null);
    setReconstructedPath([]);
    setSubmittingPathMode(false);
    setIsCompleted(false);
    setMoves(0);
    setMistakes(0);
    setHintsUsed(0);
    setTimerSeconds(0);
    setIsTimerRunning(true);
    setScore(100);

    setGuidanceMessage({
      type: 'info',
      text: `Select the unvisited node with the minimum tentative distance: Node ${GRAPH_CHALLENGES[difficulty].source} (dist = 0).`
    });
  }, [difficulty]);

  // Load High Score from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`thinkforge_arena_highscore_${difficulty}`);
      if (saved) setHighScore(parseInt(saved, 10));
    } catch (e) {}
    resetGame();
  }, [difficulty, resetGame]);

  // Initialize Mode B steps shuffled
  useEffect(() => {
    const shuffled = [...DIJKSTRA_ALGORITHM_STEPS].sort(() => Math.random() - 0.5);
    setShuffledSteps(shuffled);
    setModeBSubmitted(false);
    setModeBScore(null);
  }, []);

  // Timer Tick
  useEffect(() => {
    if (!isTimerRunning || isCompleted) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, isCompleted]);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  // -------------------------------------------------------------
  // MODE A: DIJKSTRA PLAYABLE LOGIC & VALIDATION
  // -------------------------------------------------------------

  const handleNodeClick = (clickedNodeId: string) => {
    if (isCompleted) return;

    setMoves((m) => m + 1);

    // If we are in path reconstruction mode
    if (submittingPathMode) {
      if (reconstructedPath.includes(clickedNodeId)) {
        setGuidanceMessage({
          type: 'warning',
          text: `Node ${clickedNodeId} is already in your path sequence.`
        });
        return;
      }

      const newPath = [...reconstructedPath, clickedNodeId];
      setReconstructedPath(newPath);

      // Highlight path edges
      if (newPath.length >= 2) {
        const u = newPath[newPath.length - 2];
        const v = newPath[newPath.length - 1];
        const edge = challenge.edges.find((e) => (e.u === u && e.v === v) || (e.u === v && e.v === u));
        if (edge) {
          setPathEdgeIds((prev) => new Set([...prev, edge.id]));
        }
      }

      setGuidanceMessage({
        type: 'info',
        text: `Path so far: ${newPath.join(' → ')}. Continue to Target (${challenge.destination}) or click Submit Shortest Path.`
      });
      return;
    }

    // Standard Dijkstra Selection Phase:
    // 1. If no active current node: verify if clickedNodeId is indeed the unvisited node with minimum tentative distance!
    if (!currentNodeId) {
      // Find valid minimum unvisited node
      let minVal = Infinity;
      let validCandidate = '';

      challenge.nodes.forEach((n) => {
        if (!visitedNodeIds.has(n.id) && distances[n.id] < minVal) {
          minVal = distances[n.id];
          validCandidate = n.id;
        }
      });

      if (clickedNodeId !== validCandidate) {
        setMistakes((mis) => mis + 1);
        setScore((s) => Math.max(0, s - 2));
        setGuidanceMessage({
          type: 'error',
          text: `Invalid selection! By Dijkstra's greedy invariant, you must pick the unvisited node with the smallest tentative distance (Node ${validCandidate} with dist = ${minVal}).`
        });
        return;
      }

      // Valid node selected!
      setCurrentNodeId(clickedNodeId);
      setScore((s) => s + 10);

      // Find unvisited neighbors
      const neighbors = challenge.edges
        .filter(
          (e) =>
            (e.u === clickedNodeId && !visitedNodeIds.has(e.v)) ||
            (e.v === clickedNodeId && !visitedNodeIds.has(e.u))
        )
        .map((e) => (e.u === clickedNodeId ? e.v : e.u));

      setCandidateNodeIds(new Set(neighbors));

      setGuidanceMessage({
        type: 'success',
        text: `Correct! Node ${clickedNodeId} (dist = ${distances[clickedNodeId]}) is active. Now click an edge connected to its unvisited neighbors to relax it, or finalize the node.`
      });
      return;
    }

    // 2. If a node is already active, clicking another node checks if it's an unvisited neighbor to relax
    if (currentNodeId && clickedNodeId !== currentNodeId) {
      if (visitedNodeIds.has(clickedNodeId)) {
        setGuidanceMessage({
          type: 'warning',
          text: `Node ${clickedNodeId} is already finalized! Finalized nodes cannot be relaxed.`
        });
        return;
      }

      // Check if edge exists between currentNodeId and clickedNodeId
      const edge = challenge.edges.find(
        (e) =>
          (e.u === currentNodeId && e.v === clickedNodeId) ||
          (e.v === currentNodeId && e.u === clickedNodeId)
      );

      if (!edge) {
        setGuidanceMessage({
          type: 'warning',
          text: `No direct edge connects Node ${currentNodeId} to Node ${clickedNodeId}.`
        });
        return;
      }

      // Relax this edge
      handleEdgeClick(edge.id);
    }
  };

  const handleEdgeClick = (edgeId: string) => {
    if (isCompleted || submittingPathMode) return;

    if (!currentNodeId) {
      setGuidanceMessage({
        type: 'warning',
        text: 'Select an unvisited node with minimum tentative distance first before relaxing edges.'
      });
      return;
    }

    const edge = challenge.edges.find((e) => e.id === edgeId);
    if (!edge) return;

    if (edge.u !== currentNodeId && edge.v !== currentNodeId) {
      setGuidanceMessage({
        type: 'warning',
        text: `Edge ${edge.id} does not connect to active Node ${currentNodeId}.`
      });
      return;
    }

    const neighborId = edge.u === currentNodeId ? edge.v : edge.u;
    if (visitedNodeIds.has(neighborId)) {
      setGuidanceMessage({
        type: 'warning',
        text: `Neighbor Node ${neighborId} is already finalized!`
      });
      return;
    }

    setMoves((m) => m + 1);
    setSelectedEdgeId(edgeId);

    const tentativeDist = distances[currentNodeId] + edge.weight;
    const currentDist = distances[neighborId];

    if (tentativeDist < currentDist) {
      // Improved!
      setDistances((prev) => ({ ...prev, [neighborId]: tentativeDist }));
      setPrevious((prev) => ({ ...prev, [neighborId]: currentNodeId }));
      setRelaxedEdgeIds((prev) => new Set([...prev, edgeId]));
      setScore((s) => s + 10);

      setGuidanceMessage({
        type: 'success',
        text: `Edge Relaxed! Distance to Node ${neighborId} updated from ${
          currentDist === Infinity ? '∞' : currentDist
        } down to ${tentativeDist} via Node ${currentNodeId}!`
      });
    } else {
      setGuidanceMessage({
        type: 'info',
        text: `Edge examined: dist(${currentNodeId}) + ${edge.weight} = ${tentativeDist} is not smaller than existing tentative distance ${currentDist}. Distance unchanged.`
      });
    }
  };

  // Finalize current node and move to next
  const handleFinalizeCurrentNode = () => {
    if (!currentNodeId) return;

    const finalizedId = currentNodeId;
    const newVisited = new Set([...visitedNodeIds, finalizedId]);
    setVisitedNodeIds(newVisited);
    setCurrentNodeId(null);
    setCandidateNodeIds(new Set());
    setSelectedEdgeId(null);
    setScore((s) => s + 5);

    // Check if Destination node has been reached/finalized
    if (finalizedId === challenge.destination || newVisited.size === challenge.nodes.length) {
      setSubmittingPathMode(true);
      setReconstructedPath([challenge.source]);
      setGuidanceMessage({
        type: 'success',
        text: `Target Node ${challenge.destination} finalized! Now reconstruct the shortest path: click nodes in sequence starting from ${challenge.source} to ${challenge.destination}, then click Submit Shortest Path.`
      });
    } else {
      // Find next candidate
      let nextMin = Infinity;
      let nextId = '';
      challenge.nodes.forEach((n) => {
        if (!newVisited.has(n.id) && distances[n.id] < nextMin) {
          nextMin = distances[n.id];
          nextId = n.id;
        }
      });

      setGuidanceMessage({
        type: 'info',
        text: `Node ${finalizedId} marked finalized. Next, select the unvisited node with minimum tentative distance (${nextId || 'none'} with dist = ${nextMin}).`
      });
    }
  };

  // Submit Shortest Path
  const handleSubmitPath = () => {
    const optimal = fullDijkstra.current.optimalPath;
    const isCorrect =
      reconstructedPath.length === optimal.length &&
      reconstructedPath.every((val, index) => val === optimal[index]);

    if (isCorrect) {
      // Calculate efficiency bonus
      const efficiencyBonus = Math.max(0, 20 - mistakes * 4);
      const finalScore = score + 30 + efficiencyBonus;

      setScore(finalScore);
      setIsCompleted(true);
      setIsTimerRunning(false);

      if (finalScore > highScore) {
        setHighScore(finalScore);
        try {
          localStorage.setItem(`thinkforge_arena_highscore_${difficulty}`, finalScore.toString());
        } catch (e) {}
      }

      setGuidanceMessage({
        type: 'success',
        text: `Victory! You successfully reconstructed the optimal shortest path: ${optimal.join(' → ')} with total weight ${fullDijkstra.current.optimalDistance}!`
      });
    } else {
      setMistakes((m) => m + 1);
      setScore((s) => Math.max(0, s - 5));
      setGuidanceMessage({
        type: 'error',
        text: `Incorrect path! Expected optimal path: ${optimal.join(' → ')}. You submitted: ${reconstructedPath.join(' → ')}. Click Reset to try again.`
      });
    }
  };

  // Request Hint
  const handleRequestHint = () => {
    setHintsUsed((h) => h + 1);
    setScore((s) => Math.max(0, s - 5));

    if (!currentNodeId) {
      // Hint for next node
      let minVal = Infinity;
      let candidate = '';
      challenge.nodes.forEach((n) => {
        if (!visitedNodeIds.has(n.id) && distances[n.id] < minVal) {
          minVal = distances[n.id];
          candidate = n.id;
        }
      });
      setGuidanceMessage({
        type: 'info',
        text: `Hint (-5 pts): The greedy choice requires selecting Node ${candidate} because its tentative distance (${minVal}) is the smallest among all unvisited nodes.`
      });
    } else {
      setGuidanceMessage({
        type: 'info',
        text: `Hint (-5 pts): Examine all unvisited neighbors connected to Node ${currentNodeId}. If currentNode.dist + edge.weight < neighbor.dist, the edge must be relaxed.`
      });
    }
  };

  // -------------------------------------------------------------
  // MODE B: BUILD THE ALGORITHM ACTIONS
  // -------------------------------------------------------------

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...shuffledSteps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSteps.length) return;

    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIndex];
    newSteps[targetIndex] = temp;
    setShuffledSteps(newSteps);
    setModeBSubmitted(false);
  };

  const verifyModeBSequence = () => {
    let correctCount = 0;
    shuffledSteps.forEach((step, idx) => {
      if (step.correctIndex === idx) correctCount++;
    });

    setModeBScore({ correct: correctCount, total: shuffledSteps.length });
    setModeBSubmitted(true);

    if (correctCount === shuffledSteps.length) {
      setScore((s) => s + 50);
      setGuidanceMessage({
        type: 'success',
        text: 'Mastery Achieved! All 7 algorithm execution steps are in the exact chronological sequence!'
      });
    } else {
      setScore((s) => Math.max(0, s - 5));
      setGuidanceMessage({
        type: 'warning',
        text: `${correctCount} of ${shuffledSteps.length} steps in correct order. Review the highlighted steps below.`
      });
    }
  };

  // -------------------------------------------------------------
  // MODE C: EDGE SELECTION PUZZLE ACTIONS
  // -------------------------------------------------------------

  const handleSelectPuzzleOption = (optionId: string) => {
    if (puzzleSubmitted) return;
    setSelectedOptionId(optionId);
  };

  const handleVerifyPuzzle = () => {
    if (!selectedOptionId) return;
    const currentPuz = EDGE_SELECTION_PUZZLES[puzzleIndex];
    const chosen = currentPuz.options.find((o) => o.id === selectedOptionId);
    setPuzzleSubmitted(true);

    if (chosen?.isCorrect) {
      setScore((s) => s + 25);
      setGuidanceMessage({
        type: 'success',
        text: `Correct! ${chosen.explanation}`
      });
    } else {
      setScore((s) => Math.max(0, s - 5));
      setGuidanceMessage({
        type: 'error',
        text: `Incorrect. ${chosen?.explanation || 'Try reviewing Dijkstra edge relaxation rules.'}`
      });
    }
  };

  const handleNextPuzzle = () => {
    setSelectedOptionId(null);
    setPuzzleSubmitted(false);
    setPuzzleIndex((prev) => (prev + 1) % EDGE_SELECTION_PUZZLES.length);
    setGuidanceMessage({
      type: 'info',
      text: 'Analyze the graph and choose the edge that satisfies the algorithmic invariant.'
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-slate-900 flex flex-col font-sans">
      {/* 1. TOP HEADER & HUD */}
      <header className="sticky top-0 z-40 bg-[#FAF9F5]/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Back & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs shadow-xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Learning</span>
            </button>

            <div className="border-l border-slate-200 pl-3">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg text-[#0F2E2E] tracking-tight flex items-center gap-1.5">
                  <Compass className="w-5 h-5 text-[#1F5F50]" />
                  Algorithm Arena
                </span>
                <span className="bg-[#113A35] text-white text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full">
                  Interactive Lab
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Think Strategically. Solve Algorithmically.
              </p>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex items-center bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => {
                setGameMode('dijkstra_path');
                resetGame();
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                gameMode === 'dijkstra_path'
                  ? 'bg-white text-[#113A35] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mode A: Path Challenge
            </button>
            <button
              onClick={() => setGameMode('build_algorithm')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                gameMode === 'build_algorithm'
                  ? 'bg-white text-[#113A35] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mode B: Build Algorithm
            </button>
            <button
              onClick={() => setGameMode('edge_selection')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                gameMode === 'edge_selection'
                  ? 'bg-white text-[#113A35] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mode C: Edge Puzzles
            </button>
          </div>

          {/* Live Score & Pacing Badges */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold text-emerald-900">
              <Trophy className="w-3.5 h-3.5 text-emerald-600" />
              <span>Score: {score}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-mono text-slate-700 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatTime(timerSeconds)}</span>
            </div>

            {highScore > 0 && (
              <div className="hidden lg:flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1.5 rounded-xl font-semibold text-[11px]">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>Best: {highScore}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. SUB-BAR: DIFFICULTY & CONTROLS */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Difficulty Selector */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
              Difficulty:
            </span>
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficulty(diff)}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                  difficulty === diff
                    ? 'bg-[#113A35] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </button>
            ))}
          </div>

          {/* Game Controls Toolbar */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRequestHint}
              disabled={isCompleted || gameMode !== 'dijkstra_path'}
              className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl font-medium transition-colors disabled:opacity-40 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Hint (-5)</span>
            </button>

            <button
              onClick={resetGame}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Challenge</span>
            </button>

            {currentNodeId && !submittingPathMode && (
              <button
                onClick={handleFinalizeCurrentNode}
                className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white px-3.5 py-1.5 rounded-xl font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Finalize Node {currentNodeId}</span>
              </button>
            )}

            {submittingPathMode && !isCompleted && (
              <button
                onClick={handleSubmitPath}
                className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-1.5 rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Submit Shortest Path (+30)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. MAIN INTERACTIVE CONTENT */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
        {/* Real-time Guidance Banner */}
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 shadow-xs transition-all ${
            guidanceMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : guidanceMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : guidanceMessage.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-teal-50 border-teal-200 text-teal-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {guidanceMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : guidanceMessage.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-teal-700 shrink-0" />
            )}
            <span className="font-medium leading-relaxed">{guidanceMessage.text}</span>
          </div>

          <div className="text-[11px] font-mono text-slate-500 shrink-0 hidden sm:block">
            Moves: {moves} • Mistakes: {mistakes} • Hints: {hintsUsed}
          </div>
        </div>

        {/* ========================================================= */}
        {/* MODE A: DIJKSTRA'S PATH CHALLENGE */}
        {/* ========================================================= */}
        {gameMode === 'dijkstra_path' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols: Interactive Graph SVG Canvas */}
            <div className="lg:col-span-8 flex flex-col space-y-3">
              <GraphCanvas
                nodes={challenge.nodes}
                edges={challenge.edges}
                sourceNodeId={challenge.source}
                destNodeId={challenge.destination}
                currentNodeId={currentNodeId}
                visitedNodeIds={visitedNodeIds}
                candidateNodeIds={candidateNodeIds}
                pathEdgeIds={pathEdgeIds}
                relaxedEdgeIds={relaxedEdgeIds}
                selectedEdgeId={selectedEdgeId}
                distances={distances}
                onNodeClick={handleNodeClick}
                onEdgeClick={handleEdgeClick}
                interactive={!isCompleted}
              />

              {/* Status Bar */}
              <div className="bg-white rounded-xl border border-slate-200/80 p-3 flex flex-wrap items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Source:</span>
                  <span className="bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded">
                    {challenge.source} (dist: 0)
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-700">Target:</span>
                  <span className="bg-rose-100 text-rose-900 font-bold px-2 py-0.5 rounded">
                    {challenge.destination} (target)
                  </span>
                </div>

                {submittingPathMode && (
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <span>Constructing Path:</span>
                    <span className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono">
                      {reconstructedPath.join(' → ') || 'Click nodes'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right 4 Cols: Live Distance Table & Algorithm Step Tracker */}
            <div className="lg:col-span-4 flex flex-col space-y-4">
              <div className="h-[360px]">
                <DistanceTable
                  nodes={challenge.nodes}
                  distances={distances}
                  previous={previous}
                  visitedNodeIds={visitedNodeIds}
                  currentNodeId={currentNodeId}
                  candidateNodeIds={candidateNodeIds}
                />
              </div>

              {/* Algorithm Quick Rule Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm text-xs space-y-2">
                <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#1F5F50]" />
                  Dijkstra Invariant Rules:
                </h5>
                <ul className="text-slate-600 space-y-1 list-disc pl-4 text-[11px] leading-relaxed">
                  <li>
                    Always select the <strong>unvisited node with smallest distance</strong>.
                  </li>
                  <li>
                    Relax edges: if <code>dist(u) + weight &lt; dist(v)</code>, update <code>v</code>.
                  </li>
                  <li>
                    Once a node is marked <strong>finalized</strong>, its distance is mathematically guaranteed to be minimal.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE B: BUILD THE ALGORITHM (SEQUENCING CHALLENGE) */}
        {/* ========================================================= */}
        {gameMode === 'build_algorithm' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2E7A68]">
                Mode B: Sequencing Challenge
              </span>
              <h3 className="text-2xl font-serif font-bold text-[#0F2E2E] mt-1">
                Assemble Dijkstra's Algorithm in Order
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Arrange the shuffled operational steps into the exact algorithmic order using the Up and Down buttons.
              </p>
            </div>

            <div className="space-y-3">
              {shuffledSteps.map((step, index) => {
                const isCorrectPlacement = modeBSubmitted && step.correctIndex === index;
                const isWrongPlacement = modeBSubmitted && step.correctIndex !== index;

                return (
                  <div
                    key={step.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      isCorrectPlacement
                        ? 'border-emerald-300 bg-emerald-50/60'
                        : isWrongPlacement
                        ? 'border-rose-300 bg-rose-50/50'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-slate-800 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 leading-snug">{step.text}</p>
                        {modeBSubmitted && (
                          <p
                            className={`text-[11px] mt-1 ${
                              isCorrectPlacement ? 'text-emerald-800' : 'text-rose-800'
                            }`}
                          >
                            {isCorrectPlacement
                              ? '✓ Correct step position'
                              : `Incorrect: Belongs at Step ${step.correctIndex + 1}. (${step.explanation})`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Up / Down Reorder Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => moveStep(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-30 transition-colors"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveStep(index, 'down')}
                        disabled={index === shuffledSteps.length - 1}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-30 transition-colors"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {modeBScore && (
                <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-emerald-600" />
                  <span>
                    Score: {modeBScore.correct} / {modeBScore.total} Steps Correct
                  </span>
                </div>
              )}
              <button
                onClick={verifyModeBSequence}
                className="bg-[#113A35] hover:bg-[#0c2a26] text-white px-6 py-2.5 rounded-xl font-medium text-xs shadow-xs transition-colors cursor-pointer"
              >
                Verify Algorithm Sequence
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE C: EDGE SELECTION PUZZLE */}
        {/* ========================================================= */}
        {gameMode === 'edge_selection' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2E7A68]">
                Mode C: Decision-Making Puzzle {puzzleIndex + 1} of {EDGE_SELECTION_PUZZLES.length}
              </span>
              <h3 className="text-2xl font-serif font-bold text-[#0F2E2E] mt-1">
                {EDGE_SELECTION_PUZZLES[puzzleIndex].title}
              </h3>
              <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                {EDGE_SELECTION_PUZZLES[puzzleIndex].question}
              </p>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {EDGE_SELECTION_PUZZLES[puzzleIndex].options.map((option) => {
                const isSelected = selectedOptionId === option.id;
                const isCorrect = puzzleSubmitted && option.isCorrect;
                const isWrong = puzzleSubmitted && isSelected && !option.isCorrect;

                return (
                  <div
                    key={option.id}
                    onClick={() => handleSelectPuzzleOption(option.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isCorrect
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-950 font-semibold'
                        : isWrong
                        ? 'border-rose-400 bg-rose-50 text-rose-950'
                        : isSelected
                        ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-600/30'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">{option.label}</span>
                      {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {isWrong && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                    </div>
                    {puzzleSubmitted && (
                      <p className="text-[11px] text-slate-600 mt-2 font-normal leading-relaxed">
                        {option.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                Correct answer awards +25 points to your total score.
              </span>

              <div className="flex items-center gap-2">
                {!puzzleSubmitted ? (
                  <button
                    onClick={handleVerifyPuzzle}
                    disabled={!selectedOptionId}
                    className="bg-[#113A35] hover:bg-[#0c2a26] text-white px-6 py-2.5 rounded-xl font-medium text-xs disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    Submit Decision
                  </button>
                ) : (
                  <button
                    onClick={handleNextPuzzle}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    Next Puzzle →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. SUCCESS COMPLETION MODAL */}
      {isCompleted && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 sm:p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 border-2 border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2E7A68]">
                Algorithm Arena Mastered
              </span>
              <h3 className="text-2xl font-serif font-bold text-[#0F2E2E] mt-1">
                Optimal Shortest Path Found!
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                You successfully applied Dijkstra's greedy selection and relaxation invariants to reach Target Node {challenge.destination}.
              </p>
            </div>

            {/* Score Breakdown Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs space-y-2 text-left">
              <div className="flex justify-between pb-1 border-b border-slate-200/60">
                <span className="text-slate-600">Final Score:</span>
                <span className="font-bold font-mono text-emerald-700 text-sm">{score} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Completion Time:</span>
                <span className="font-mono text-slate-800">{formatTime(timerSeconds)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Moves:</span>
                <span className="font-mono text-slate-800">{moves}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Mistakes Avoided:</span>
                <span className="font-mono text-slate-800">{mistakes}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200/60 font-semibold text-slate-900">
                <span>Optimal Distance:</span>
                <span className="font-mono text-emerald-800">
                  {fullDijkstra.current.optimalDistance} units
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={resetGame}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-medium text-xs transition-colors cursor-pointer"
              >
                Play Again
              </button>

              <button
                onClick={() => {
                  const nextDiff: Difficulty =
                    difficulty === 'easy' ? 'medium' : difficulty === 'medium' ? 'hard' : 'easy';
                  setDifficulty(nextDiff);
                }}
                className="flex-1 bg-[#113A35] hover:bg-[#0c2a26] text-white py-3 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Next Difficulty →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
