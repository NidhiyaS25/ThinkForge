'use client';

import React from 'react';
import { GraphNode, GraphEdge } from '../../lib/graphAlgorithms';
import { SparkEffect } from './SparkEffect';

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  sourceNodeId: string;
  destNodeId: string;
  currentNodeId: string | null;
  visitedNodeIds: Set<string>;
  candidateNodeIds: Set<string>;
  pathEdgeIds: Set<string>;
  relaxedEdgeIds: Set<string>;
  selectedEdgeId: string | null;
  distances: Record<string, number>;
  onNodeClick: (nodeId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
  interactive?: boolean;
  reconstructedPath?: string[];
  sparkNodeId?: string | null;
  onSparkComplete?: () => void;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  sourceNodeId,
  destNodeId,
  currentNodeId,
  visitedNodeIds,
  candidateNodeIds,
  pathEdgeIds,
  relaxedEdgeIds,
  selectedEdgeId,
  distances,
  onNodeClick,
  onEdgeClick,
  interactive = true,
  reconstructedPath = [],
  sparkNodeId = null,
  onSparkComplete
}) => {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Find spark target coordinate
  const sparkTargetNode = sparkNodeId ? nodeMap.get(sparkNodeId) : null;

  return (
    <div className="relative w-full bg-slate-900/90 rounded-2xl border border-slate-700/80 p-2 sm:p-4 shadow-inner overflow-hidden select-none">
      {/* Background Subtle Grid Texture */}
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none">
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#64D8B8" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Main Interactive SVG */}
      <svg
        viewBox="0 0 620 380"
        className="w-full h-auto max-h-[460px] drop-shadow-md"
        style={{ minHeight: '260px' }}
      >
        {/* Defs for arrowheads & glow filters */}
        <defs>
          <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Directional Arrowheads */}
          <marker
            id="path-arrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#10B981" />
          </marker>
          <marker
            id="path-arrow-active"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#34D399" filter="url(#glow-green)" />
          </marker>
        </defs>

        {/* 1. BASE EDGES LAYER */}
        <g id="edges">
          {edges.map((edge) => {
            const uNode = nodeMap.get(edge.u);
            const vNode = nodeMap.get(edge.v);
            if (!uNode || !vNode) return null;

            const isInPath = pathEdgeIds.has(edge.id);
            const isRelaxed = relaxedEdgeIds.has(edge.id);
            const isSelected = selectedEdgeId === edge.id;

            // Midpoint for weight badge
            const midX = (uNode.x + vNode.x) / 2;
            const midY = (uNode.y + vNode.y) / 2;

            // Stroke styling
            let strokeColor = '#475569'; // slate-600
            let strokeWidth = 3;
            let filter = undefined;

            if (isInPath) {
              strokeColor = '#10B981'; // emerald-500
              strokeWidth = 4.5;
              filter = 'url(#glow-green)';
            } else if (isSelected) {
              strokeColor = '#F59E0B'; // amber-500
              strokeWidth = 4;
              filter = 'url(#glow-gold)';
            } else if (isRelaxed) {
              strokeColor = '#38BDF8'; // sky-400
              strokeWidth = 3.5;
            }

            return (
              <g key={edge.id} className="transition-all duration-300">
                {/* Edge line */}
                <line
                  x1={uNode.x}
                  y1={uNode.y}
                  x2={vNode.x}
                  y2={vNode.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  filter={filter}
                  className={`transition-all duration-300 ${
                    onEdgeClick ? 'cursor-pointer hover:stroke-amber-400' : ''
                  }`}
                  onClick={() => onEdgeClick && onEdgeClick(edge.id)}
                />

                {/* Visible Numerical Weight Capsule */}
                <g
                  transform={`translate(${midX}, ${midY})`}
                  className={`${onEdgeClick ? 'cursor-pointer hover:scale-110' : ''} transition-transform`}
                  onClick={() => onEdgeClick && onEdgeClick(edge.id)}
                >
                  <rect
                    x="-14"
                    y="-11"
                    width="28"
                    height="22"
                    rx="6"
                    fill={isInPath ? '#064E3B' : isSelected ? '#78350F' : '#0F172A'}
                    stroke={isInPath ? '#34D399' : isSelected ? '#FBBF24' : '#475569'}
                    strokeWidth="1.5"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fill={isInPath ? '#A7F3D0' : isSelected ? '#FDE68A' : '#E2E8F0'}
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {edge.weight}
                  </text>
                </g>
              </g>
            );
          })}
        </g>

        {/* 2. DIRECTIONAL ANIMATED PATH ARROWS & PARTICLES LAYER */}
        <g id="directional-path">
          {reconstructedPath.length >= 2 &&
            reconstructedPath.slice(0, -1).map((uId, idx) => {
              const vId = reconstructedPath[idx + 1];
              const uNode = nodeMap.get(uId);
              const vNode = nodeMap.get(vId);
              if (!uNode || !vNode) return null;

              const dx = vNode.x - uNode.x;
              const dy = vNode.y - uNode.y;
              const dist = Math.hypot(dx, dy);
              if (dist <= 0) return null;

              const ux = dx / dist;
              const uy = dy / dist;

              // Offset arrow slightly from node borders (node radius = 22)
              const startX = uNode.x + ux * 23;
              const startY = uNode.y + uy * 23;
              const endX = vNode.x - ux * 26;
              const endY = vNode.y - uy * 26;

              return (
                <g key={`dir-path-${uId}-${vId}-${idx}`}>
                  {/* Directional Path Arrow Line */}
                  <line
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke="#34D399"
                    strokeWidth="4"
                    strokeLinecap="round"
                    markerEnd="url(#path-arrow)"
                    filter="url(#glow-green)"
                  />

                  {/* Traveling Luminous Energy Particle */}
                  <circle r="4.5" fill="#6EE7B7" filter="url(#glow-green)">
                    <animateMotion
                      path={`M ${startX} ${startY} L ${endX} ${endY}`}
                      dur="1.2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              );
            })}
        </g>

        {/* 3. NODES LAYER */}
        <g id="nodes">
          {nodes.map((node) => {
            const isSource = node.id === sourceNodeId;
            const isDest = node.id === destNodeId;
            const isCurrent = node.id === currentNodeId;
            const isVisited = visitedNodeIds?.has(node.id) ?? false;
            const isCandidate = candidateNodeIds?.has(node.id) ?? false;
            const isInReconstructed = reconstructedPath.includes(node.id);
            const dist = distances?.[node.id];
            const distLabel = dist === undefined || dist === null || dist === Infinity ? '∞' : dist.toString();

            // Node visual styling
            let circleFill = '#1E293B'; // slate-800
            let circleStroke = '#64748B'; // slate-500
            let strokeWidth = 2.5;

            if (isCurrent) {
              circleFill = '#0F766E'; // teal-700
              circleStroke = '#2DD4BF'; // teal-400
              strokeWidth = 4;
            } else if (isInReconstructed) {
              circleFill = '#065F46'; // emerald-800
              circleStroke = '#34D399'; // emerald-400
              strokeWidth = 4;
            } else if (isVisited) {
              circleFill = '#064E3B'; // dark emerald
              circleStroke = '#10B981'; // emerald-500
              strokeWidth = 3;
            } else if (isCandidate) {
              circleFill = '#0369A1'; // sky-700
              circleStroke = '#38BDF8'; // sky-400
              strokeWidth = 3;
            }

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => interactive && onNodeClick(node.id)}
                className={`transition-transform duration-200 ${
                  interactive ? 'cursor-pointer hover:scale-110' : ''
                }`}
              >
                {/* Active current pulsing aura */}
                {isCurrent && (
                  <circle
                    r="29"
                    fill="none"
                    stroke="#2DD4BF"
                    strokeWidth="2"
                    opacity="0.8"
                    className="animate-ping"
                  />
                )}

                {/* Base Node Circle */}
                <circle
                  r="22"
                  fill={circleFill}
                  stroke={circleStroke}
                  strokeWidth={strokeWidth}
                  className="transition-colors duration-300"
                />

                {/* Node ID Label */}
                <text
                  x="0"
                  y="-2"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="13"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {node.id}
                </text>

                {/* Tentative Distance Badge directly beneath node */}
                <g transform="translate(0, 12)">
                  <rect
                    x="-13"
                    y="1"
                    width="26"
                    height="14"
                    rx="4"
                    fill="#0F172A"
                    stroke={isVisited ? '#10B981' : isCandidate ? '#38BDF8' : '#64748B'}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="11"
                    textAnchor="middle"
                    fill={isVisited ? '#6EE7B7' : '#E2E8F0'}
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {distLabel}
                  </text>
                </g>

                {/* Start / Target role pills above node */}
                {isSource && (
                  <g transform="translate(0, -28)">
                    <rect x="-20" y="-7" width="40" height="14" rx="4" fill="#047857" />
                    <text x="0" y="3" textAnchor="middle" fill="#A7F3D0" fontSize="8" fontWeight="bold">
                      START
                    </text>
                  </g>
                )}
                {isDest && (
                  <g transform="translate(0, -28)">
                    <rect x="-22" y="-7" width="44" height="14" rx="4" fill="#B91C1C" />
                    <text x="0" y="3" textAnchor="middle" fill="#FECACA" fontSize="8" fontWeight="bold">
                      TARGET
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* 4. SPARK EFFECTS LAYER */}
        {sparkTargetNode && (
          <SparkEffect
            x={sparkTargetNode.x}
            y={sparkTargetNode.y}
            active={true}
            onComplete={onSparkComplete}
          />
        )}
      </svg>

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-300 font-medium px-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse"></span>
            Current Node
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Finalized / Visited
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
            Candidate Neighbor
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-1 bg-emerald-400 rounded"></span>
            Directional Path & Particle
          </span>
          <span className="text-slate-400">Click nodes or edges to execute steps</span>
        </div>
      </div>
    </div>
  );
};
