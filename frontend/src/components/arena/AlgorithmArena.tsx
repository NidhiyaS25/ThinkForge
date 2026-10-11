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
  Compass,
  Scale,
  Sparkle,
  Home
} from 'lucide-react';
import { GraphCanvas } from './GraphCanvas';
import { DistanceTable } from './DistanceTable';
import { PathPup, PathPupState } from './PathPup';
import { BubbleSortGame } from './BubbleSortGame';
import { SelectionSortGame } from './SelectionSortGame';
import { SortingComparison } from './SortingComparison';
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

export type GameMode =
  | 'hub'
  | 'dijkstra_path'
  | 'bubble_sort'
  | 'selection_sort'
  | 'sorting_showdown'
  | 'build_algorithm'
  | 'edge_selection';

type Difficulty = 'easy' | 'medium' | 'hard';

const getInitialDistances = (diff: Difficulty): Record<string, number> => {
  const d: Record<string, number> = {};
  GRAPH_CHALLENGES[diff].nodes.forEach((n) => {
    d[n.id] = n.id === GRAPH_CHALLENGES[diff].source ? 0 : Infinity;
  });
  return d;
};

const getInitialPrevious = (diff: Difficulty): Record<string, string | null> => {
  const p: Record<string, string | null> = {};
  GRAPH_CHALLENGES[diff].nodes.forEach((n) => {
    p[n.id] = null;
  });
  return p;
};

export const AlgorithmArena: React.FC<AlgorithmArenaProps> = ({ onBack }) => {
  // Mode & Difficulty
  const [gameMode, setGameMode] = useState<GameMode>('hub');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');

  // Comparison Lab array override
  const [comparisonArrayOverride, setComparisonArrayOverride] = useState<number[] | undefined>(undefined);

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

  // PathPup Mascot State
  const [pupState, setPupState] = useState<PathPupState>('idle');
  const [pupMessage, setPupMessage] = useState<string>(
    `Challenge started! Select the source node (${challenge.source}) to initialize Dijkstra's shortest-path traversal.`
  );

  // Spark Effect Target
  const [sparkNodeId, setSparkNodeId] = useState<string | null>(null);

  // Mode A: Dijkstra Live Game State
  const [distances, setDistances] = useState<Record<string, number>>(() => getInitialDistances('easy'));
  const [previous, setPrevious] = useState<Record<string, string | null>>(() => getInitialPrevious('easy'));
  const [visitedNodeIds, setVisitedNodeIds] = useState<Set<string>>(new Set());
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [candidateNodeIds, setCandidateNodeIds] = useState<Set<string>>(() => new Set([GRAPH_CHALLENGES['easy'].source]));
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
    setSparkNodeId(null);

    setPupState('idle');
    setPupMessage(
      `Select the unvisited node with minimum tentative distance: Node ${GRAPH_CHALLENGES[difficulty].source} (dist = 0).`
    );

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

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && !isCompleted) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
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
        setPupState('thinking');
        setPupMessage(`Node ${clickedNodeId} is already in your path sequence.`);
        setGuidanceMessage({
          type: 'warning',
          text: `Node ${clickedNodeId} is already in your path sequence.`
        });
        return;
      }

      const newPath = [...reconstructedPath, clickedNodeId];
      setReconstructedPath(newPath);
      setSparkNodeId(clickedNodeId);
      setPupState('happy');
      setPupMessage(`Great step! Connected Node ${clickedNodeId} into path.`);

      // Highlight path edges
      if (newPath.length >= 2) {
        const u = newPath[newPath.length - 2];
        const v = newPath[newPath.length - 1];
        const edge = challenge.edges.find((e) => (e.u === u && e.v === v) || (e.u === v && e.v === u));
        if (edge) {
          setPathEdgeIds((prev) => {
            const next = new Set(prev);
            next.add(edge.id);
            return next;
          });
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
        setPupState('sad');
        setPupMessage(
          `Oops! By Dijkstra's greedy rule, pick the node with smallest tentative distance: Node ${validCandidate} (dist: ${minVal}). Every mistake teaches us!`
        );
        setGuidanceMessage({
          type: 'error',
          text: `Invalid selection! By Dijkstra's greedy invariant, you must pick the unvisited node with the smallest tentative distance (Node ${validCandidate} with dist = ${minVal}).`
        });
        return;
      }

      // Valid node selected!
      setCurrentNodeId(clickedNodeId);
      setScore((s) => s + 10);
      setSparkNodeId(clickedNodeId);
      setPupState('happy');
      setPupMessage(`Woof! Activated Node ${clickedNodeId} (smallest distance = ${minVal})! Now inspect connecting edges.`);

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
        text: `Active Node: ${clickedNodeId} (tentative distance: ${minVal}). Now select adjacent edges to relax tentative distances to neighbors.`
      });
      return;
    }

    // 2. If a node is already active, clicking another node advises examining edges or finalizing
    if (clickedNodeId === currentNodeId) {
      setPupState('thinking');
      setPupMessage(`Node ${currentNodeId} is active. Click connected edges or click 'Finalize Node ${currentNodeId}'!`);
      setGuidanceMessage({
        type: 'info',
        text: `Node ${currentNodeId} is currently active. Click connected edges to relax distances, or click 'Finalize Node ${currentNodeId}'.`
      });
    } else {
      setPupState('thinking');
      setPupMessage(`Finish exploring edges for active Node ${currentNodeId} before moving to another node.`);
      setGuidanceMessage({
        type: 'warning',
        text: `Node ${currentNodeId} is active. Please relax connecting edges first, then click 'Finalize Node ${currentNodeId}' before selecting Node ${clickedNodeId}.`
      });
    }
  };

  // Handle Edge Click (Relaxation)
  const handleEdgeClick = (edgeId: string) => {
    if (isCompleted || submittingPathMode) return;

    if (!currentNodeId) {
      setPupState('sad');
      setPupMessage("Select an unvisited node with minimum tentative distance first before relaxing edges.");
      setGuidanceMessage({
        type: 'warning',
        text: 'Select an unvisited node with minimum tentative distance first before relaxing edges.'
      });
      return;
    }

    const edge = challenge.edges.find((e) => e.id === edgeId);
    if (!edge) return;

    if (edge.u !== currentNodeId && edge.v !== currentNodeId) {
      setPupState('sad');
      setPupMessage(`Edge ${edge.id} does not connect to active Node ${currentNodeId}. Look for edges touching ${currentNodeId}!`);
      setGuidanceMessage({
        type: 'warning',
        text: `Edge ${edge.id} does not connect to active Node ${currentNodeId}.`
      });
      return;
    }

    const neighborId = edge.u === currentNodeId ? edge.v : edge.u;
    if (visitedNodeIds.has(neighborId)) {
      setPupState('thinking');
      setPupMessage(`Neighbor Node ${neighborId} is already finalized! Its distance cannot be improved.`);
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
      setRelaxedEdgeIds((prev) => {
        const next = new Set(prev);
        next.add(edgeId);
        return next;
      });
      setScore((s) => s + 10);
      setSparkNodeId(neighborId);
      setPupState('happy');
      setPupMessage(`Great move! Distance to Node ${neighborId} dropped from ${currentDist === Infinity ? '∞' : currentDist} to ${tentativeDist}!`);

      setGuidanceMessage({
        type: 'success',
        text: `Edge Relaxed! Distance to Node ${neighborId} updated from ${
          currentDist === Infinity ? '∞' : currentDist
        } down to ${tentativeDist} via Node ${currentNodeId}!`
      });
    } else {
      setPupState('thinking');
      setPupMessage(`Examined edge: dist(${currentNodeId}) + ${edge.weight} = ${tentativeDist} is not smaller than existing ${currentDist}. Distance stays minimal.`);
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
    const newVisited = new Set(visitedNodeIds);
    newVisited.add(finalizedId);
    setVisitedNodeIds(newVisited);
    setCurrentNodeId(null);
    setCandidateNodeIds(new Set());
    setSelectedEdgeId(null);
    setScore((s) => s + 5);

    // Check if Destination node has been reached/finalized
    if (finalizedId === challenge.destination || newVisited.size === challenge.nodes.length) {
      setSubmittingPathMode(true);
      setReconstructedPath([challenge.source]);
      setPupState('happy');
      setPupMessage(`Target Node ${challenge.destination} finalized! Now reconstruct the shortest path using Auto-Trace or clicking nodes.`);
      setGuidanceMessage({
        type: 'success',
        text: `Target Node ${challenge.destination} finalized! Now reconstruct the shortest path: click nodes in sequence starting from ${challenge.source} to ${challenge.destination}, or use 'Auto-Trace from Table'.`
      });
    } else {
      let nextMin = Infinity;
      let nextId = '';
      challenge.nodes.forEach((n) => {
        if (!newVisited.has(n.id) && distances[n.id] < nextMin) {
          nextMin = distances[n.id];
          nextId = n.id;
        }
      });

      setPupState('idle');
      setPupMessage(`Node ${finalizedId} marked finalized. Next, pick Node ${nextId || 'none'} (dist = ${nextMin}).`);
      setGuidanceMessage({
        type: 'info',
        text: `Node ${finalizedId} marked finalized. Next, select the unvisited node with minimum tentative distance (${nextId || 'none'} with dist = ${nextMin}).`
      });
    }
  };

  // Clear reconstructed path
  const handleClearPath = () => {
    setReconstructedPath([challenge.source]);
    setPathEdgeIds(new Set());
    setPupState('thinking');
    setPupMessage(`Path reset to [${challenge.source}]. Build your path to ${challenge.destination}.`);
    setGuidanceMessage({
      type: 'info',
      text: `Path sequence reset to [${challenge.source}]. Click nodes on the graph to build the shortest path to ${challenge.destination}.`
    });
  };

  // Undo last node in path sequence
  const handleUndoPathNode = () => {
    if (reconstructedPath.length <= 1) return;
    const newPath = reconstructedPath.slice(0, -1);
    setReconstructedPath(newPath);

    const edgesSet = new Set<string>();
    for (let i = 0; i < newPath.length - 1; i++) {
      const u = newPath[i];
      const v = newPath[i + 1];
      const edge = challenge.edges.find((e) => (e.u === u && e.v === v) || (e.u === v && e.v === u));
      if (edge) edgesSet.add(edge.id);
    }
    setPathEdgeIds(edgesSet);
  };

  // Auto-trace path backwards from target using the predecessor table
  const handleAutoTracePath = () => {
    const path: string[] = [];
    let curr: string | null = challenge.destination;
    const visitedSet = new Set<string>();

    while (curr && !visitedSet.has(curr)) {
      path.unshift(curr);
      visitedSet.add(curr);
      if (curr === challenge.source) break;
      curr = previous[curr] || null;
    }

    if (path.length > 0 && path[0] === challenge.source) {
      setReconstructedPath(path);
      const edgesSet = new Set<string>();
      for (let i = 0; i < path.length - 1; i++) {
        const u = path[i];
        const v = path[i + 1];
        const edge = challenge.edges.find((e) => (e.u === u && e.v === v) || (e.u === v && e.v === u));
        if (edge) edgesSet.add(edge.id);
      }
      setPathEdgeIds(edgesSet);
      setSparkNodeId(challenge.destination);
      setPupState('happy');
      setPupMessage(`Path auto-traced from table: ${path.join(' → ')}. Click Submit Shortest Path (+30) to finish!`);
      setGuidanceMessage({
        type: 'success',
        text: `Path auto-traced from your Predecessor table: ${path.join(' → ')}. Click Submit Shortest Path (+30) to finish!`
      });
    } else {
      setPupState('sad');
      setPupMessage(`Predecessors do not connect back to ${challenge.source}. Make sure all connecting edges were relaxed.`);
      setGuidanceMessage({
        type: 'warning',
        text: `Predecessor pointers from ${challenge.destination} do not connect back to ${challenge.source}. Make sure all edges were relaxed.`
      });
    }
  };

  // Submit Shortest Path
  const handleSubmitPath = () => {
    const optimal = fullDijkstra.current.optimalPath;

    if (
      reconstructedPath.length < optimal.length ||
      reconstructedPath[reconstructedPath.length - 1] !== challenge.destination
    ) {
      setPupState('thinking');
      setPupMessage(`Path incomplete! You have [${reconstructedPath.join(' → ')}]. Click nodes on the graph to reach Target (${challenge.destination}), or use Auto-Trace!`);
      setGuidanceMessage({
        type: 'warning',
        text: `Path incomplete! You currently have: [${reconstructedPath.join(' → ')}]. Click the next nodes on the graph (${optimal.slice(reconstructedPath.length).join(' → ')}) to reach Target (${challenge.destination}), or click "Auto-Trace from Table"!`
      });
      return;
    }

    const isCorrect =
      reconstructedPath.length === optimal.length &&
      reconstructedPath.every((val, index) => val === optimal[index]);

    if (isCorrect) {
      const efficiencyBonus = Math.max(0, 20 - mistakes * 4);
      const finalScore = score + 30 + efficiencyBonus;

      setScore(finalScore);
      setIsCompleted(true);
      setIsTimerRunning(false);
      setPupState('celebrating');
      setPupMessage(`PAW-SOME! YOU DID IT! You found the optimal shortest path: ${optimal.join(' → ')} with total weight ${fullDijkstra.current.optimalDistance}!`);

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
      setPupState('sad');
      setPupMessage(`Every mistake teaches us something! Path sequence was ${reconstructedPath.join(' → ')}. Try Clear Path or Auto-Trace!`);
      setGuidanceMessage({
        type: 'error',
        text: `Incorrect path sequence: ${reconstructedPath.join(' → ')}. Expected optimal path: ${optimal.join(' → ')}. Click "Clear Path" or "Auto-Trace from Table" to correct it!`
      });
    }
  };

  // Request Hint
  const handleRequestHint = () => {
    setHintsUsed((h) => h + 1);
    setScore((s) => Math.max(0, s - 5));

    if (!currentNodeId) {
      let minVal = Infinity;
      let nextNode = '';
      challenge.nodes.forEach((n) => {
        if (!visitedNodeIds.has(n.id) && distances[n.id] < minVal) {
          minVal = distances[n.id];
          nextNode = n.id;
        }
      });
      setPupState('thinking');
      setPupMessage(`Hint: The next node with minimum distance is Node ${nextNode} (dist: ${minVal}).`);
      setGuidanceMessage({
        type: 'info',
        text: `Hint: Select unvisited Node ${nextNode} (tentative distance: ${minVal}).`
      });
    } else {
      setPupState('thinking');
      setPupMessage(`Hint: Active Node is ${currentNodeId}. Relax outgoing edges or finalize!`);
      setGuidanceMessage({
        type: 'info',
        text: `Hint: Examine outgoing edges connected to active Node ${currentNodeId} to update neighbor distances.`
      });
    }
  };

  // -------------------------------------------------------------
  // MODE B: BUILD THE ALGORITHM ACTIONS
  // -------------------------------------------------------------

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (modeBSubmitted) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= shuffledSteps.length) return;

    const copy = [...shuffledSteps];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setShuffledSteps(copy);
  };

  const handleVerifyModeB = () => {
    let correctCount = 0;
    shuffledSteps.forEach((step, idx) => {
      if (step.correctIndex === idx) correctCount++;
    });

    setModeBSubmitted(true);
    setModeBScore({ correct: correctCount, total: shuffledSteps.length });

    if (correctCount === shuffledSteps.length) {
      setScore((s) => s + 40);
      setPupState('celebrating');
      setPupMessage("Master of Algorithms! You sequenced all Dijkstra steps perfectly in order!");
      setGuidanceMessage({
        type: 'success',
        text: 'Outstanding! You arranged all 7 algorithm steps in the mathematically correct order!'
      });
    } else {
      setMistakes((m) => m + 1);
      setScore((s) => Math.max(0, s - 5));
      setPupState('sad');
      setPupMessage(`${correctCount} of ${shuffledSteps.length} steps in correct order. Review highlighted steps!`);
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
      setPupState('happy');
      setPupMessage(`Correct! ${chosen.explanation}`);
      setGuidanceMessage({
        type: 'success',
        text: `Correct! ${chosen.explanation}`
      });
    } else {
      setScore((s) => Math.max(0, s - 5));
      setPupState('sad');
      setPupMessage(`Incorrect. ${chosen?.explanation || 'Try reviewing Dijkstra edge relaxation rules.'}`);
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
    setPupState('idle');
    setPupMessage("Analyze the graph and choose the edge that satisfies the algorithmic invariant.");
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
                  Algorithm Arena 2.0
                </span>
                <span className="bg-[#113A35] text-white text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full">
                  Animated Lab
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Think Strategically. Solve Algorithmically.
              </p>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex items-center bg-slate-200/70 p-1 rounded-xl text-xs font-semibold overflow-x-auto max-w-full">
            <button
              onClick={() => setGameMode('hub')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                gameMode === 'hub' ? 'bg-white text-[#113A35] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Arena Hub</span>
            </button>
            <button
              onClick={() => {
                setGameMode('dijkstra_path');
                resetGame();
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                gameMode === 'dijkstra_path' ? 'bg-white text-[#113A35] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🗺️ Dijkstra
            </button>
            <button
              onClick={() => setGameMode('bubble_sort')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                gameMode === 'bubble_sort' ? 'bg-white text-[#113A35] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🐧 Bubble Sort
            </button>
            <button
              onClick={() => setGameMode('selection_sort')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                gameMode === 'selection_sort' ? 'bg-white text-[#113A35] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👑 Selection Sort
            </button>
            <button
              onClick={() => setGameMode('sorting_showdown')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                gameMode === 'sorting_showdown' ? 'bg-white text-[#113A35] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ⚔️ Showdown
            </button>
          </div>

          {/* Live Score & Pacing Badges */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold text-emerald-900">
              <Trophy className="w-3.5 h-3.5 text-emerald-600" />
              <span>Score: {score}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-mono text-slate-700 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatTime(timerSeconds)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN INTERACTIVE CONTENT */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
        {/* ========================================================= */}
        {/* VIEW 0: ARENA HUB (LANDING HERO & GAME CARDS) */}
        {/* ========================================================= */}
        {gameMode === 'hub' && (
          <div className="space-y-8 py-2">
            {/* Arena Welcome Hero Banner */}
            <div className="bg-gradient-to-r from-[#0F2E2E] via-[#113A35] to-[#1F5F50] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 max-w-3xl space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-400/30">
                  Interactive Algorithm World 2.0
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white">
                  Think Strategically. Solve Algorithmically.
                </h2>
                <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
                  Welcome to Algorithm Arena 2.0! Step into an animated, game-like environment where you master graph pathfinding, edge relaxations, and sorting algorithms through tactile, visual exploration.
                </p>
              </div>

              {/* Mascot Companion in Hero */}
              <div className="mt-6 pt-6 border-t border-emerald-500/20 max-w-xl">
                <PathPup
                  state="happy"
                  message="Woof! Choose a challenge below. Let's conquer graphs and sorting together!"
                  size="md"
                />
              </div>
            </div>

            {/* 3 Primary Game Cards + Comparison Lab */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* CARD 1: DIJKSTRA PATH ADVENTURE */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col justify-between group hover:-translate-y-1">
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                    🗺️
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                      Graphs • Greedy
                    </span>
                    <h3 className="font-serif font-bold text-xl text-[#0F2E2E] mt-2">
                      Dijkstra's Path Adventure
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Find the shortest route across weighted graphs! Relax tentative distances, watch animated directional arrows, and reconstruct the optimal path with PathPup.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded">3 Difficulties</span>
                    <span>•</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded">Live Predecessor Table</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-800">Easy to Hard</span>
                  <button
                    onClick={() => {
                      setGameMode('dijkstra_path');
                      resetGame();
                    }}
                    className="inline-flex items-center gap-1.5 bg-[#64D8B8] hover:bg-[#52cba9] text-[#0A2328] px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all hover:scale-105 cursor-pointer"
                  >
                    <span>Play Adventure</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* CARD 2: BUBBLE SORT PENGUIN PARADE */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col justify-between group hover:-translate-y-1">
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                    🐧
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                      Sorting • Adjacent Swaps
                    </span>
                    <h3 className="font-serif font-bold text-xl text-[#0F2E2E] mt-2">
                      Bubble Sort: Penguin Parade
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Help penguins arrange themselves from shortest to tallest by repeatedly comparing and swapping neighbors. Discover early-exit optimization!
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded">3 Play Modes</span>
                    <span>•</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded">Early Exit O(n)</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-800">Stable Sort</span>
                  <button
                    onClick={() => setGameMode('bubble_sort')}
                    className="inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all hover:scale-105 cursor-pointer"
                  >
                    <span>Join Parade</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* CARD 3: SELECTION SORT PENGUIN CHAMPION */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col justify-between group hover:-translate-y-1">
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                    👑
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Sorting • Minimum Scanner
                    </span>
                    <h3 className="font-serif font-bold text-xl text-[#0F2E2E] mt-2">
                      Selection Sort: Penguin Champion
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Scan the unsorted lineup to find the shortest remaining penguin, then crown them directly into the front champion position each round!
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded">Min-Scan Focus</span>
                    <span>•</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded">Max n - 1 Swaps</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800">Swap Efficient</span>
                  <button
                    onClick={() => setGameMode('selection_sort')}
                    className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all hover:scale-105 cursor-pointer"
                  >
                    <span>Crown Champion</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* CARD 4: SORTING SHOWDOWN BENCHMARK LAB */}
            <div className="bg-gradient-to-r from-slate-900 to-[#113A35] rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-bold tracking-wider uppercase text-amber-300">
                    Laboratory Experiment
                  </span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-white">
                  Sorting Showdown: Live Head-to-Head Comparison
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Run Bubble Sort and Selection Sort simultaneously on the exact same array. Compare swaps, comparisons, stability, and runtime behavior with live telemetry.
                </p>
              </div>

              <button
                onClick={() => setGameMode('sorting_showdown')}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-bold px-6 py-3 rounded-2xl text-xs shadow-md transition-all hover:scale-105 shrink-0 cursor-pointer"
              >
                <span>Launch Comparison Lab</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 1: DIJKSTRA'S PATH ADVENTURE */}
        {/* ========================================================= */}
        {gameMode === 'dijkstra_path' && (
          <div className="space-y-6">
            {/* Top Toolbar: Difficulty & Actions */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
              {/* Difficulty Selector */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-semibold">DIFFICULTY:</span>
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
                  disabled={isCompleted}
                  className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl font-medium transition-colors disabled:opacity-40 cursor-pointer text-xs"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Hint (-5)</span>
                </button>

                <button
                  onClick={resetGame}
                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Challenge</span>
                </button>

                {currentNodeId && !submittingPathMode && (
                  <button
                    onClick={handleFinalizeCurrentNode}
                    className="inline-flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white px-3.5 py-1.5 rounded-xl font-semibold shadow-xs transition-colors cursor-pointer text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Finalize Node {currentNodeId}</span>
                  </button>
                )}

                {submittingPathMode && !isCompleted && (
                  <button
                    onClick={handleSubmitPath}
                    className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-1.5 rounded-xl font-bold shadow-xs transition-colors cursor-pointer text-xs"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Submit Shortest Path (+30)</span>
                  </button>
                )}
              </div>
            </div>

            {/* PathPup Companion Banner */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
              <PathPup state={pupState} message={pupMessage} size="md" />
            </div>

            {/* Main Interactive Graph Canvas & Table Grid */}
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
                  reconstructedPath={reconstructedPath}
                  sparkNodeId={sparkNodeId}
                  onSparkComplete={() => setSparkNodeId(null)}
                />

                {/* Status Bar & Path Reconstruction Card */}
                {submittingPathMode && !isCompleted ? (
                  <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white rounded-2xl border border-emerald-500/40 p-4 shadow-md space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-xl bg-emerald-400 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          2
                        </span>
                        <div>
                          <h5 className="font-bold text-xs sm:text-sm text-emerald-100 flex items-center gap-2">
                            Step 2: Reconstruct Shortest Path Sequence
                          </h5>
                          <p className="text-[11px] text-emerald-200/80">
                            Click nodes in order on the graph, or click Auto-Trace from your table
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleUndoPathNode}
                          disabled={reconstructedPath.length <= 1}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                        >
                          Undo
                        </button>
                        <button
                          onClick={handleClearPath}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                        >
                          Clear
                        </button>
                        <button
                          onClick={handleAutoTracePath}
                          className="px-3 py-1 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-lg text-xs shadow-sm cursor-pointer transition-all hover:scale-105 flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>⚡ Auto-Trace from Table</span>
                        </button>
                      </div>
                    </div>

                    {/* Sequence Badges */}
                    <div className="flex flex-wrap items-center gap-2 bg-slate-900/70 p-3 rounded-xl border border-emerald-500/20 text-xs font-mono">
                      <span className="text-emerald-300 font-sans font-semibold text-[11px]">Sequence:</span>
                      {reconstructedPath.map((nodeId, idx) => (
                        <React.Fragment key={idx}>
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold shadow-xs">
                            {nodeId}
                          </span>
                          {idx < reconstructedPath.length - 1 && (
                            <span className="text-emerald-400 font-sans font-bold">→</span>
                          )}
                        </React.Fragment>
                      ))}

                      {reconstructedPath[reconstructedPath.length - 1] !== challenge.destination && (
                        <>
                          <span className="text-emerald-400/60 font-sans font-bold">→</span>
                          <span className="px-2.5 py-1 rounded-lg border border-dashed border-emerald-400/50 text-emerald-300 animate-pulse text-[11px] font-sans">
                            Click Next Node on Graph
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
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

                    <div className="text-[11px] font-mono text-slate-500">
                      Moves: {moves} • Mistakes: {mistakes} • Hints: {hintsUsed}
                    </div>
                  </div>
                )}
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

                {/* Algorithm Invariant Rules Card */}
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
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: BUBBLE SORT PENGUIN PARADE */}
        {/* ========================================================= */}
        {gameMode === 'bubble_sort' && (
          <BubbleSortGame
            onBackToHub={() => setGameMode('hub')}
            onCompareWithSelection={(arr) => {
              setComparisonArrayOverride(arr);
              setGameMode('sorting_showdown');
            }}
          />
        )}

        {/* ========================================================= */}
        {/* VIEW 3: SELECTION SORT PENGUIN CHAMPION */}
        {/* ========================================================= */}
        {gameMode === 'selection_sort' && (
          <SelectionSortGame
            onBackToHub={() => setGameMode('hub')}
            onCompareWithBubble={(arr) => {
              setComparisonArrayOverride(arr);
              setGameMode('sorting_showdown');
            }}
          />
        )}

        {/* ========================================================= */}
        {/* VIEW 4: SORTING SHOWDOWN BENCHMARK LAB */}
        {/* ========================================================= */}
        {gameMode === 'sorting_showdown' && (
          <SortingComparison
            initialArrayOverride={comparisonArrayOverride}
            onBackToHub={() => setGameMode('hub')}
          />
        )}
      </main>

      {/* 3. VICTORY CELEBRATION MODAL */}
      {isCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-emerald-100 text-center space-y-6 relative overflow-hidden">
            <div className="flex justify-center">
              <PathPup state="celebrating" size="lg" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                CHALLENGE COMPLETED
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#0F2E2E] mt-2">
                PAW-SOME! YOU DID IT!
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
                You found the shortest path! Every smart decision brought you closer to the goal.
              </p>
            </div>

            {/* Victory Score Matrix */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">TOTAL SCORE</span>
                <span className="font-mono font-bold text-lg text-emerald-800">{score}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">PATH WEIGHT</span>
                <span className="font-mono font-bold text-lg text-teal-800">
                  {fullDijkstra.current.optimalDistance}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">ACCURACY</span>
                <span className="font-mono font-bold text-lg text-emerald-800">
                  {Math.max(0, 100 - mistakes * 10)}%
                </span>
              </div>
            </div>

            {/* Path Result */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs font-mono font-bold text-emerald-900">
              Optimal Route: {reconstructedPath.join(' → ')}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={resetGame}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Play Again
              </button>
              <button
                onClick={() => {
                  setDifficulty(difficulty === 'easy' ? 'medium' : 'hard');
                  resetGame();
                }}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-md transition-all hover:scale-105 cursor-pointer"
              >
                Try Next Level ➔
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
