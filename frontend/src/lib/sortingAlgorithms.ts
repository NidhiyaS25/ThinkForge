// -------------------------------------------------------------
// ThinkForge Algorithm Arena 2.0 — Sorting Algorithm Engine
// Pure, deterministic trace generators for Bubble Sort & Selection Sort
// -------------------------------------------------------------

export interface SortingTraceStep {
  id: string;
  stepIndex: number;
  array: number[];
  type: 'compare' | 'swap' | 'no_swap' | 'pass_complete' | 'min_update' | 'complete';
  comparedIndices: [number, number] | null;
  swappedIndices: [number, number] | null;
  currentMinIndex: number | null; // For Selection Sort
  sortedIndices: number[]; // Indices permanently sorted
  comparisonsCount: number;
  swapsCount: number;
  pass: number;
  description: string;
  highlightIndices: number[];
  isPassEnd?: boolean;
  earlyExit?: boolean;
}

export interface SortingSimulationState {
  initialArray: number[];
  steps: SortingTraceStep[];
  currentStepIndex: number;
  isComplete: boolean;
  comparisonsCount: number;
  swapsCount: number;
}

// Predefined Educational Array Presets
export const SORTING_PRESETS: { id: string; label: string; array: number[]; description: string }[] = [
  {
    id: 'standard',
    label: 'Playful Mix',
    array: [5, 2, 4, 1, 3],
    description: 'Classic 5-element shuffle. Perfect for learning comparison and swap mechanics.'
  },
  {
    id: 'nearly_sorted',
    label: 'Nearly Sorted',
    array: [1, 2, 4, 3, 5],
    description: 'Only two elements out of place. Demonstrates Bubble Sort early-exit optimization.'
  },
  {
    id: 'reverse_sorted',
    label: 'Worst Case (Reverse)',
    array: [5, 4, 3, 2, 1],
    description: 'Completely reversed. Maximum possible comparisons and swaps for quadratic algorithms.'
  },
  {
    id: 'duplicates',
    label: 'With Duplicates',
    array: [3, 1, 4, 1, 5, 2],
    description: 'Demonstrates algorithm stability with identical values.'
  },
  {
    id: 'already_sorted',
    label: 'Best Case (Sorted)',
    array: [1, 2, 3, 4, 5],
    description: 'Already in order. Shows O(n) best-case for optimized Bubble Sort.'
  }
];

// -------------------------------------------------------------
// BUBBLE SORT TRACE GENERATOR
// -------------------------------------------------------------
export function generateBubbleSortTrace(inputArray: number[]): SortingTraceStep[] {
  const arr = [...inputArray];
  const n = arr.length;
  const steps: SortingTraceStep[] = [];
  let comparisons = 0;
  let swaps = 0;
  const sortedIndices: number[] = [];

  // Initial Step 0
  steps.push({
    id: 'b-0',
    stepIndex: 0,
    array: [...arr],
    type: 'compare',
    comparedIndices: null,
    swappedIndices: null,
    currentMinIndex: null,
    sortedIndices: [],
    comparisonsCount: 0,
    swapsCount: 0,
    pass: 1,
    description: `Array initialized with ${n} penguins. Starting Bubble Sort passes.`,
    highlightIndices: []
  });

  for (let i = 0; i < n - 1; i++) {
    let swappedInPass = false;

    for (let j = 0; j < n - 1 - i; j++) {
      comparisons++;
      const leftVal = arr[j];
      const rightVal = arr[j + 1];

      // Compare step
      steps.push({
        id: `b-cmp-${i}-${j}`,
        stepIndex: steps.length,
        array: [...arr],
        type: 'compare',
        comparedIndices: [j, j + 1],
        swappedIndices: null,
        currentMinIndex: null,
        sortedIndices: [...sortedIndices],
        comparisonsCount: comparisons,
        swapsCount: swaps,
        pass: i + 1,
        description: `Comparing penguins at index ${j} (height ${leftVal}) and index ${j + 1} (height ${rightVal}).`,
        highlightIndices: [j, j + 1]
      });

      if (arr[j] > arr[j + 1]) {
        // Swap needed
        swaps++;
        swappedInPass = true;
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;

        steps.push({
          id: `b-swap-${i}-${j}`,
          stepIndex: steps.length,
          array: [...arr],
          type: 'swap',
          comparedIndices: [j, j + 1],
          swappedIndices: [j, j + 1],
          currentMinIndex: null,
          sortedIndices: [...sortedIndices],
          comparisonsCount: comparisons,
          swapsCount: swaps,
          pass: i + 1,
          description: `Since ${leftVal} > ${rightVal}, swapped penguin ${leftVal} with ${rightVal}.`,
          highlightIndices: [j, j + 1]
        });
      } else {
        // No swap needed
        steps.push({
          id: `b-noswap-${i}-${j}`,
          stepIndex: steps.length,
          array: [...arr],
          type: 'no_swap',
          comparedIndices: [j, j + 1],
          swappedIndices: null,
          currentMinIndex: null,
          sortedIndices: [...sortedIndices],
          comparisonsCount: comparisons,
          swapsCount: swaps,
          pass: i + 1,
          description: `Since ${leftVal} <= ${rightVal}, penguins are already in order. Keeping positions.`,
          highlightIndices: [j, j + 1]
        });
      }
    }

    // At the end of pass i, element at (n - 1 - i) has bubbled to its final position
    const finalizedIdx = n - 1 - i;
    if (!sortedIndices.includes(finalizedIdx)) {
      sortedIndices.push(finalizedIdx);
    }

    steps.push({
      id: `b-passend-${i}`,
      stepIndex: steps.length,
      array: [...arr],
      type: 'pass_complete',
      comparedIndices: null,
      swappedIndices: null,
      currentMinIndex: null,
      sortedIndices: [...sortedIndices],
      comparisonsCount: comparisons,
      swapsCount: swaps,
      pass: i + 1,
      isPassEnd: true,
      description: `Pass ${i + 1} complete! Largest unsorted penguin (${arr[finalizedIdx]}) bubbled to index ${finalizedIdx}.`,
      highlightIndices: [finalizedIdx]
    });

    // Early termination check: if no swaps occurred, the array is already sorted!
    if (!swappedInPass) {
      // Mark all remaining elements as sorted
      for (let k = 0; k < n; k++) {
        if (!sortedIndices.includes(k)) sortedIndices.push(k);
      }

      steps.push({
        id: `b-earlyexit-${i}`,
        stepIndex: steps.length,
        array: [...arr],
        type: 'complete',
        comparedIndices: null,
        swappedIndices: null,
        currentMinIndex: null,
        sortedIndices: [...sortedIndices],
        comparisonsCount: comparisons,
        swapsCount: swaps,
        pass: i + 1,
        earlyExit: true,
        description: `Early exit triggered! No swaps were needed during pass ${i + 1}, meaning all penguins are sorted in O(n) best-case time!`,
        highlightIndices: []
      });
      return steps;
    }
  }

  // Final all sorted
  for (let k = 0; k < n; k++) {
    if (!sortedIndices.includes(k)) sortedIndices.push(k);
  }

  steps.push({
    id: `b-complete`,
    stepIndex: steps.length,
    array: [...arr],
    type: 'complete',
    comparedIndices: null,
    swappedIndices: null,
    currentMinIndex: null,
    sortedIndices: [...sortedIndices],
    comparisonsCount: comparisons,
    swapsCount: swaps,
    pass: n - 1,
    description: `Bubble Sort complete! All penguins are in ascending order (${comparisons} comparisons, ${swaps} swaps).`,
    highlightIndices: []
  });

  return steps;
}

// -------------------------------------------------------------
// SELECTION SORT TRACE GENERATOR
// -------------------------------------------------------------
export function generateSelectionSortTrace(inputArray: number[]): SortingTraceStep[] {
  const arr = [...inputArray];
  const n = arr.length;
  const steps: SortingTraceStep[] = [];
  let comparisons = 0;
  let swaps = 0;
  const sortedIndices: number[] = [];

  steps.push({
    id: 's-0',
    stepIndex: 0,
    array: [...arr],
    type: 'compare',
    comparedIndices: null,
    swappedIndices: null,
    currentMinIndex: null,
    sortedIndices: [],
    comparisonsCount: 0,
    swapsCount: 0,
    pass: 1,
    description: `Array initialized with ${n} penguins. Starting Selection Sort.`,
    highlightIndices: []
  });

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;

    // Start of pass: set candidate minimum
    steps.push({
      id: `s-startpass-${i}`,
      stepIndex: steps.length,
      array: [...arr],
      type: 'min_update',
      comparedIndices: null,
      swappedIndices: null,
      currentMinIndex: minIdx,
      sortedIndices: [...sortedIndices],
      comparisonsCount: comparisons,
      swapsCount: swaps,
      pass: i + 1,
      description: `Pass ${i + 1}: Initial candidate minimum set to index ${minIdx} (height ${arr[minIdx]}). Scanning unsorted portion.`,
      highlightIndices: [minIdx]
    });

    for (let j = i + 1; j < n; j++) {
      comparisons++;

      steps.push({
        id: `s-cmp-${i}-${j}`,
        stepIndex: steps.length,
        array: [...arr],
        type: 'compare',
        comparedIndices: [minIdx, j],
        swappedIndices: null,
        currentMinIndex: minIdx,
        sortedIndices: [...sortedIndices],
        comparisonsCount: comparisons,
        swapsCount: swaps,
        pass: i + 1,
        description: `Comparing candidate minimum (${arr[minIdx]} at index ${minIdx}) with penguin at index ${j} (height ${arr[j]}).`,
        highlightIndices: [minIdx, j]
      });

      if (arr[j] < arr[minIdx]) {
        minIdx = j;
        steps.push({
          id: `s-newmin-${i}-${j}`,
          stepIndex: steps.length,
          array: [...arr],
          type: 'min_update',
          comparedIndices: [minIdx, j],
          swappedIndices: null,
          currentMinIndex: minIdx,
          sortedIndices: [...sortedIndices],
          comparisonsCount: comparisons,
          swapsCount: swaps,
          pass: i + 1,
          description: `New minimum found! Penguin ${arr[minIdx]} at index ${minIdx} is shorter.`,
          highlightIndices: [minIdx]
        });
      }
    }

    // End of pass: perform placement swap with index i
    if (minIdx !== i) {
      swaps++;
      const temp = arr[i];
      arr[i] = arr[minIdx];
      arr[minIdx] = temp;

      steps.push({
        id: `s-swap-${i}`,
        stepIndex: steps.length,
        array: [...arr],
        type: 'swap',
        comparedIndices: [i, minIdx],
        swappedIndices: [i, minIdx],
        currentMinIndex: null,
        sortedIndices: [...sortedIndices, i],
        comparisonsCount: comparisons,
        swapsCount: swaps,
        pass: i + 1,
        isPassEnd: true,
        description: `Pass ${i + 1} complete! Swapped minimum penguin (${arr[i]}) into sorted position index ${i}.`,
        highlightIndices: [i, minIdx]
      });
    } else {
      steps.push({
        id: `s-noswap-${i}`,
        stepIndex: steps.length,
        array: [...arr],
        type: 'no_swap',
        comparedIndices: null,
        swappedIndices: null,
        currentMinIndex: null,
        sortedIndices: [...sortedIndices, i],
        comparisonsCount: comparisons,
        swapsCount: swaps,
        pass: i + 1,
        isPassEnd: true,
        description: `Pass ${i + 1} complete! Minimum penguin (${arr[i]}) was already at index ${i}. No swap needed.`,
        highlightIndices: [i]
      });
    }

    sortedIndices.push(i);
  }

  // Last element is automatically sorted
  if (!sortedIndices.includes(n - 1)) {
    sortedIndices.push(n - 1);
  }

  steps.push({
    id: `s-complete`,
    stepIndex: steps.length,
    array: [...arr],
    type: 'complete',
    comparedIndices: null,
    swappedIndices: null,
    currentMinIndex: null,
    sortedIndices: [...sortedIndices],
    comparisonsCount: comparisons,
    swapsCount: swaps,
    pass: n - 1,
    description: `Selection Sort complete! All penguins are sorted (${comparisons} comparisons, ${swaps} swaps).`,
    highlightIndices: []
  });

  return steps;
}
