'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, TrendingDown, TrendingUp, Minus, Dna, Zap, Layers, Target, ChevronDown, ChevronUp, Atom } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface EpistaVariant {
    id: string;
    position: number;
    effect: string;
    domain: string;
}

interface FeatureChange {
    feature_index: number;
    feature_name: string;
    single_activation: number;
    pair_activation: number;
    delta: number;
    direction: string;
}

interface MotifImpact {
    motif_sequence: string;
    motif_name: string;
    function: string;
    conservation_score: number;
    interaction_status: string;
    impact_score: number;
}

interface HeatmapEntry {
    feature: string;
    variant_1_activation: number;
    variant_2_activation: number;
    pair_activation: number;
    interaction_delta: number;
}

interface VariantPair {
    variant_1: EpistaVariant;
    variant_2: EpistaVariant;
    epistasis_score: number;
    classification: string;
    description: string;
    clinical_significance: string;
    feature_changes: FeatureChange[];
    motif_impacts: MotifImpact[];
    heatmap_data: HeatmapEntry[];
}

interface EpistasisData {
    gene: string;
    variant_pairs: VariantPair[];
    overall_epistasis_score: number;
    dominant_interaction_type: string;
    total_pairs_analyzed: number;
    clinical_summary: string;
    model_info: {
        method: string;
        steepness_parameter: number;
        n_features: number;
        scoring_range: string;
        interpretation?: Record<string, string>;
    };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
    if (score < -5) return '#ef4444';
    if (score < -2) return '#f97316';
    if (score < 2) return '#a3a3a3';
    if (score < 5) return '#22d3ee';
    return '#22c55e';
}

function classificationLabel(cls: string): { text: string; icon: React.ReactNode; color: string } {
    switch (cls) {
        case 'negative':
            return { text: 'Loss of Function', icon: <TrendingDown className="w-4 h-4" />, color: '#ef4444' };
        case 'positive':
            return { text: 'Gain of Function', icon: <TrendingUp className="w-4 h-4" />, color: '#22c55e' };
        default:
            return { text: 'Additive / Neutral', icon: <Minus className="w-4 h-4" />, color: '#a3a3a3' };
    }
}

// ─── Epistasis Gauge Component ──────────────────────────────────────────────

function EpistasisGauge({ score, size = 200 }: { score: number; size?: number }) {
    const [animatedAngle, setAnimatedAngle] = useState(0);
    const targetAngle = (score / 10) * 135; // -135 to +135 degrees

    useEffect(() => {
        let frame: number;
        const animate = () => {
            setAnimatedAngle(prev => {
                const diff = targetAngle - prev;
                if (Math.abs(diff) < 0.5) return targetAngle;
                return prev + diff * 0.08;
            });
            frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [targetAngle]);

    const cx = size / 2;
    const cy = size / 2 + 10;
    const r = size / 2 - 20;

    // Draw arc segments
    const arcPath = (startDeg: number, endDeg: number) => {
        const startRad = ((startDeg - 90) * Math.PI) / 180;
        const endRad = ((endDeg - 90) * Math.PI) / 180;
        const x1 = cx + r * Math.cos(startRad);
        const y1 = cy + r * Math.sin(startRad);
        const x2 = cx + r * Math.cos(endRad);
        const y2 = cy + r * Math.sin(endRad);
        const large = endDeg - startDeg > 180 ? 1 : 0;
        return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
    };

    // Needle position
    const needleRad = ((animatedAngle - 90) * Math.PI) / 180;
    const needleLen = r - 15;
    const nx = cx + needleLen * Math.cos(needleRad);
    const ny = cy + needleLen * Math.sin(needleRad);

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto max-w-[220px]">
            {/* Background arc */}
            <path d={arcPath(-135, 135)} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" strokeLinecap="round" />

            {/* Colored segments */}
            <path d={arcPath(-135, -67.5)} fill="none" stroke="#ef4444" strokeWidth="16" strokeLinecap="round" opacity="0.3" />
            <path d={arcPath(-67.5, -22.5)} fill="none" stroke="#f97316" strokeWidth="16" strokeLinecap="round" opacity="0.3" />
            <path d={arcPath(-22.5, 22.5)} fill="none" stroke="#a3a3a3" strokeWidth="16" strokeLinecap="round" opacity="0.3" />
            <path d={arcPath(22.5, 67.5)} fill="none" stroke="#22d3ee" strokeWidth="16" strokeLinecap="round" opacity="0.3" />
            <path d={arcPath(67.5, 135)} fill="none" stroke="#22c55e" strokeWidth="16" strokeLinecap="round" opacity="0.3" />

            {/* Active fill up to needle */}
            {animatedAngle !== 0 && (
                <path
                    d={arcPath(animatedAngle < 0 ? animatedAngle : 0, animatedAngle < 0 ? 0 : animatedAngle)}
                    fill="none"
                    stroke={scoreColor(score)}
                    strokeWidth="16"
                    strokeLinecap="round"
                    opacity="0.8"
                />
            )}

            {/* Labels */}
            <text x={cx - r + 5} y={cy + 30} fill="#ef4444" fontSize="9" textAnchor="start" fontWeight="600">-10</text>
            <text x={cx + r - 5} y={cy + 30} fill="#22c55e" fontSize="9" textAnchor="end" fontWeight="600">+10</text>
            <text x={cx} y={cy + 30} fill="#a3a3a3" fontSize="8" textAnchor="middle">0</text>

            {/* Needle */}
            <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={scoreColor(score)} strokeWidth="3" strokeLinecap="round">
                <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
            </line>
            <circle cx={cx} cy={cy} r="6" fill={scoreColor(score)} />
            <circle cx={cx} cy={cy} r="3" fill="white" />

            {/* Score text */}
            <text x={cx} y={cy - 20} fill="white" fontSize="28" textAnchor="middle" fontWeight="bold">
                {score.toFixed(1)}
            </text>
            <text x={cx} y={cy - 6} fill="rgba(255,255,255,0.5)" fontSize="8" textAnchor="middle" fontWeight="500">
                EPISTASIS SCORE
            </text>
        </svg>
    );
}

// ─── Feature Heatmap Component ──────────────────────────────────────────────

function FeatureHeatmap({ data }: { data: HeatmapEntry[] }) {
    const maxVal = useMemo(() => {
        let m = 0;
        data.forEach(d => {
            m = Math.max(m, Math.abs(d.variant_1_activation), Math.abs(d.variant_2_activation), Math.abs(d.pair_activation));
        });
        return m || 1;
    }, [data]);

    const cellColor = (val: number) => {
        const intensity = Math.min(Math.abs(val) / maxVal, 1);
        if (val > 0) return `rgba(34, 211, 238, ${intensity * 0.8})`;
        if (val < 0) return `rgba(239, 68, 68, ${intensity * 0.8})`;
        return 'rgba(255,255,255,0.02)';
    };

    const deltaColor = (val: number) => {
        const intensity = Math.min(Math.abs(val) / (maxVal * 0.5), 1);
        if (val > 0.1) return `rgba(34, 197, 94, ${0.3 + intensity * 0.5})`;
        if (val < -0.1) return `rgba(239, 68, 68, ${0.3 + intensity * 0.5})`;
        return 'rgba(255,255,255,0.03)';
    };

    return (
        <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                    <tr>
                        <th style={{ padding: '6px 8px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontWeight: 500, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            Feature
                        </th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', color: '#22d3ee', fontWeight: 500, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            Var 1
                        </th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', color: '#a78bfa', fontWeight: 500, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            Var 2
                        </th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', color: '#f59e0b', fontWeight: 500, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            Pair
                        </th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontWeight: 500, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            Δ Interaction
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {data.slice(0, 10).map((entry, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '5px 8px', color: 'rgba(255,255,255,0.7)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {entry.feature}
                            </td>
                            <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                                <span style={{
                                    display: 'inline-block', padding: '2px 8px', borderRadius: 4,
                                    background: cellColor(entry.variant_1_activation), color: 'white', fontFamily: 'monospace',
                                }}>
                                    {entry.variant_1_activation.toFixed(2)}
                                </span>
                            </td>
                            <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                                <span style={{
                                    display: 'inline-block', padding: '2px 8px', borderRadius: 4,
                                    background: cellColor(entry.variant_2_activation), color: 'white', fontFamily: 'monospace',
                                }}>
                                    {entry.variant_2_activation.toFixed(2)}
                                </span>
                            </td>
                            <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                                <span style={{
                                    display: 'inline-block', padding: '2px 8px', borderRadius: 4,
                                    background: cellColor(entry.pair_activation), color: 'white', fontFamily: 'monospace',
                                }}>
                                    {entry.pair_activation.toFixed(2)}
                                </span>
                            </td>
                            <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                                <span style={{
                                    display: 'inline-block', padding: '2px 10px', borderRadius: 4,
                                    background: deltaColor(entry.interaction_delta), color: 'white', fontFamily: 'monospace', fontWeight: 600,
                                }}>
                                    {entry.interaction_delta > 0 ? '+' : ''}{entry.interaction_delta.toFixed(3)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─── Motif Impact Panel ─────────────────────────────────────────────────────

function MotifPanel({ motifs }: { motifs: MotifImpact[] }) {
    const statusStyle = (status: string) => {
        switch (status) {
            case 'disrupted': return { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', text: '#ef4444', label: '⛔ Disrupted' };
            case 'activated': return { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)', text: '#22c55e', label: '⚡ Activated' };
            default: return { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.5)', label: '● Maintained' };
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {motifs.map((m, i) => {
                const s = statusStyle(m.interaction_status);
                return (
                    <div key={i} style={{
                        padding: '12px', borderRadius: 10,
                        background: s.bg, border: `1px solid ${s.border}`,
                        transition: 'transform 0.2s',
                    }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 14, color: s.text, fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>
                            {m.motif_sequence}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginBottom: 2 }}>
                            {m.motif_name}
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
                            {m.function}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 10, color: s.text, fontWeight: 600 }}>{s.label}</span>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                                Conserv: {(m.conservation_score * 100).toFixed(0)}%
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Variant Pair Card ──────────────────────────────────────────────────────

function VariantPairCard({ pair, index }: { pair: VariantPair; index: number }) {
    const [expanded, setExpanded] = useState(index === 0); // First pair expanded by default
    const cls = classificationLabel(pair.classification);

    return (
        <div style={{
            borderRadius: 14,
            border: `1px solid ${cls.color}22`,
            background: `linear-gradient(135deg, ${cls.color}08, transparent)`,
            overflow: 'hidden',
            transition: 'all 0.3s',
        }}>
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                style={{
                    width: '100%', padding: '16px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'white',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                    {/* Epistasis gauge mini */}
                    <div style={{ width: 100, flexShrink: 0 }}>
                        <EpistasisGauge score={pair.epistasis_score} size={120} />
                    </div>

                    <div style={{ textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '3px 10px', borderRadius: 20,
                                background: `${cls.color}20`, color: cls.color,
                                fontSize: 11, fontWeight: 600,
                            }}>
                                {cls.icon} {cls.text}
                            </span>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                                Pair #{index + 1}
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                                <span style={{ color: '#22d3ee', fontWeight: 600, fontFamily: 'monospace' }}>{pair.variant_1.effect}</span>
                                <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 4px' }}>|</span>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>{pair.variant_1.domain}</span>
                            </div>
                            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16 }}>×</span>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                                <span style={{ color: '#a78bfa', fontWeight: 600, fontFamily: 'monospace' }}>{pair.variant_2.effect}</span>
                                <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 4px' }}>|</span>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>{pair.variant_2.domain}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {expanded ? <ChevronUp className="w-5 h-5 text-white/30" /> : <ChevronDown className="w-5 h-5 text-white/30" />}
            </button>

            {/* Expanded Content */}
            {expanded && (
                <div style={{ padding: '0 20px 20px', animation: 'fadeInUp 0.3s ease-out' }}>
                    {/* Description */}
                    <div style={{
                        padding: '12px 16px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        marginBottom: 16,
                    }}>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 8 }}>
                            {pair.description}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
                            <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 500 }}>
                                {pair.clinical_significance}
                            </span>
                        </div>
                    </div>

                    {/* Feature Activation Heatmap */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <Layers className="w-4 h-4" style={{ color: '#22d3ee' }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                                SAE Feature Activation Comparison
                            </span>
                        </div>
                        <div style={{
                            borderRadius: 10, overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.06)',
                            background: 'rgba(0,0,0,0.2)',
                        }}>
                            <FeatureHeatmap data={pair.heatmap_data} />
                        </div>
                    </div>

                    {/* Feature Changes */}
                    {pair.feature_changes.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                <Zap className="w-4 h-4" style={{ color: '#f59e0b' }} />
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                                    Differential Feature Activations
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {pair.feature_changes.map((fc, i) => (
                                    <div key={i} style={{
                                        padding: '8px 12px', borderRadius: 8,
                                        background: fc.direction === 'repressed'
                                            ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                                        border: `1px solid ${fc.direction === 'repressed' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
                                        flex: '1 1 200px', maxWidth: 280,
                                    }}>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 3 }}>
                                            {fc.feature_name}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{
                                                fontSize: 10,
                                                color: fc.direction === 'repressed' ? '#ef4444' : '#22c55e',
                                                fontWeight: 600,
                                            }}>
                                                {fc.direction === 'repressed' ? '▼ Repressed' : '▲ Enhanced'}
                                            </span>
                                            <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)' }}>
                                                Δ {fc.delta > 0 ? '+' : ''}{fc.delta.toFixed(3)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Motif Impact */}
                    {pair.motif_impacts.length > 0 && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                <Dna className="w-4 h-4" style={{ color: '#a78bfa' }} />
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                                    DNA Motif Impact Analysis
                                </span>
                            </div>
                            <MotifPanel motifs={pair.motif_impacts} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Main EpistaLink View ───────────────────────────────────────────────────

export default function EpistaLinkView({ data }: { data: EpistasisData }) {
    const overallCls = classificationLabel(data.dominant_interaction_type === 'mixed' ? 'neutral' : data.dominant_interaction_type);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header — Overall Epistasis Summary */}
            <div style={{
                display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24,
                padding: 24, borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(34,211,238,0.05), rgba(239,68,68,0.03))',
                border: '1px solid rgba(139,92,246,0.15)',
            }}>
                {/* Gauge */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <EpistasisGauge score={data.overall_epistasis_score} size={200} />
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '4px 14px', borderRadius: 20, marginTop: 8,
                        background: `${overallCls.color}15`, border: `1px solid ${overallCls.color}30`,
                    }}>
                        {overallCls.icon}
                        <span style={{ fontSize: 12, fontWeight: 600, color: overallCls.color }}>
                            {data.dominant_interaction_type === 'mixed' ? 'Mixed Epistasis' : overallCls.text}
                        </span>
                    </div>
                </div>

                {/* Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(34,211,238,0.2))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Atom className="w-5 h-5" style={{ color: '#a78bfa' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>
                                EpistaLink Analysis — {data.gene}
                            </div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                                {data.model_info.method} • {data.total_pairs_analyzed} variant pair{data.total_pairs_analyzed !== 1 ? 's' : ''} analyzed
                            </div>
                        </div>
                    </div>

                    <div style={{
                        fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7,
                        padding: '12px 16px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                        {data.clinical_summary}
                    </div>

                    {/* Method info badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {[
                            { label: `${data.model_info.n_features} SAE Features`, icon: '🧠' },
                            { label: `Score Range: ${data.model_info.scoring_range}`, icon: '📊' },
                            { label: `Steepness: a=${data.model_info.steepness_parameter}`, icon: '📐' },
                        ].map((badge, i) => (
                            <span key={i} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '3px 10px', borderRadius: 6,
                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                fontSize: 10, color: 'rgba(255,255,255,0.5)',
                            }}>
                                {badge.icon} {badge.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Score interpretation legend */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 16, padding: '10px 20px', borderRadius: 10,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>SCORE KEY:</span>
                {[
                    { range: '−10 to −5', label: 'Strong LoF', color: '#ef4444' },
                    { range: '−5 to −2', label: 'Moderate LoF', color: '#f97316' },
                    { range: '−2 to +2', label: 'Neutral', color: '#a3a3a3' },
                    { range: '+2 to +5', label: 'Mod. GoF', color: '#22d3ee' },
                    { range: '+5 to +10', label: 'Strong GoF', color: '#22c55e' },
                ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: item.color, opacity: 0.7 }} />
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
                            {item.range} <span style={{ color: item.color, fontWeight: 600 }}>{item.label}</span>
                        </span>
                    </div>
                ))}
            </div>

            {/* Variant Pair Analysis Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Target className="w-5 h-5" style={{ color: '#22d3ee' }} />
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>
                        Variant Pair Epistasis Analysis
                    </span>
                    <span style={{
                        padding: '2px 8px', borderRadius: 10,
                        background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)',
                        fontSize: 11, color: '#22d3ee', fontWeight: 600,
                    }}>
                        {data.variant_pairs.length} pair{data.variant_pairs.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {data.variant_pairs.map((pair, i) => (
                    <VariantPairCard key={i} pair={pair} index={i} />
                ))}
            </div>

            {/* Empty state */}
            {data.variant_pairs.length === 0 && (
                <div style={{
                    textAlign: 'center', padding: 40,
                    background: 'rgba(255,255,255,0.02)', borderRadius: 16,
                    border: '1px dashed rgba(255,255,255,0.1)',
                }}>
                    <Dna className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.15)' }} />
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                        No curated variant pairs available for {data.gene}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                        Submit variant pairs for de novo epistasis analysis
                    </div>
                </div>
            )}
        </div>
    );
}
