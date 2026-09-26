'use client';

import React, { useMemo } from 'react';

interface NeuralPipelineVizProps {
    modelsActive?: string[];
    nlpCount?: number;
    variantScore?: number;
    phenoSim?: number;
    gnnScore?: number;
}

export function NeuralPipelineViz({
    modelsActive = [],
    nlpCount = 0,
    variantScore = 0,
    phenoSim = 0,
    gnnScore = 0,
}: NeuralPipelineVizProps) {
    const nodes = useMemo(() => [
        { id: 'input', label: 'Patient Data', x: 60, y: 80, icon: '📋', color: '#94a3b8', active: true, sub: 'Notes + HPO + VCF' },
        { id: 'nlp', label: 'Clinical NLP', x: 240, y: 40, icon: '🔤', color: '#22d3ee', active: nlpCount > 0, sub: `${nlpCount} terms extracted` },
        { id: 'variant', label: 'Variant Predictor', x: 420, y: 40, icon: '🧬', color: '#a78bfa', active: variantScore > 0, sub: `${(variantScore * 100).toFixed(0)}% pathogenic` },
        { id: 'pheno', label: 'Phenotype Network', x: 240, y: 130, icon: '🕸️', color: '#34d399', active: phenoSim > 0, sub: `${(phenoSim * 100).toFixed(0)}% similarity` },
        { id: 'gnn', label: 'GNN Reasoner', x: 420, y: 130, icon: '🧠', color: '#facc15', active: gnnScore > 0, sub: `${(gnnScore * 100).toFixed(0)}% link score` },
        { id: 'fusion', label: 'Bayesian Fusion', x: 600, y: 80, icon: '⚡', color: '#f472b6', active: true, sub: 'Final diagnosis' },
    ], [nlpCount, variantScore, phenoSim, gnnScore]);

    const connections = [
        { from: 'input', to: 'nlp' },
        { from: 'input', to: 'pheno' },
        { from: 'nlp', to: 'variant' },
        { from: 'nlp', to: 'fusion' },
        { from: 'pheno', to: 'gnn' },
        { from: 'variant', to: 'fusion' },
        { from: 'pheno', to: 'fusion' },
        { from: 'gnn', to: 'fusion' },
    ];

    const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

    return (
        <div className="glass-card rounded-xl p-4 mb-6 overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Neural Pipeline</div>
                <div className="flex-1 h-px bg-border/30" />
                <div className="text-[10px] text-muted-foreground font-mono">4 models × multi-modal fusion</div>
            </div>

            <svg viewBox="0 0 700 170" className="w-full" style={{ maxHeight: 200 }}>
                <defs>
                    {/* Animated dash pattern for flowing particles */}
                    <style>{`
            .flow-line {
              stroke-dasharray: 6 8;
              animation: flowDash 1.5s linear infinite;
            }
            @keyframes flowDash {
              to { stroke-dashoffset: -28; }
            }
            .node-pulse {
              animation: nodePulse 2s ease-in-out infinite;
            }
            @keyframes nodePulse {
              0%, 100% { opacity: 0.15; r: 28; }
              50% { opacity: 0.3; r: 34; }
            }
          `}</style>

                    {nodes.map(n => (
                        <filter key={n.id} id={`glow-${n.id}`}>
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    ))}
                </defs>

                {/* Connection lines with flowing particles */}
                {connections.map((conn, i) => {
                    const from = nodeMap[conn.from];
                    const to = nodeMap[conn.to];
                    if (!from || !to) return null;
                    const isActive = from.active && to.active;

                    return (
                        <g key={i}>
                            {/* Base line */}
                            <line
                                x1={from.x} y1={from.y}
                                x2={to.x} y2={to.y}
                                stroke={isActive ? 'rgba(148,163,184,0.15)' : 'rgba(148,163,184,0.06)'}
                                strokeWidth="2"
                            />
                            {/* Animated flowing line */}
                            {isActive && (
                                <line
                                    x1={from.x} y1={from.y}
                                    x2={to.x} y2={to.y}
                                    stroke={to.color}
                                    strokeWidth="2"
                                    className="flow-line"
                                    opacity="0.5"
                                />
                            )}
                        </g>
                    );
                })}

                {/* Nodes */}
                {nodes.map((n) => (
                    <g key={n.id}>
                        {/* Outer glow pulse */}
                        {n.active && (
                            <circle cx={n.x} cy={n.y} r="28" fill={n.color} className="node-pulse" />
                        )}
                        {/* Node circle */}
                        <circle
                            cx={n.x} cy={n.y} r="22"
                            fill={n.active ? 'rgba(15,23,42,0.9)' : 'rgba(15,23,42,0.5)'}
                            stroke={n.active ? n.color : 'rgba(148,163,184,0.2)'}
                            strokeWidth={n.active ? 2 : 1}
                            filter={n.active ? `url(#glow-${n.id})` : undefined}
                        />
                        {/* Icon */}
                        <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="middle" className="text-[14px]">
                            {n.icon}
                        </text>
                        {/* Label */}
                        <text
                            x={n.x} y={n.y + 36}
                            textAnchor="middle"
                            className="text-[9px] font-bold"
                            fill={n.active ? n.color : 'rgba(148,163,184,0.3)'}
                        >
                            {n.label}
                        </text>
                        {/* Sub-label */}
                        <text
                            x={n.x} y={n.y + 47}
                            textAnchor="middle"
                            className="text-[7px] font-mono"
                            fill="rgba(148,163,184,0.4)"
                        >
                            {n.sub}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
}
