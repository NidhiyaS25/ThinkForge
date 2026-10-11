'use client';

import React from 'react';
import { GraphNode } from '../../lib/graphAlgorithms';
import { CheckCircle2, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

interface DistanceTableProps {
  nodes: GraphNode[];
  distances: Record<string, number>;
  previous: Record<string, string | null>;
  visitedNodeIds: Set<string>;
  currentNodeId: string | null;
  candidateNodeIds: Set<string>;
}

export const DistanceTable: React.FC<DistanceTableProps> = ({
  nodes,
  distances,
  previous,
  visitedNodeIds,
  currentNodeId,
  candidateNodeIds
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Live Distance & Predecessor Table
          </h4>
          <p className="text-[10px] text-slate-500">
            Dijkstra tentative distances updated dynamically
          </p>
        </div>
        <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
          {visitedNodeIds.size} / {nodes.length} Finalized
        </span>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200/80 text-slate-500 bg-slate-50/40 text-[10px] uppercase font-semibold">
              <th className="py-2.5 px-3">Node</th>
              <th className="py-2.5 px-3">Tentative Dist</th>
              <th className="py-2.5 px-3">Predecessor</th>
              <th className="py-2.5 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
            {nodes.map((node) => {
              const isCurrent = node.id === currentNodeId;
              const isVisited = visitedNodeIds.has(node.id);
              const isCandidate = candidateNodeIds.has(node.id);
              const dist = distances[node.id];
              const prev = previous[node.id];

              let rowBg = 'hover:bg-slate-50';
              if (isCurrent) rowBg = 'bg-teal-50/70 font-semibold';
              else if (isVisited) rowBg = 'bg-emerald-50/30';
              else if (isCandidate) rowBg = 'bg-sky-50/40';

              return (
                <tr key={node.id} className={`transition-colors ${rowBg}`}>
                  <td className="py-2 px-3 font-bold text-slate-900 font-sans flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-[10px]">
                      {node.id}
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal hidden sm:inline">
                      {node.label.replace(node.id, '').replace('(', '').replace(')', '').trim()}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    {dist === Infinity ? (
                      <span className="text-slate-400">∞</span>
                    ) : (
                      <span
                        className={`font-bold ${
                          isVisited ? 'text-emerald-700' : isCurrent ? 'text-teal-700' : 'text-slate-800'
                        }`}
                      >
                        {dist}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {prev ? (
                      <span className="text-slate-700 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                        {prev}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-2 px-3 font-sans">
                    {isVisited ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Finalized
                      </span>
                    ) : isCurrent ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full animate-pulse">
                        <ArrowRight className="w-3 h-3 text-teal-600" />
                        Active
                      </span>
                    ) : isCandidate ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3 text-sky-600" />
                        Candidate
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Unvisited</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
