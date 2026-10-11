'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Clock, ShieldCheck, Network } from 'lucide-react';
import { KnowledgeNode } from '../types';

interface KnowledgeGraphProps {
  nodes: KnowledgeNode[];
  onSelectNode?: (node: KnowledgeNode) => void;
  selectedNodeId?: number | string;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  nodes,
  onSelectNode,
  selectedNodeId
}) => {
  const verifiedCount = nodes.filter((n) => n.status === 'verified').length;
  const defenseCount = nodes.filter((n) => n.status === 'defense_required').length;
  const percentVerified = nodes.length > 0 ? Math.round((verifiedCount / nodes.length) * 100) : 0;

  const getStatusBadge = (status: KnowledgeNode['status']) => {
    switch (status) {
      case 'verified':
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Verified
          </span>
        );
      case 'defense_required':
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-full animate-pulse">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Defense Required
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Pending Defense
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-800">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">Concept Knowledge Graph</h4>
            <p className="text-[11px] text-slate-500">Real-time Socratic verification status</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-emerald-800">{percentVerified}% Mastered</span>
          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full bg-emerald-600 transition-all duration-500"
              style={{ width: `${percentVerified}%` }}
            />
          </div>
        </div>
      </div>

      {/* Nodes Visual Flow / Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {nodes.map((node, index) => {
          const isSelected = selectedNodeId === node.id;
          return (
            <div
              key={node.id}
              onClick={() => onSelectNode && onSelectNode(node)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                node.status === 'defense_required'
                  ? 'border-amber-300 bg-amber-50/40 shadow-xs'
                  : node.status === 'verified'
                  ? 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300'
                  : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-50'
              } ${isSelected ? 'ring-2 ring-emerald-700/30' : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 text-[10px] flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  {node.name}
                </span>
                {getStatusBadge(node.status)}
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                {node.status === 'verified'
                  ? 'Concept defense accepted; reasoning substantiated.'
                  : node.status === 'defense_required'
                  ? 'Flagged for Socratic interrogation challenge.'
                  : 'Pending assignment execution and defense.'}
              </p>
            </div>
          );
        })}
      </div>

      {defenseCount > 0 && (
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-center justify-between">
          <span className="font-medium">
            ⚠ {defenseCount} concept node requires Socratic interrogation defense before final verification.
          </span>
        </div>
      )}
    </div>
  );
};
