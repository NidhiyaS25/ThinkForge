export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string; // e.g., 'A-B'
  u: string;
  v: string;
  weight: number;
}

export interface GraphChallenge {
  id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  title: string;
  description: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  source: string;
  destination: string;
  optimalDistance: number;
  optimalPath: string[];
}

export interface DijkstraStepTrace {
  nodeId: string;
  distance: number;
  relaxedEdges: { edgeId: string; neighborId: string; newDistance: number; improved: boolean }[];
}

export interface AlgorithmStepItem {
  id: string;
  text: string;
  correctIndex: number;
  explanation: string;
}

export interface EdgeChallengePuzzle {
  id: string;
  title: string;
  question: string;
  options: { id: string; label: string; isCorrect: boolean; explanation: string }[];
  targetEdgeId?: string;
}

// -------------------------------------------------------------
// PREDEFINED VERIFIED GRAPH CHALLENGES
// -------------------------------------------------------------

export const GRAPH_CHALLENGES: Record<'easy' | 'medium' | 'hard', GraphChallenge> = {
  easy: {
    id: 'easy-1',
    difficulty: 'easy',
    title: "Dijkstra's Path: Level 1 (5 Nodes)",
    description: "Navigate from Node A to Node E. Notice how relaxing Node C improves the distance to Node B before reaching D and E.",
    source: 'A',
    destination: 'E',
    optimalDistance: 10,
    optimalPath: ['A', 'C', 'B', 'D', 'E'],
    nodes: [
      { id: 'A', label: 'A (Start)', x: 90, y: 190 },
      { id: 'B', label: 'B', x: 230, y: 90 },
      { id: 'C', label: 'C', x: 230, y: 290 },
      { id: 'D', label: 'D', x: 390, y: 190 },
      { id: 'E', label: 'E (Target)', x: 530, y: 190 }
    ],
    edges: [
      { id: 'A-B', u: 'A', v: 'B', weight: 4 },
      { id: 'A-C', u: 'A', v: 'C', weight: 2 },
      { id: 'C-B', u: 'C', v: 'B', weight: 1 },
      { id: 'B-D', u: 'B', v: 'D', weight: 5 },
      { id: 'C-D', u: 'C', v: 'D', weight: 8 },
      { id: 'B-E', u: 'B', v: 'E', weight: 10 },
      { id: 'D-E', u: 'D', v: 'E', weight: 2 }
    ]
  },
  medium: {
    id: 'medium-1',
    difficulty: 'medium',
    title: "Dijkstra's Path: Level 2 (7 Nodes)",
    description: "Multi-branch graph with competing paths. Determine whether taking the upper bypass via D and F is more optimal than the lower branch.",
    source: 'A',
    destination: 'G',
    optimalDistance: 14,
    optimalPath: ['A', 'B', 'D', 'F', 'G'],
    nodes: [
      { id: 'A', label: 'A (Start)', x: 80, y: 190 },
      { id: 'B', label: 'B', x: 210, y: 80 },
      { id: 'C', label: 'C', x: 210, y: 300 },
      { id: 'D', label: 'D', x: 340, y: 120 },
      { id: 'E', label: 'E', x: 340, y: 260 },
      { id: 'F', label: 'F', x: 470, y: 100 },
      { id: 'G', label: 'G (Target)', x: 540, y: 210 }
    ],
    edges: [
      { id: 'A-B', u: 'A', v: 'B', weight: 3 },
      { id: 'A-C', u: 'A', v: 'C', weight: 6 },
      { id: 'B-C', u: 'B', v: 'C', weight: 2 },
      { id: 'B-D', u: 'B', v: 'D', weight: 4 },
      { id: 'C-E', u: 'C', v: 'E', weight: 3 },
      { id: 'D-E', u: 'D', v: 'E', weight: 1 },
      { id: 'D-F', u: 'D', v: 'F', weight: 5 },
      { id: 'E-G', u: 'E', v: 'G', weight: 8 },
      { id: 'F-G', u: 'F', v: 'G', weight: 2 }
    ]
  },
  hard: {
    id: 'hard-1',
    difficulty: 'hard',
    title: "Dijkstra's Path: Level 3 (9 Nodes)",
    description: "Complex grid network with cross-bridges and tight weight differentials. Precision sequencing is required to maximize accuracy.",
    source: 'A',
    destination: 'I',
    optimalDistance: 17,
    optimalPath: ['A', 'B', 'E', 'H', 'I'],
    nodes: [
      { id: 'A', label: 'A (Start)', x: 70, y: 190 },
      { id: 'B', label: 'B', x: 190, y: 70 },
      { id: 'C', label: 'C', x: 190, y: 190 },
      { id: 'D', label: 'D', x: 190, y: 310 },
      { id: 'E', label: 'E', x: 330, y: 110 },
      { id: 'F', label: 'F', x: 330, y: 270 },
      { id: 'G', label: 'G', x: 460, y: 70 },
      { id: 'H', label: 'H', x: 460, y: 220 },
      { id: 'I', label: 'I (Target)', x: 550, y: 190 }
    ],
    edges: [
      { id: 'A-B', u: 'A', v: 'B', weight: 4 },
      { id: 'A-C', u: 'A', v: 'C', weight: 5 },
      { id: 'A-D', u: 'A', v: 'D', weight: 7 },
      { id: 'B-E', u: 'B', v: 'E', weight: 3 },
      { id: 'C-E', u: 'C', v: 'E', weight: 4 },
      { id: 'C-F', u: 'C', v: 'F', weight: 3 },
      { id: 'D-F', u: 'D', v: 'F', weight: 2 },
      { id: 'E-G', u: 'E', v: 'G', weight: 6 },
      { id: 'E-H', u: 'E', v: 'H', weight: 4 },
      { id: 'F-H', u: 'F', v: 'H', weight: 5 },
      { id: 'G-I', u: 'G', v: 'I', weight: 5 },
      { id: 'H-I', u: 'H', v: 'I', weight: 6 }
    ]
  }
};

// -------------------------------------------------------------
// REAL DIJKSTRA ALGORITHM ENGINE & VALIDATOR
// -------------------------------------------------------------

export function runFullDijkstra(challenge: GraphChallenge) {
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const visited = new Set<string>();
  const stepsTrace: DijkstraStepTrace[] = [];

  // Initialize
  challenge.nodes.forEach((n) => {
    distances[n.id] = n.id === challenge.source ? 0 : Infinity;
    previous[n.id] = null;
  });

  const unvisited = new Set(challenge.nodes.map((n) => n.id));

  while (unvisited.size > 0) {
    // Find unvisited node with smallest distance
    let current: string | null = null;
    let minDistance = Infinity;

    unvisited.forEach((nodeId) => {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId];
        current = nodeId;
      }
    });

    if (!current || minDistance === Infinity) break;

    unvisited.delete(current);
    visited.add(current);

    const stepInfo: DijkstraStepTrace = {
      nodeId: current,
      distance: minDistance,
      relaxedEdges: []
    };

    // Examine neighbors
    const incidentEdges = challenge.edges.filter(
      (e) => (e.u === current && !visited.has(e.v)) || (e.v === current && !visited.has(e.u))
    );

    for (const edge of incidentEdges) {
      const neighbor = edge.u === current ? edge.v : edge.u;
      const tentative = distances[current] + edge.weight;
      const improved = tentative < distances[neighbor];

      if (improved) {
        distances[neighbor] = tentative;
        previous[neighbor] = current;
      }

      stepInfo.relaxedEdges.push({
        edgeId: edge.id,
        neighborId: neighbor,
        newDistance: distances[neighbor],
        improved
      });
    }

    stepsTrace.push(stepInfo);

    if (current === challenge.destination) break;
  }

  // Backtrack optimal path
  const path: string[] = [];
  let curr: string | null = challenge.destination;
  while (curr) {
    path.unshift(curr);
    curr = previous[curr];
  }

  return {
    distances,
    previous,
    stepsTrace,
    optimalPath: path,
    optimalDistance: distances[challenge.destination]
  };
}

// -------------------------------------------------------------
// MODE B: ALGORITHM SEQUENCING STEP DATA
// -------------------------------------------------------------

export const DIJKSTRA_ALGORITHM_STEPS: AlgorithmStepItem[] = [
  {
    id: 'step-1',
    text: 'Set the distance to the source node to 0 and all other nodes to infinity (∞).',
    correctIndex: 0,
    explanation: 'Dijkstra requires an initial baseline so the source is chosen first with distance 0.'
  },
  {
    id: 'step-2',
    text: 'Identify all unvisited nodes and select the one with the minimum tentative distance.',
    correctIndex: 1,
    explanation: 'The greedy choice property guarantees the shortest path to this minimum unvisited node is finalized.'
  },
  {
    id: 'step-3',
    text: 'Examine all unvisited neighbors connected to the currently selected node.',
    correctIndex: 2,
    explanation: 'We only look at unvisited adjacent nodes to explore candidate forward paths.'
  },
  {
    id: 'step-4',
    text: 'Relax edges: if distance(current) + edge_weight < distance(neighbor), update distance and predecessor.',
    correctIndex: 3,
    explanation: 'Relaxation tests whether passing through the current node yields a shorter tentative route.'
  },
  {
    id: 'step-5',
    text: 'Mark the current node as visited / finalized so it is never re-processed.',
    correctIndex: 4,
    explanation: 'Since weights are non-negative, a finalized node will never find a shorter detour.'
  },
  {
    id: 'step-6',
    text: 'Repeat the selection and relaxation loop until destination is finalized or unvisited set is empty.',
    correctIndex: 5,
    explanation: 'Iterating through all reachable nodes ensures global optimality.'
  },
  {
    id: 'step-7',
    text: 'Backtrack from destination to source using predecessor pointers to construct the shortest path.',
    correctIndex: 6,
    explanation: 'Following the recorded previous nodes reconstructs the sequence of nodes in the shortest path.'
  }
];

// -------------------------------------------------------------
// MODE C: EDGE SELECTION CHALLENGES
// -------------------------------------------------------------

export const EDGE_SELECTION_PUZZLES: EdgeChallengePuzzle[] = [
  {
    id: 'edge-puz-1',
    title: 'Edge Relaxation Decision',
    question: 'In Level 1, after finalizing Node A (dist=0) and discovering C (dist=2) and B (dist=4), Node C is visited next. Which edge must be examined to improve the distance to Node B?',
    targetEdgeId: 'C-B',
    options: [
      {
        id: 'C-B',
        label: 'Edge C - B (Weight: 1)',
        isCorrect: true,
        explanation: 'Correct! dist(C) + 1 = 2 + 1 = 3, which is strictly less than the previous tentative distance of 4 for Node B.'
      },
      {
        id: 'C-D',
        label: 'Edge C - D (Weight: 8)',
        isCorrect: false,
        explanation: 'Incorrect. Edge C-D relaxes Node D to distance 10, but does not improve the distance to Node B.'
      },
      {
        id: 'A-B',
        label: 'Edge A - B (Weight: 4)',
        isCorrect: false,
        explanation: 'Incorrect. Node A has already been finalized and cannot be re-examined.'
      },
      {
        id: 'B-D',
        label: 'Edge B - D (Weight: 5)',
        isCorrect: false,
        explanation: 'Incorrect. Node B has not yet been selected as the current minimum unvisited node.'
      }
    ]
  },
  {
    id: 'edge-puz-2',
    title: 'Pruning Sub-optimal Paths',
    question: 'In Level 2, when relaxing neighbors of Node D (dist=7), you have edges D-E (weight 1) and D-F (weight 5). Which edge leads toward the globally shortest path to Destination G?',
    targetEdgeId: 'D-F',
    options: [
      {
        id: 'D-F',
        label: 'Edge D - F (Weight: 5)',
        isCorrect: true,
        explanation: 'Correct! Path A->B->D->F->G has length 3 + 4 + 5 + 2 = 14, which beats the lower detour through Node E (length 16).'
      },
      {
        id: 'D-E',
        label: 'Edge D - E (Weight: 1)',
        isCorrect: false,
        explanation: 'Incorrect. Although D-E has a smaller immediate weight (1), reaching G from E requires weight 8 (total 16 > 14).'
      },
      {
        id: 'C-E',
        label: 'Edge C - E (Weight: 3)',
        isCorrect: false,
        explanation: 'Incorrect. Node C belongs to an alternate higher-cost route.'
      }
    ]
  },
  {
    id: 'edge-puz-3',
    title: 'Final Step Verification',
    question: 'In Level 1, Node D has distance 8 and an edge D-E with weight 2 connects directly to destination E. Does Edge D-E successfully finalize E?',
    targetEdgeId: 'D-E',
    options: [
      {
        id: 'D-E',
        label: 'Edge D - E (Weight: 2)',
        isCorrect: true,
        explanation: 'Correct! dist(D) + 2 = 8 + 2 = 10, which improves over the direct B-E bypass (3 + 10 = 13).'
      },
      {
        id: 'B-E',
        label: 'Edge B - E (Weight: 10)',
        isCorrect: false,
        explanation: 'Incorrect. Edge B-E gives total distance 3 + 10 = 13, which is sub-optimal compared to 10.'
      }
    ]
  }
];
