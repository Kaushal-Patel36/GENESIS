'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';

// =============================================================================
// TYPES
// =============================================================================
interface PathwayDisruption {
    pathway_id: string;
    pathway_name: string;
    disruption_score: number;
    affected_genes: string[];
    centrality_shift: number;
    heat_accumulation: number;
}

interface TemporalStage {
    stage: string;
    time_label: string;
    active_pathways: string[];
    cascade_genes: string[];
    network_instability: number;
}

interface CascadeNodeData {
    gene: string;
    heat_score: number;
    is_variant_source: boolean;
    pathways: string[];
    influence_score: number;
}

interface CascadeEdgeData {
    source: string;
    target: string;
    weight: number;
    pathway: string;
    mechanism: string;
}

interface CascadeData {
    gene: string;
    disrupted_pathways: PathwayDisruption[];
    temporal_stages: TemporalStage[];
    cascade_nodes: CascadeNodeData[];
    cascade_edges: CascadeEdgeData[];
    overall_instability: number;
    clinical_summary: string;
    treatment_hints: string[];
}

// =============================================================================
// SECTION 1: Pathway Disruption Heatmap
// =============================================================================
function PathwayHeatmap({ pathways }: { pathways: PathwayDisruption[] }) {
    const [animProgress, setAnimProgress] = useState(0);

    useEffect(() => {
        let frame: number;
        let start: number | null = null;
        const duration = 1200;
        const animate = (ts: number) => {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            setAnimProgress(1 - Math.pow(1 - progress, 3));
            if (progress < 1) frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, []);

    const top = pathways.slice(0, 8);
    const barH = 28;
    const gap = 6;
    const leftPad = 210;
    const rightPad = 60;
    const svgW = 640;
    const svgH = top.length * (barH + gap) + 30;

    const getColor = (score: number) => {
        if (score > 0.7) return '#ef4444';
        if (score > 0.5) return '#f59e0b';
        if (score > 0.3) return '#eab308';
        return '#22c55e';
    };

    return (
        <div style={{
            background: 'rgba(15,23,42,0.6)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 12,
            padding: '18px 20px',
        }}>
            <h3 style={{ color: '#e2e8f0', margin: '0 0 14px 0', fontSize: 15, fontWeight: 600 }}>
                🔥 Pathway Disruption Scores
            </h3>
            <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: 'visible' }}>
                <defs>
                    <linearGradient id="barGrad-red" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#f87171" stopOpacity="0.7" />
                    </linearGradient>
                    <linearGradient id="barGrad-amber" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.7" />
                    </linearGradient>
                    <filter id="barGlow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                {top.map((pw, i) => {
                    const y = i * (barH + gap);
                    const maxBarW = svgW - leftPad - rightPad;
                    const barW = pw.disruption_score * maxBarW * animProgress;
                    const col = getColor(pw.disruption_score);
                    return (
                        <g key={pw.pathway_id}>
                            {/* Label */}
                            <text
                                x={leftPad - 8}
                                y={y + barH / 2 + 1}
                                textAnchor="end"
                                fill="#94a3b8"
                                fontSize={11}
                                fontFamily="Inter, sans-serif"
                            >
                                {pw.pathway_name.length > 32
                                    ? pw.pathway_name.slice(0, 30) + '…'
                                    : pw.pathway_name}
                            </text>
                            {/* Background track */}
                            <rect
                                x={leftPad}
                                y={y + 2}
                                width={maxBarW}
                                height={barH - 4}
                                rx={4}
                                fill="rgba(30,41,59,0.6)"
                            />
                            {/* Filled bar */}
                            <rect
                                x={leftPad}
                                y={y + 2}
                                width={barW}
                                height={barH - 4}
                                rx={4}
                                fill={col}
                                opacity={0.85}
                                filter={pw.disruption_score > 0.6 ? 'url(#barGlow)' : undefined}
                            />
                            {/* Score label */}
                            <text
                                x={leftPad + barW + 8}
                                y={y + barH / 2 + 1}
                                fill={col}
                                fontSize={12}
                                fontWeight={600}
                                fontFamily="JetBrains Mono, monospace"
                                dominantBaseline="middle"
                            >
                                {(pw.disruption_score * 100 * animProgress).toFixed(0)}%
                            </text>
                            {/* Affected genes pills */}
                            {pw.affected_genes.slice(0, 3).map((gene, gi) => (
                                <text
                                    key={gene}
                                    x={leftPad + maxBarW + rightPad - 5 - gi * 0}
                                    y={y + barH - 2}
                                    textAnchor="end"
                                    fill="rgba(148,163,184,0.5)"
                                    fontSize={8}
                                >
                                    {/* genes shown in tooltip only */}
                                </text>
                            ))}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

// =============================================================================
// SECTION 2: Network Cascade Graph
// =============================================================================
function CascadeGraph({
    nodes,
    edges,
    geneSymbol,
}: {
    nodes: CascadeNodeData[];
    edges: CascadeEdgeData[];
    geneSymbol: string;
}) {
    const [hovered, setHovered] = useState<string | null>(null);

    // Force-directed layout (simplified)
    const layout = useMemo(() => {
        if (!nodes.length) return [];

        const cx = 360, cy = 200;
        const positions: { gene: string; x: number; y: number }[] = [];

        // Place variant source at center
        const sorted = [...nodes].sort((a, b) => {
            if (a.is_variant_source) return -1;
            if (b.is_variant_source) return 1;
            return b.heat_score - a.heat_score;
        });

        sorted.forEach((node, i) => {
            if (node.is_variant_source) {
                positions.push({ gene: node.gene, x: cx, y: cy });
            } else {
                const angle = (i / (sorted.length - 1 || 1)) * Math.PI * 2 - Math.PI / 2;
                const radius = 100 + (1 - node.heat_score) * 80;
                positions.push({
                    gene: node.gene,
                    x: cx + Math.cos(angle) * radius,
                    y: cy + Math.sin(angle) * radius,
                });
            }
        });
        return positions;
    }, [nodes]);

    const getPos = useCallback(
        (gene: string) => layout.find((p) => p.gene === gene) || { x: 0, y: 0 },
        [layout]
    );

    const svgW = 720;
    const svgH = 400;

    const getNodeColor = (heat: number, isSource: boolean) => {
        if (isSource) return '#ef4444';
        if (heat > 0.7) return '#f97316';
        if (heat > 0.4) return '#eab308';
        return '#22d3ee';
    };

    return (
        <div style={{
            background: 'rgba(15,23,42,0.6)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 12,
            padding: '18px 20px',
        }}>
            <h3 style={{ color: '#e2e8f0', margin: '0 0 14px 0', fontSize: 15, fontWeight: 600 }}>
                🧬 Network Cascade Graph
            </h3>
            <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: 'visible' }}>
                <defs>
                    <radialGradient id="cascadeGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </radialGradient>
                    <filter id="nodeGlow">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <filter id="edgeGlow">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    {/* Animated particle */}
                    <circle id="particle" r="2.5" fill="#22d3ee" opacity="0.9">
                        <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2s" repeatCount="indefinite" />
                    </circle>
                </defs>

                {/* Background glow at variant source */}
                {nodes.find((n) => n.is_variant_source) && (
                    <circle
                        cx={getPos(geneSymbol).x}
                        cy={getPos(geneSymbol).y}
                        r={60}
                        fill="url(#cascadeGlow)"
                    >
                        <animate attributeName="r" values="50;70;50" dur="3s" repeatCount="indefinite" />
                    </circle>
                )}

                {/* Edges */}
                {edges.map((edge, i) => {
                    const s = getPos(edge.source);
                    const t = getPos(edge.target);
                    const isHighlighted = hovered === edge.source || hovered === edge.target;
                    return (
                        <g key={`edge-${i}`}>
                            <line
                                x1={s.x}
                                y1={s.y}
                                x2={t.x}
                                y2={t.y}
                                stroke={isHighlighted ? '#818cf8' : 'rgba(100,116,139,0.3)'}
                                strokeWidth={edge.weight * 3}
                                filter={isHighlighted ? 'url(#edgeGlow)' : undefined}
                            />
                            {/* Flowing particle */}
                            <circle r="2.5" fill="#22d3ee" opacity="0.8">
                                <animateMotion
                                    dur={`${2 + i * 0.5}s`}
                                    repeatCount="indefinite"
                                    path={`M${s.x},${s.y} L${t.x},${t.y}`}
                                />
                                <animate
                                    attributeName="opacity"
                                    values="0;0.9;0"
                                    dur={`${2 + i * 0.5}s`}
                                    repeatCount="indefinite"
                                />
                            </circle>
                            {/* Mechanism tooltip on hover */}
                            {isHighlighted && edge.mechanism && (
                                <text
                                    x={(s.x + t.x) / 2}
                                    y={(s.y + t.y) / 2 - 10}
                                    fill="#a5b4fc"
                                    fontSize={9}
                                    textAnchor="middle"
                                    fontFamily="Inter, sans-serif"
                                >
                                    {edge.mechanism.length > 40
                                        ? edge.mechanism.slice(0, 38) + '…'
                                        : edge.mechanism}
                                </text>
                            )}
                        </g>
                    );
                })}

                {/* Nodes */}
                {nodes.map((node) => {
                    const pos = getPos(node.gene);
                    const r = 14 + node.influence_score * 30;
                    const col = getNodeColor(node.heat_score, node.is_variant_source);
                    const isHovered = hovered === node.gene;
                    return (
                        <g
                            key={node.gene}
                            onMouseEnter={() => setHovered(node.gene)}
                            onMouseLeave={() => setHovered(null)}
                            style={{ cursor: 'pointer' }}
                        >
                            {/* Pulse for source node */}
                            {node.is_variant_source && (
                                <circle cx={pos.x} cy={pos.y} r={r + 8} fill="none" stroke="#ef4444" strokeWidth={1.5} opacity={0.5}>
                                    <animate attributeName="r" values={`${r + 4};${r + 16};${r + 4}`} dur="2s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
                                </circle>
                            )}
                            <circle
                                cx={pos.x}
                                cy={pos.y}
                                r={isHovered ? r + 3 : r}
                                fill={col}
                                opacity={isHovered ? 0.95 : 0.75}
                                filter="url(#nodeGlow)"
                                style={{ transition: 'r 0.2s, opacity 0.2s' }}
                            />
                            <text
                                x={pos.x}
                                y={pos.y + 1}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="white"
                                fontSize={node.is_variant_source ? 12 : 10}
                                fontWeight={700}
                                fontFamily="JetBrains Mono, Inter, sans-serif"
                            >
                                {node.gene}
                            </text>
                            {/* Heat score label below */}
                            <text
                                x={pos.x}
                                y={pos.y + r + 14}
                                textAnchor="middle"
                                fill={col}
                                fontSize={9}
                                fontFamily="JetBrains Mono, monospace"
                                opacity={0.8}
                            >
                                {(node.heat_score * 100).toFixed(0)}% heat
                            </text>
                            {/* Hover detail card */}
                            {isHovered && (
                                <g>
                                    <rect
                                        x={pos.x + r + 8}
                                        y={pos.y - 40}
                                        width={160}
                                        height={68}
                                        rx={8}
                                        fill="rgba(15,23,42,0.95)"
                                        stroke="rgba(99,102,241,0.4)"
                                        strokeWidth={1}
                                    />
                                    <text x={pos.x + r + 16} y={pos.y - 22} fill="#e2e8f0" fontSize={11} fontWeight={600}>
                                        {node.gene}
                                        {node.is_variant_source ? ' (VARIANT)' : ''}
                                    </text>
                                    <text x={pos.x + r + 16} y={pos.y - 6} fill="#94a3b8" fontSize={9}>
                                        Heat: {(node.heat_score * 100).toFixed(1)}% • Influence: {node.influence_score.toFixed(3)}
                                    </text>
                                    <text x={pos.x + r + 16} y={pos.y + 10} fill="#94a3b8" fontSize={9}>
                                        Pathways: {node.pathways.length}
                                    </text>
                                    <text x={pos.x + r + 16} y={pos.y + 22} fill="#818cf8" fontSize={8}>
                                        {node.pathways[0] || '—'}
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

// =============================================================================
// SECTION 3: Temporal Progression
// =============================================================================
function TemporalProgression({ stages }: { stages: TemporalStage[] }) {
    const [activeStage, setActiveStage] = useState(0);
    const [animProgress, setAnimProgress] = useState(0);

    useEffect(() => {
        setAnimProgress(0);
        let frame: number;
        let start: number | null = null;
        const duration = 800;
        const animate = (ts: number) => {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            setAnimProgress(1 - Math.pow(1 - progress, 3));
            if (progress < 1) frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [activeStage]);

    // Auto-cycle through stages
    useEffect(() => {
        const timer = setInterval(() => {
            setActiveStage((prev) => (prev + 1) % stages.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [stages.length]);

    const stageColors: Record<string, string> = {
        early: '#22c55e',
        mid: '#f59e0b',
        late: '#ef4444',
    };

    const stageIcons: Record<string, string> = {
        early: '🟢',
        mid: '🟡',
        late: '🔴',
    };

    if (!stages.length) return null;

    const current = stages[activeStage];
    const col = stageColors[current.stage] || '#94a3b8';

    return (
        <div style={{
            background: 'rgba(15,23,42,0.6)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 12,
            padding: '18px 20px',
        }}>
            <h3 style={{ color: '#e2e8f0', margin: '0 0 14px 0', fontSize: 15, fontWeight: 600 }}>
                ⏱️ Temporal Disease Progression
            </h3>

            {/* Stage selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {stages.map((s, i) => (
                    <button
                        key={s.stage}
                        onClick={() => setActiveStage(i)}
                        style={{
                            flex: 1,
                            padding: '10px 14px',
                            background: activeStage === i
                                ? `linear-gradient(135deg, ${stageColors[s.stage]}22, ${stageColors[s.stage]}11)`
                                : 'rgba(30,41,59,0.5)',
                            border: activeStage === i
                                ? `1px solid ${stageColors[s.stage]}66`
                                : '1px solid rgba(51,65,85,0.5)',
                            borderRadius: 8,
                            color: activeStage === i ? stageColors[s.stage] : '#94a3b8',
                            cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: 12,
                            fontWeight: activeStage === i ? 600 : 400,
                            transition: 'all 0.3s ease',
                        }}
                    >
                        <div style={{ fontSize: 16, marginBottom: 4 }}>{stageIcons[s.stage]}</div>
                        <div style={{ textTransform: 'uppercase', letterSpacing: 1 }}>{s.stage}</div>
                        <div style={{ fontSize: 10, opacity: 0.7 }}>{s.time_label}</div>
                    </button>
                ))}
            </div>

            {/* Stage details */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                opacity: animProgress,
                transform: `translateY(${(1 - animProgress) * 10}px)`,
                transition: 'opacity 0.3s, transform 0.3s',
            }}>
                {/* Network instability gauge */}
                <div style={{
                    background: 'rgba(30,41,59,0.6)',
                    borderRadius: 8,
                    padding: 14,
                    border: `1px solid ${col}33`,
                }}>
                    <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 8 }}>Network Instability</div>
                    <div style={{ position: 'relative', height: 8, background: 'rgba(51,65,85,0.6)', borderRadius: 4 }}>
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '100%',
                            width: `${current.network_instability * 100 * animProgress}%`,
                            background: `linear-gradient(90deg, ${col}cc, ${col}88)`,
                            borderRadius: 4,
                            boxShadow: `0 0 8px ${col}44`,
                            transition: 'width 0.8s ease',
                        }} />
                    </div>
                    <div style={{
                        color: col,
                        fontSize: 22,
                        fontWeight: 700,
                        marginTop: 8,
                        fontFamily: 'JetBrains Mono, monospace',
                    }}>
                        {(current.network_instability * 100 * animProgress).toFixed(1)}%
                    </div>
                </div>

                {/* Affected genes */}
                <div style={{
                    background: 'rgba(30,41,59,0.6)',
                    borderRadius: 8,
                    padding: 14,
                    border: `1px solid ${col}33`,
                }}>
                    <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 8 }}>
                        Cascade Genes ({current.cascade_genes.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {current.cascade_genes.slice(0, 8).map((gene) => (
                            <span
                                key={gene}
                                style={{
                                    background: `${col}22`,
                                    color: col,
                                    border: `1px solid ${col}44`,
                                    borderRadius: 4,
                                    padding: '2px 8px',
                                    fontSize: 10,
                                    fontWeight: 600,
                                    fontFamily: 'JetBrains Mono, monospace',
                                }}
                            >
                                {gene}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Active pathways */}
            <div style={{ marginTop: 12 }}>
                <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6 }}>
                    Active Disrupted Pathways
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {current.active_pathways.slice(0, 5).map((pid) => (
                        <span
                            key={pid}
                            style={{
                                background: 'rgba(99,102,241,0.1)',
                                color: '#a5b4fc',
                                border: '1px solid rgba(99,102,241,0.3)',
                                borderRadius: 4,
                                padding: '2px 8px',
                                fontSize: 9,
                                fontFamily: 'JetBrains Mono, monospace',
                            }}
                        >
                            {pid}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// SECTION 4: Clinical Interpretation
// =============================================================================
function ClinicalInterpretation({
    summary,
    hints,
    instability,
}: {
    summary: string;
    hints: string[];
    instability: number;
}) {
    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: 12,
            padding: '18px 20px',
        }}>
            <h3 style={{ color: '#e2e8f0', margin: '0 0 12px 0', fontSize: 15, fontWeight: 600 }}>
                🩺 Clinical Interpretation
            </h3>
            <p style={{
                color: '#cbd5e1',
                fontSize: 13,
                lineHeight: 1.6,
                margin: '0 0 14px 0',
            }}>
                {summary}
            </p>

            {/* Overall instability badge */}
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: instability > 0.5 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                color: instability > 0.5 ? '#fca5a5' : '#86efac',
                border: `1px solid ${instability > 0.5 ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
                borderRadius: 6,
                padding: '4px 12px',
                fontSize: 11,
                fontWeight: 600,
                marginBottom: 14,
            }}>
                <span style={{ fontSize: 14 }}>{instability > 0.5 ? '⚠️' : '✅'}</span>
                Overall Network Instability: {(instability * 100).toFixed(1)}%
            </div>

            {/* Treatment hints */}
            {hints.length > 0 && (
                <>
                    <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Treatment Relevance
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {hints.map((hint, i) => (
                            <div
                                key={i}
                                style={{
                                    background: 'rgba(30,41,59,0.5)',
                                    border: '1px solid rgba(51,65,85,0.4)',
                                    borderRadius: 6,
                                    padding: '8px 12px',
                                    fontSize: 11,
                                    color: '#94a3b8',
                                    lineHeight: 1.5,
                                }}
                            >
                                <span style={{ color: '#818cf8', marginRight: 6 }}>💊</span>
                                {hint}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// =============================================================================
// MAIN EXPORT: CascadeView
// =============================================================================
export function CascadeView({ data }: { data: CascadeData }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Clinical summary at top */}
            <ClinicalInterpretation
                summary={data.clinical_summary}
                hints={data.treatment_hints}
                instability={data.overall_instability}
            />

            {/* Two-column layout: Heatmap + Graph */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: data.cascade_nodes.length > 0 ? '1fr 1fr' : '1fr',
                gap: 16,
            }}>
                <PathwayHeatmap pathways={data.disrupted_pathways} />
                {data.cascade_nodes.length > 0 && (
                    <CascadeGraph
                        nodes={data.cascade_nodes}
                        edges={data.cascade_edges}
                        geneSymbol={data.gene}
                    />
                )}
            </div>

            {/* Temporal progression */}
            <TemporalProgression stages={data.temporal_stages} />
        </div>
    );
}
