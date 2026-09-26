'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
    Atom, ArrowLeft, ChevronDown, ChevronUp, Search,
    Activity, Info, AlertTriangle, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ═══════════════════════════════════════════════════════════════════════════
 * TYPES
 * ═══════════════════════════════════════════════════════════════════════════ */

interface EpistaVariant {
    id: string; position: number; effect: string; domain: string;
}
interface FeatureChange {
    feature_index: number; feature_name: string;
    single_activation: number; pair_activation: number;
    delta: number; direction: string;
}
interface MotifImpact {
    motif_sequence: string; motif_name: string; function: string;
    conservation_score: number; interaction_status: string; impact_score: number;
}
interface HeatmapEntry {
    feature: string;
    variant_1_activation: number; variant_2_activation: number;
    pair_activation: number; interaction_delta: number;
}
interface VariantPair {
    variant_1: EpistaVariant; variant_2: EpistaVariant;
    epistasis_score: number; classification: string;
    description: string; clinical_significance: string;
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
        method: string; steepness_parameter: number;
        n_features: number; scoring_range: string;
    };
}

/* ═══════════════════════════════════════════════════════════════════════════
 * CONSTANTS
 * ═══════════════════════════════════════════════════════════════════════════ */

const BACKEND_URL = 'http://localhost:8000';

const GENE_DB = [
    { symbol: 'FBN1', name: 'Fibrillin-1', disease: 'Marfan Syndrome', chr: '15q21.1', omim: '134797' },
    { symbol: 'LMNA', name: 'Lamin A/C', disease: 'Dilated Cardiomyopathy', chr: '1q22', omim: '150330' },
    { symbol: 'CFTR', name: 'CFTR', disease: 'Cystic Fibrosis', chr: '7q31.2', omim: '602421' },
    { symbol: 'SCN1A', name: 'Nav1.1', disease: 'Dravet Syndrome', chr: '2q24.3', omim: '182389' },
    { symbol: 'MYH7', name: 'Beta-myosin heavy chain', disease: 'Hypertrophic Cardiomyopathy', chr: '14q11.2', omim: '160760' },
    { symbol: 'MECP2', name: 'MeCP2', disease: 'Rett Syndrome', chr: 'Xq28', omim: '300005' },
    { symbol: 'TSC1', name: 'Hamartin', disease: 'Tuberous Sclerosis', chr: '9q34.13', omim: '605284' },
    { symbol: 'FGFR3', name: 'FGFR3', disease: 'Achondroplasia', chr: '4p16.3', omim: '134934' },
];

/* ═══════════════════════════════════════════════════════════════════════════
 * PALETTE  –  muted, clinical, monochrome + single accent
 * ═══════════════════════════════════════════════════════════════════════════ */

const P = {
    bg: '#0a0a0f',
    surface: '#111118',
    surface2: '#16161f',
    border: 'rgba(255,255,255,0.06)',
    text: 'rgba(255,255,255,0.88)',
    textMuted: 'rgba(255,255,255,0.45)',
    textDim: 'rgba(255,255,255,0.25)',
    accent: '#7c8cf5',       // single muted indigo
    negative: '#c0392b',     // deep brick – LoF
    positive: '#27ae60',     // muted green – GoF
    neutral: '#7f8c8d',
    warn: '#d4a017',
};

/* ═══════════════════════════════════════════════════════════════════════════
 * HELPERS
 * ═══════════════════════════════════════════════════════════════════════════ */

function clsColor(cls: string) {
    if (cls === 'negative') return P.negative;
    if (cls === 'positive') return P.positive;
    return P.neutral;
}
function clsLabel(cls: string) {
    if (cls === 'negative') return 'Loss of Function (Negative Epistasis)';
    if (cls === 'positive') return 'Gain of Function (Positive Epistasis)';
    return 'Additive / Neutral';
}

/* ═══════════════════════════════════════════════════════════════════════════
 * FITNESS LANDSCAPE SVG  –  a 3D-like rugged surface showing epistatic 
 * terrain. Each variant pair maps to a peak or valley. This is a novel
 * visualization: no existing tool renders epistasis as a Wright-style
 * fitness landscape for rare disease diagnostics.
 * ═══════════════════════════════════════════════════════════════════════════ */

function FitnessLandscape({ pairs, overallScore }: { pairs: VariantPair[]; overallScore: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = 560, H = 300;
        canvas.width = W * 2; canvas.height = H * 2;
        canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
        ctx.scale(2, 2);

        ctx.clearRect(0, 0, W, H);

        // Generate landscape from variant pair scores
        const cols = 60, rows = 30;
        const grid: number[][] = [];

        // Seed base terrain
        for (let r = 0; r < rows; r++) {
            grid[r] = [];
            for (let c = 0; c < cols; c++) {
                const x = c / cols, y = r / rows;
                // Base undulation
                let z = Math.sin(x * 4 * Math.PI) * 0.15 + Math.cos(y * 3 * Math.PI) * 0.1;
                // Add pair-specific peaks/valleys
                pairs.forEach((p, i) => {
                    const px = (i + 1) / (pairs.length + 1);
                    const py = 0.3 + (i % 2) * 0.4;
                    const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
                    const amplitude = p.epistasis_score / 10;
                    z += amplitude * Math.exp(-dist * dist * 30);
                });
                grid[r][c] = z;
            }
        }

        // Isometric transform
        const isoX = (c: number, r: number, z: number) => W / 2 + (c - r) * 4.2;
        const isoY = (c: number, r: number, z: number) => 80 + (c + r) * 2.8 - z * 120;

        // Draw wireframe mesh
        for (let r = 0; r < rows - 1; r++) {
            for (let c = 0; c < cols - 1; c++) {
                const z = grid[r][c];
                const x1 = isoX(c, r, z), y1 = isoY(c, r, z);
                const x2 = isoX(c + 1, r, grid[r][c + 1]), y2 = isoY(c + 1, r, grid[r][c + 1]);
                const x3 = isoX(c, r + 1, grid[r + 1][c]), y3 = isoY(c, r + 1, grid[r + 1][c]);

                const hue = z > 0.1 ? P.positive : z < -0.1 ? P.negative : P.neutral;
                const opacity = 0.08 + Math.abs(z) * 0.4;

                ctx.strokeStyle = hue;
                ctx.globalAlpha = Math.min(opacity, 0.5);
                ctx.lineWidth = 0.6;

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x3, y3);
                ctx.stroke();
            }
        }

        // Mark variant pair positions as dots on the landscape
        pairs.forEach((p, i) => {
            const px = Math.floor(((i + 1) / (pairs.length + 1)) * (cols - 1));
            const py = Math.floor((0.3 + (i % 2) * 0.4) * (rows - 1));
            const z = grid[py]?.[px] ?? 0;
            const sx = isoX(px, py, z);
            const sy = isoY(px, py, z);

            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(sx, sy, 5, 0, Math.PI * 2);
            ctx.fillStyle = clsColor(p.classification);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Label
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '9px ui-monospace, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${p.variant_1.effect.substring(0, 6)}\u00D7${p.variant_2.effect.substring(0, 6)}`, sx, sy - 12);
            ctx.fillStyle = clsColor(p.classification);
            ctx.fillText(`${p.epistasis_score > 0 ? '+' : ''}${p.epistasis_score.toFixed(1)}`, sx, sy - 3);
        });

        ctx.globalAlpha = 1;

        // Axis labels
        ctx.fillStyle = P.textDim;
        ctx.font = '9px -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Genotype Space', 30, H - 12);
        ctx.textAlign = 'right';
        ctx.fillText('Fitness', W - 20, 25);

    }, [pairs, overallScore]);

    return (
        <div style={{ position: 'relative' }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', maxWidth: 560 }} />
            <div style={{
                position: 'absolute', top: 8, left: 12,
                fontSize: 9, color: P.textDim, letterSpacing: 1.5, textTransform: 'uppercase',
            }}>
                Epistatic Fitness Landscape
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * PROTEIN DOMAIN MAP  –  linear domain architecture with variant positions
 * Inspired by SMART/Pfam domain diagrams from biological papers
 * ═══════════════════════════════════════════════════════════════════════════ */

function DomainMap({ pairs }: { pairs: VariantPair[] }) {
    // Collect unique domains and variants
    const domains = useMemo(() => {
        const d = new Map<string, { name: string; start: number; end: number; variants: { effect: string; pos: number; cls: string }[] }>();
        pairs.forEach(p => {
            [p.variant_1, p.variant_2].forEach(v => {
                if (!d.has(v.domain)) {
                    d.set(v.domain, { name: v.domain, start: v.position - 200, end: v.position + 200, variants: [] });
                }
                const entry = d.get(v.domain)!;
                entry.start = Math.min(entry.start, v.position - 50);
                entry.end = Math.max(entry.end, v.position + 50);
            });
        });
        // add variants
        pairs.forEach(p => {
            const d1 = d.get(p.variant_1.domain);
            if (d1) d1.variants.push({ effect: p.variant_1.effect, pos: p.variant_1.position, cls: p.classification });
            const d2 = d.get(p.variant_2.domain);
            if (d2) d2.variants.push({ effect: p.variant_2.effect, pos: p.variant_2.position, cls: p.classification });
        });
        return Array.from(d.values());
    }, [pairs]);

    const minPos = Math.min(...domains.map(d => d.start));
    const maxPos = Math.max(...domains.map(d => d.end));
    const range = maxPos - minPos || 1;

    return (
        <svg viewBox="0 0 520 90" style={{ width: '100%', maxWidth: 520 }}>
            {/* Protein backbone */}
            <line x1="30" y1="40" x2="490" y2="40" stroke={P.border} strokeWidth="2" />

            {/* Domain blocks */}
            {domains.map((d, i) => {
                const x1 = 30 + ((d.start - minPos) / range) * 460;
                const x2 = 30 + ((d.end - minPos) / range) * 460;
                const w = Math.max(x2 - x1, 30);
                return (
                    <g key={i}>
                        <rect x={x1} y="26" width={w} height="28" rx="4"
                            fill={`rgba(124,140,245,${0.08 + i * 0.04})`} stroke="rgba(124,140,245,0.2)" strokeWidth="1" />
                        <text x={x1 + w / 2} y="44" fill={P.textMuted} fontSize="8" textAnchor="middle"
                            fontFamily="ui-monospace, monospace">{d.name}</text>
                    </g>
                );
            })}

            {/* Variant lollipops */}
            {domains.flatMap(d => d.variants).map((v, i) => {
                const x = 30 + ((v.pos - minPos) / range) * 460;
                return (
                    <g key={i}>
                        <line x1={x} y1="26" x2={x} y2="8" stroke={clsColor(v.cls)} strokeWidth="1.2" opacity="0.7" />
                        <circle cx={x} cy="7" r="3.5" fill={clsColor(v.cls)} opacity="0.9" />
                        <text x={x} y="70" fill={P.textMuted} fontSize="7" textAnchor="middle"
                            fontFamily="ui-monospace, monospace" transform={`rotate(-30 ${x} 70)`}>{v.effect}</text>
                    </g>
                );
            })}

            {/* Interaction arcs */}
            {pairs.map((p, i) => {
                const x1 = 30 + ((p.variant_1.position - minPos) / range) * 460;
                const x2 = 30 + ((p.variant_2.position - minPos) / range) * 460;
                const midX = (x1 + x2) / 2;
                const arcH = Math.min(Math.abs(x2 - x1) * 0.4, 30);
                return (
                    <path key={i}
                        d={`M ${x1} 8 Q ${midX} ${8 - arcH} ${x2} 8`}
                        fill="none" stroke={clsColor(p.classification)} strokeWidth="1"
                        strokeDasharray={p.classification === 'neutral' ? '3 3' : undefined}
                        opacity="0.5" />
                );
            })}

            {/* Scale */}
            <text x="30" y="86" fill={P.textDim} fontSize="7">aa {minPos}</text>
            <text x="490" y="86" fill={P.textDim} fontSize="7" textAnchor="end">aa {maxPos}</text>
        </svg>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * LATENT FEATURE DECOMPOSITION PLOT  
 * Shows SAE features as a horizontal strip-chart (inspired by genomics
 * heatmaps from papers like Vande Moortele et al.)
 * ═══════════════════════════════════════════════════════════════════════════ */

function LatentDecomposition({ data }: { data: HeatmapEntry[] }) {
    const maxVal = useMemo(() => {
        let m = 0;
        data.forEach(d => { m = Math.max(m, Math.abs(d.interaction_delta)); }); return m || 1;
    }, [data]);

    return (
        <div>
            <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
                <div style={{ width: 120 }} />
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', fontSize: 9, color: P.textDim, fontFamily: 'ui-monospace, monospace' }}>
                    <span>V1</span><span>V2</span><span>Pair</span><span>Delta</span>
                </div>
            </div>
            {data.slice(0, 10).map((entry, i) => {
                const norm = (v: number) => Math.min(Math.abs(v) / (maxVal * 2 + 0.01), 1);
                return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 1 }}>
                        <div style={{
                            width: 130, fontSize: 10, color: P.textMuted, textAlign: 'right', paddingRight: 8,
                            fontFamily: 'ui-monospace, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{entry.feature}</div>
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 2 }}>
                            {[entry.variant_1_activation, entry.variant_2_activation, entry.pair_activation, entry.interaction_delta].map((v, j) => (
                                <div key={j} style={{
                                    height: 18,
                                    background: j < 3
                                        ? `rgba(124,140,245, ${norm(v) * 0.7})`
                                        : v > 0.05
                                            ? `rgba(39,174,96, ${norm(v) * 0.8})`
                                            : v < -0.05
                                                ? `rgba(192,57,43, ${norm(v) * 0.8})`
                                                : 'rgba(255,255,255,0.02)',
                                    borderRadius: 2,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 9, fontFamily: 'ui-monospace, monospace',
                                    color: norm(v) > 0.3 ? 'rgba(255,255,255,0.9)' : P.textDim,
                                }}>
                                    {v.toFixed(2)}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
            {/* Scale */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 6, fontSize: 9, color: P.textDim }}>
                <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 1, background: `rgba(192,57,43,0.6)`, marginRight: 3, verticalAlign: 'middle' }} />Repressed</span>
                <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 1, background: `rgba(124,140,245,0.5)`, marginRight: 3, verticalAlign: 'middle' }} />Baseline</span>
                <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 1, background: `rgba(39,174,96,0.6)`, marginRight: 3, verticalAlign: 'middle' }} />Enhanced</span>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * MOTIF CONSERVATION TABLE  –  minimal, publication-style
 * ═══════════════════════════════════════════════════════════════════════════ */

function MotifTable({ motifs }: { motifs: MotifImpact[] }) {
    return (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
            <thead>
                <tr style={{ borderBottom: `1px solid ${P.border}` }}>
                    {['Motif', 'Sequence', 'Function', 'Conservation', 'Status'].map(h => (
                        <th key={h} style={{
                            padding: '7px 10px', textAlign: 'left',
                            color: P.textDim, fontWeight: 500, fontSize: 10,
                            letterSpacing: 0.5, textTransform: 'uppercase',
                        }}>{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {motifs.map((m, i) => {
                    const statusColor = m.interaction_status === 'disrupted' ? P.negative
                        : m.interaction_status === 'activated' ? P.positive : P.neutral;
                    return (
                        <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                            <td style={{ padding: '8px 10px', color: P.text, fontWeight: 500, fontSize: 12 }}>{m.motif_name}</td>
                            <td style={{ padding: '8px 10px', fontFamily: 'ui-monospace, monospace', color: P.accent, letterSpacing: 2, fontSize: 12 }}>
                                {m.motif_sequence}
                            </td>
                            <td style={{ padding: '8px 10px', color: P.textMuted, fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {m.function}
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <div style={{ width: 40, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                                        <div style={{ width: `${m.conservation_score * 100}%`, height: '100%', borderRadius: 2, background: P.accent, opacity: 0.6 }} />
                                    </div>
                                    <span style={{ fontSize: 10, color: P.textDim, fontFamily: 'ui-monospace, monospace' }}>
                                        {(m.conservation_score * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                                <span style={{
                                    display: 'inline-block', padding: '2px 10px', borderRadius: 3, fontSize: 10,
                                    background: `${statusColor}15`, color: statusColor, fontWeight: 600,
                                }}>{m.interaction_status}</span>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * DEVIATION BAR CHART  –  centered diverging bars for feature delta
 * ═══════════════════════════════════════════════════════════════════════════ */

function DeviationBars({ changes }: { changes: FeatureChange[] }) {
    const maxD = useMemo(() => Math.max(...changes.map(c => Math.abs(c.delta)), 0.01), [changes]);

    return (
        <div>
            {changes.slice(0, 8).map((fc, i) => {
                const pct = (Math.abs(fc.delta) / maxD) * 45;
                const isNeg = fc.direction === 'repressed';
                return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', height: 20, gap: 0 }}>
                        <div style={{
                            width: 110, fontSize: 10, color: P.textMuted, textAlign: 'right', paddingRight: 8,
                            fontFamily: 'ui-monospace, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{fc.feature_name}</div>
                        <div style={{ flex: 1, position: 'relative', height: 12 }}>
                            {/* center line */}
                            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.08)' }} />
                            <div style={{
                                position: 'absolute', top: 2, height: 8, borderRadius: 2,
                                ...(isNeg
                                    ? { right: '50%', width: `${pct}%`, background: P.negative, opacity: 0.5 }
                                    : { left: '50%', width: `${pct}%`, background: P.positive, opacity: 0.5 }),
                            }} />
                        </div>
                        <div style={{
                            width: 55, fontSize: 9, fontFamily: 'ui-monospace, monospace',
                            color: isNeg ? P.negative : P.positive, textAlign: 'right',
                        }}>
                            {fc.delta > 0 ? '+' : ''}{fc.delta.toFixed(3)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * VARIANT PAIR PANEL
 * ═══════════════════════════════════════════════════════════════════════════ */

function PairPanel({ pair, index }: { pair: VariantPair; index: number }) {
    const [open, setOpen] = useState(index === 0);
    const color = clsColor(pair.classification);

    return (
        <div style={{
            borderRadius: 8, border: `1px solid ${P.border}`,
            background: P.surface, overflow: 'hidden',
        }}>
            {/* Header */}
            <button onClick={() => setOpen(!open)} style={{
                width: '100%', padding: '14px 20px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', background: 'none', border: 'none',
                cursor: 'pointer', color: P.text,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {/* Score pip */}
                    <div style={{
                        width: 44, height: 44, borderRadius: 8,
                        background: `${color}10`, border: `1px solid ${color}30`,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color, fontFamily: 'ui-monospace, monospace' }}>
                            {pair.epistasis_score > 0 ? '+' : ''}{pair.epistasis_score.toFixed(1)}
                        </span>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <span style={{ fontFamily: 'ui-monospace, monospace', color: P.text, fontWeight: 600, fontSize: 15 }}>
                                {pair.variant_1.effect}
                            </span>
                            <span style={{ color: P.textDim, fontSize: 14 }}>{'\u00D7'}</span>
                            <span style={{ fontFamily: 'ui-monospace, monospace', color: P.text, fontWeight: 600, fontSize: 15 }}>
                                {pair.variant_2.effect}
                            </span>
                            <span style={{
                                padding: '2px 10px', borderRadius: 3, fontSize: 10,
                                background: `${color}12`, color, fontWeight: 600, marginLeft: 4,
                            }}>{clsLabel(pair.classification).split('(')[0].trim()}</span>
                        </div>
                        <div style={{ fontSize: 11, color: P.textDim }}>
                            {pair.variant_1.domain} / {pair.variant_2.domain}
                        </div>
                    </div>
                </div>
                {open ? <ChevronUp size={14} style={{ color: P.textDim }} /> : <ChevronDown size={14} style={{ color: P.textDim }} />}
            </button>

            {/* Expanded */}
            {open && (
                <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${P.border}` }}>
                    {/* Mechanism */}
                    <div style={{
                        margin: '16px 0', padding: '12px 16px', borderRadius: 6,
                        background: 'rgba(255,255,255,0.015)', borderLeft: `3px solid ${color}`,
                    }}>
                        <div style={{ fontSize: 13, color: P.text, lineHeight: 1.7, marginBottom: 6 }}>
                            {pair.description}
                        </div>
                        <div style={{ fontSize: 12, color: P.warn, fontWeight: 500 }}>
                            Clinical: {pair.clinical_significance}
                        </div>
                    </div>

                    {/* Two columns */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        {/* Left: Latent Decomposition */}
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: P.text, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Activity size={12} style={{ color: P.accent }} />
                                SAE Feature Decomposition
                            </div>
                            <div style={{
                                padding: 12, borderRadius: 6, background: 'rgba(0,0,0,0.25)',
                                border: `1px solid ${P.border}`,
                            }}>
                                <LatentDecomposition data={pair.heatmap_data} />
                            </div>
                        </div>

                        {/* Right: Deviation + Motifs */}
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: P.text, marginBottom: 10 }}>
                                Interaction Deviation from Additivity
                            </div>
                            <div style={{
                                padding: 12, borderRadius: 6, background: 'rgba(0,0,0,0.25)',
                                border: `1px solid ${P.border}`, marginBottom: 16,
                            }}>
                                <DeviationBars changes={pair.feature_changes} />
                            </div>

                            {pair.motif_impacts.length > 0 && (
                                <>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: P.text, marginBottom: 10 }}>
                                        Regulatory Motif Impact
                                    </div>
                                    <div style={{
                                        borderRadius: 6, overflow: 'hidden', background: 'rgba(0,0,0,0.25)',
                                        border: `1px solid ${P.border}`,
                                    }}>
                                        <MotifTable motifs={pair.motif_impacts} />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * MAIN PAGE
 * ═══════════════════════════════════════════════════════════════════════════ */

export default function EpistaLinkPage() {
    const [selectedGene, setSelectedGene] = useState<string | null>(null);
    const [data, setData] = useState<EpistasisData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalysis = useCallback(async (gene: string) => {
        setLoading(true); setError(null); setSelectedGene(gene);
        try {
            const res = await fetch(`${BACKEND_URL}/epistalink/${gene}`);
            if (!res.ok) throw new Error(`Analysis failed (HTTP ${res.status})`);
            setData(await res.json());
        } catch (e: any) { setError(e.message); } finally { setLoading(false); }
    }, []);

    return (
        <div style={{ minHeight: '100vh', background: P.bg, color: P.text }}>

            {/* ── HEADER ── */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 50,
                background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(16px)',
                borderBottom: `1px solid ${P.border}`,
            }}>
                <div style={{
                    maxWidth: 1200, margin: '0 auto', padding: '0 24px',
                    height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: P.text }}>
                            <Atom size={18} style={{ color: P.accent }} />
                            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5 }}>
                                GENESIS
                            </span>
                            <span style={{ color: P.textDim, margin: '0 4px' }}>/</span>
                            <span style={{ fontSize: 13, fontWeight: 500, color: P.textMuted }}>EpistaLink</span>
                        </Link>
                    </div>
                    <Link href="/">
                        <Button size="sm" variant="outline"
                            className="border-border/40 hover:bg-white/5 text-xs gap-1.5 h-8"
                            style={{ color: P.textMuted }}>
                            <ArrowLeft size={12} /> Exit
                        </Button>
                    </Link>
                </div>
            </header>

            {/* ── ABSTRACT ── */}
            <section style={{
                maxWidth: 760, margin: '0 auto', padding: '48px 24px 32px',
                borderBottom: `1px solid ${P.border}`,
            }}>
                <div style={{ fontSize: 11, color: P.accent, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
                    Epistasis Detection Module
                </div>
                <h1 style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.3, marginBottom: 16 }}>
                    Decomposing Variant-Variant Interactions via Bidirectional Cross-Attention Pair Encoding
                </h1>
                <p style={{ fontSize: 14, color: P.textMuted, lineHeight: 1.85 }}>
                    EpistaLink quantifies epistatic effects between co-occurring mutations by explicitly modeling context-dependent
                    interactions using single-head bidirectional cross-attention applied to independently embedded variants.
                    The resulting interaction representation is projected into a 64-dimensional sparse latent space, where interaction
                    magnitude is mapped to a bounded score via hyperbolic transform f(x) = 10 · tanh(x/a). Interacting variants
                    produce deviations from additive expectation, indicating loss-of-function (negative epistasis) or gain-of-function
                    (positive epistasis). This approach surfaces genotype-phenotype relationships invisible to standard single-variant tools.
                </p>

                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, marginTop: 24,
                    borderRadius: 6, overflow: 'hidden', border: `1px solid ${P.border}`,
                }}>
                    {[
                        { label: 'Attention Dims', value: '64 × 3' },
                        { label: 'Scoring', value: 'tanh(x/a)' },
                        { label: 'Range', value: '[-10, +10]' },
                        { label: 'Gene Panel', value: `${GENE_DB.length}` },
                    ].map((item, i) => (
                        <div key={i} style={{
                            padding: '12px 14px', background: P.surface, textAlign: 'center',
                        }}>
                            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'ui-monospace, monospace', color: P.text }}>{item.value}</div>
                            <div style={{ fontSize: 10, color: P.textDim, marginTop: 2 }}>{item.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── GENE SELECTOR ── */}
            <section style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                    fontSize: 13, fontWeight: 600, color: P.textMuted,
                }}>
                    <Search size={14} style={{ color: P.accent }} /> Select Gene
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    {GENE_DB.map(g => {
                        const active = selectedGene === g.symbol;
                        return (
                            <button key={g.symbol} onClick={() => fetchAnalysis(g.symbol)} style={{
                                padding: '14px 16px', borderRadius: 6, textAlign: 'left',
                                cursor: 'pointer', color: P.text, transition: 'all 0.15s',
                                background: active ? `${P.accent}0a` : P.surface,
                                border: `1px solid ${active ? `${P.accent}40` : P.border}`,
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{
                                        fontSize: 16, fontWeight: 700, fontFamily: 'ui-monospace, monospace',
                                        color: active ? P.accent : P.text,
                                    }}>{g.symbol}</span>
                                    <span style={{ fontSize: 9, color: P.textDim, fontFamily: 'ui-monospace, monospace' }}>{g.chr}</span>
                                </div>
                                <div style={{ fontSize: 12, color: P.textMuted }}>{g.disease}</div>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* ── LOADING ── */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                    <div style={{
                        width: 24, height: 24, border: `2px solid ${P.border}`,
                        borderTopColor: P.accent, borderRadius: '50%',
                        margin: '0 auto 14px',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                    <p style={{ color: P.textMuted, fontSize: 14 }}>
                        Computing SAE feature decomposition for {selectedGene}...
                    </p>
                </div>
            )}

            {error && (
                <div style={{ textAlign: 'center', padding: '40px 24px' }}>
                    <AlertTriangle size={20} style={{ color: P.negative, margin: '0 auto 8px' }} />
                    <p style={{ color: P.negative, fontSize: 13 }}>{error}</p>
                </div>
            )}

            {/* ═══════════════ RESULTS ═══════════════ */}
            {data && !loading && (
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>

                    {/* Report header */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                        padding: '20px 0 12px', borderBottom: `1px solid ${P.border}`, marginBottom: 24,
                    }}>
                        <div>
                            <h2 style={{ fontSize: 23, fontWeight: 700, margin: 0 }}>
                                {data.gene}
                                <span style={{ fontWeight: 400, color: P.textMuted }}> Epistasis Report</span>
                            </h2>
                            <div style={{ fontSize: 12, color: P.textDim, marginTop: 4 }}>
                                {data.model_info.method} &middot; {data.total_pairs_analyzed} pairs analyzed &middot; Score: {data.overall_epistasis_score.toFixed(2)}
                            </div>
                        </div>
                        <div style={{
                            padding: '5px 14px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                            background: `${clsColor(data.dominant_interaction_type === 'mixed' ? 'neutral' : data.dominant_interaction_type)}12`,
                            color: clsColor(data.dominant_interaction_type === 'mixed' ? 'neutral' : data.dominant_interaction_type),
                        }}>
                            {data.dominant_interaction_type === 'mixed' ? 'Mixed Epistasis'
                                : data.dominant_interaction_type === 'positive' ? 'Gain of Function'
                                    : data.dominant_interaction_type === 'negative' ? 'Loss of Function' : 'Neutral'}
                        </div>
                    </div>

                    {/* ── Two-column: Landscape + Summary ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
                        {/* Fitness landscape */}
                        <div style={{
                            padding: 16, borderRadius: 8, background: P.surface,
                            border: `1px solid ${P.border}`,
                        }}>
                            <FitnessLandscape pairs={data.variant_pairs} overallScore={data.overall_epistasis_score} />
                        </div>

                        {/* Clinical summary + domain map */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{
                                flex: 1, padding: '16px 20px', borderRadius: 8,
                                background: P.surface, border: `1px solid ${P.border}`,
                            }}>
                                <div style={{ fontSize: 11, color: P.textDim, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
                                    Clinical Summary
                                </div>
                                <p style={{ fontSize: 14, color: P.textMuted, lineHeight: 1.85, margin: 0 }}>
                                    {data.clinical_summary}
                                </p>
                            </div>
                            <div style={{
                                padding: '16px 20px', borderRadius: 8,
                                background: P.surface, border: `1px solid ${P.border}`,
                            }}>
                                <div style={{ fontSize: 11, color: P.textDim, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
                                    Protein Domain Architecture
                                </div>
                                <DomainMap pairs={data.variant_pairs} />
                            </div>
                        </div>
                    </div>

                    {/* ── Score scale ── */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28,
                        borderRadius: 4, overflow: 'hidden', height: 6,
                    }}>
                        <div style={{ flex: 1, background: `linear-gradient(90deg, ${P.negative}, ${P.neutral})`, opacity: 0.4 }} />
                        <div style={{ flex: 1, background: `linear-gradient(90deg, ${P.neutral}, ${P.positive})`, opacity: 0.4 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: -22, marginBottom: 28, fontSize: 9, color: P.textDim, fontFamily: 'ui-monospace, monospace' }}>
                        <span>-10 (Strong LoF)</span>
                        <span>0 (Additive)</span>
                        <span>+10 (Strong GoF)</span>
                    </div>

                    {/* ── Variant Pairs ── */}
                    <div style={{ marginBottom: 12 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
                            Variant Pair Analysis
                            <span style={{
                                marginLeft: 10, padding: '2px 9px', borderRadius: 3, fontSize: 11,
                                background: `${P.accent}10`, color: P.accent, fontWeight: 600,
                            }}>{data.variant_pairs.length}</span>
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {data.variant_pairs.map((pair, i) => (
                                <PairPanel key={i} pair={pair} index={i} />
                            ))}
                        </div>
                    </div>

                    {/* ── Method Note ── */}
                    <div style={{
                        marginTop: 32, padding: '16px 20px', borderRadius: 6,
                        background: P.surface, border: `1px solid ${P.border}`,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <Info size={12} style={{ color: P.textDim }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: P.textMuted }}>Methodology</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: P.text, marginBottom: 4 }}>Sparse Autoencoder</div>
                                <p style={{ fontSize: 11, color: P.textDim, lineHeight: 1.7, margin: 0 }}>
                                    64-dimensional feature vectors computed per variant and per pair.
                                    Maps protein effects into interpretable biological dimensions: folding, binding, signaling pathway activation.
                                </p>
                            </div>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: P.text, marginBottom: 4 }}>Hyperbolic Score</div>
                                <p style={{ fontSize: 11, color: P.textDim, lineHeight: 1.7, margin: 0 }}>
                                    Epistasis = 10 · tanh(x/{data.model_info.steepness_parameter}). The deviation between observed pair activation
                                    and expected additive sum quantifies non-linear gene-gene interaction strength.
                                </p>
                            </div>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: P.text, marginBottom: 4 }}>Fitness Landscape</div>
                                <p style={{ fontSize: 11, color: P.textDim, lineHeight: 1.7, margin: 0 }}>
                                    Inspired by Sewall Wright&apos;s adaptive landscape theory. Variant pairs are mapped onto
                                    a rugged topography where peaks indicate GoF epistasis and valleys indicate LoF,
                                    revealing the combinatorial fitness architecture of the gene.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── EMPTY STATE ── */}
            {!data && !loading && !error && (
                <div style={{ textAlign: 'center', padding: '60px 24px 80px' }}>
                    <Atom size={40} style={{ color: 'rgba(255,255,255,0.04)', margin: '0 auto 12px' }} />
                    <p style={{ fontSize: 14, color: P.textDim }}>
                        Select a gene above to begin epistasis analysis.
                    </p>
                </div>
            )}

            {/* ── FOOTER ── */}
            <footer style={{ borderTop: `1px solid ${P.border}`, padding: '16px 24px' }}>
                <div style={{
                    maxWidth: 1200, margin: '0 auto',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span style={{ fontSize: 11, color: P.textDim }}>
                        GENESIS / EpistaLink &mdash; Sparse Autoencoder Epistasis Detection
                    </span>
                    <span style={{ fontSize: 10, color: P.textDim }}>
                        Fitness landscape inspired by Wright (1932) adaptive topography
                    </span>
                </div>
            </footer>
        </div>
    );
}
