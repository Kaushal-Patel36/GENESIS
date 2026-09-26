'use client';

import React, { useEffect, useState } from 'react';

interface EvidenceRadarChartProps {
    evidence: { source: string; score_contribution: number }[];
    maxScore?: number;
}

const AXES = [
    { key: 'hpo', label: 'Phenotype', color: '#22d3ee' },
    { key: 'pathway', label: 'Pathway', color: '#a78bfa' },
    { key: 'temporal', label: 'Temporal', color: '#f472b6' },
    { key: 'literature', label: 'Literature', color: '#34d399' },
    { key: 'variant', label: 'Variant', color: '#fb923c' },
    { key: 'phenotype_sim', label: 'Neural Pheno', color: '#818cf8' },
    { key: 'gnn', label: 'GNN', color: '#facc15' },
    { key: 'perturbation', label: 'Perturbation', color: '#ef4444' },
];

function mapSourceToAxis(source: string): string {
    const s = source.toLowerCase();
    if (s.includes('hpo') || s.includes('phenotype analysis')) return 'hpo';
    if (s.includes('perturbation') || s.includes('network diffusion')) return 'perturbation';
    if (s.includes('pathway') || s.includes('reactome')) return 'pathway';
    if (s.includes('temporal')) return 'temporal';
    if (s.includes('literature') || s.includes('pubmed')) return 'literature';
    if (s.includes('clinvar') || s.includes('variant')) return 'variant';
    if (s.includes('neural phenotype') || s.includes('embedding')) return 'phenotype_sim';
    if (s.includes('gnn') || s.includes('graph neural')) return 'gnn';
    return 'pathway';
}

export function EvidenceRadarChart({ evidence, maxScore = 20 }: EvidenceRadarChartProps) {
    const [animProgress, setAnimProgress] = useState(0);

    useEffect(() => {
        let frame: number;
        let start: number | null = null;
        const duration = 1200;
        const animate = (ts: number) => {
            if (!start) start = ts;
            const elapsed = ts - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            setAnimProgress(1 - Math.pow(1 - progress, 3));
            if (progress < 1) frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, []);

    // Aggregate scores per axis
    const scores: Record<string, number> = {};
    AXES.forEach(a => { scores[a.key] = 0; });
    evidence.forEach(ev => {
        const axis = mapSourceToAxis(ev.source);
        scores[axis] = (scores[axis] || 0) + ev.score_contribution;
    });

    const cx = 180, cy = 180, radius = 140;
    const numAxes = AXES.length;

    // Generate points for each axis
    const getPoint = (index: number, value: number) => {
        const angle = (index / numAxes) * Math.PI * 2 - Math.PI / 2;
        const r = (value / maxScore) * radius * animProgress;
        return {
            x: cx + Math.cos(angle) * r,
            y: cy + Math.sin(angle) * r,
        };
    };

    const getAxisEnd = (index: number) => {
        const angle = (index / numAxes) * Math.PI * 2 - Math.PI / 2;
        return {
            x: cx + Math.cos(angle) * radius,
            y: cy + Math.sin(angle) * radius,
            labelX: cx + Math.cos(angle) * (radius + 28),
            labelY: cy + Math.sin(angle) * (radius + 28),
        };
    };

    // Build polygon points
    const polygonPoints = AXES.map((a, i) => {
        const val = Math.min(scores[a.key] || 0, maxScore);
        const pt = getPoint(i, val);
        return `${pt.x},${pt.y}`;
    }).join(' ');

    // Ring values for concentric circles
    const rings = [0.25, 0.5, 0.75, 1.0];

    return (
        <div className="relative">
            <svg viewBox="0 0 360 360" className="w-full h-full max-w-[420px] mx-auto">
                <defs>
                    <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0.08" />
                    </radialGradient>
                    <filter id="radarGlow">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="dotGlow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Concentric ring guides */}
                {rings.map((r, i) => (
                    <polygon
                        key={i}
                        points={AXES.map((_, j) => {
                            const angle = (j / numAxes) * Math.PI * 2 - Math.PI / 2;
                            const px = cx + Math.cos(angle) * radius * r;
                            const py = cy + Math.sin(angle) * radius * r;
                            return `${px},${py}`;
                        }).join(' ')}
                        fill="none"
                        stroke="rgba(148,163,184,0.12)"
                        strokeWidth="1"
                    />
                ))}

                {/* Axis lines */}
                {AXES.map((a, i) => {
                    const end = getAxisEnd(i);
                    return (
                        <line
                            key={i}
                            x1={cx} y1={cy}
                            x2={end.x} y2={end.y}
                            stroke="rgba(148,163,184,0.15)"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* Data polygon */}
                <polygon
                    points={polygonPoints}
                    fill="url(#radarFill)"
                    stroke="#22d3ee"
                    strokeWidth="2"
                    filter="url(#radarGlow)"
                    style={{
                        transition: 'all 0.3s ease',
                    }}
                />

                {/* Data point dots */}
                {AXES.map((a, i) => {
                    const val = Math.min(scores[a.key] || 0, maxScore);
                    const pt = getPoint(i, val);
                    return (
                        <g key={i}>
                            <circle
                                cx={pt.x} cy={pt.y} r="5"
                                fill={a.color}
                                filter="url(#dotGlow)"
                                style={{ transition: 'all 0.3s ease' }}
                            />
                            <circle
                                cx={pt.x} cy={pt.y} r="2.5"
                                fill="white"
                                opacity="0.9"
                            />
                        </g>
                    );
                })}

                {/* Labels */}
                {AXES.map((a, i) => {
                    const end = getAxisEnd(i);
                    const val = scores[a.key] || 0;
                    return (
                        <g key={i}>
                            <text
                                x={end.labelX}
                                y={end.labelY}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-[10px] font-medium"
                                fill={a.color}
                            >
                                {a.label}
                            </text>
                            <text
                                x={end.labelX}
                                y={end.labelY + 13}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-[9px] font-mono"
                                fill="rgba(148,163,184,0.6)"
                            >
                                +{val.toFixed(1)}
                            </text>
                        </g>
                    );
                })}

                {/* Center label */}
                <text x={cx} y={cy - 6} textAnchor="middle" className="text-[11px] font-bold" fill="#22d3ee">
                    Evidence
                </text>
                <text x={cx} y={cy + 8} textAnchor="middle" className="text-[9px]" fill="rgba(148,163,184,0.5)">
                    Fingerprint
                </text>
            </svg>
        </div>
    );
}
