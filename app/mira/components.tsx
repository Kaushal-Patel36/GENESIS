'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown, CheckCircle2, Loader2, TrendingUp, TrendingDown,
    Minus, Info, ScanFace, Mic, Video, ClipboardList, AlertTriangle, Dna
} from 'lucide-react';

// ── Disorder accent palette ─────────────────────────────────────────────────
export const DISORDER_ACCENTS: Record<string, { hue: string; hex: string; teal: boolean }> = {
    PWS: { hue: '40', hex: '#f6ad55', teal: false },
    ASD: { hue: '180', hex: '#4fd1c5', teal: true },
    Angelman: { hue: '270', hex: '#b794f4', teal: false },
    DownSyndrome: { hue: '210', hex: '#63b3ed', teal: false },
    FragileX: { hue: '145', hex: '#68d391', teal: false },
};

// ── Animated counter hook ───────────────────────────────────────────────────
export function useCounter(target: number, duration = 1200, started = false) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        if (!started) return;
        let start: number | null = null;
        const step = (ts: number) => {
            if (!start) start = ts;
            const pct = Math.min((ts - start) / duration, 1);
            setVal(Math.round(pct * target));
            if (pct < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [started, target, duration]);
    return val;
}

// ── Scroll progress bar ──────────────────────────────────────────────────────
export function ScrollProgress({ accent }: { accent: string }) {
    const [pct, setPct] = useState(0);
    useEffect(() => {
        const onScroll = () => {
            const doc = document.documentElement;
            setPct((doc.scrollTop / (doc.scrollHeight - doc.clientHeight)) * 100);
        };
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    return (
        <div className="h-px w-full bg-white/5 relative">
            <div className="absolute left-0 top-0 h-full transition-all duration-100"
                style={{ width: `${pct}%`, backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }} />
        </div>
    );
}

// ── VPM Pipeline Architecture Diagram ───────────────────────────────────────
export function VPMDiagram() {
    const [dot, setDot] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setDot(d => (d + 1) % 8), 500);
        return () => clearInterval(interval);
    }, []);

    const Arrow = ({ stage }: { stage: number }) => (
        <div className="mt-14 flex-shrink-0 relative w-8">
            <div className="h-px w-8 bg-white/20 absolute top-1.5" />
            <motion.div
                animate={{ opacity: dot === stage ? 1 : 0.2, scale: dot === stage ? 1.2 : 1 }}
                className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute -top-0.5"
                style={{ left: '10px' }}
            />
        </div>
    );

    return (
        <div className="w-full rounded-xl border border-amber-400/15 bg-[#04080f] p-6 overflow-x-auto shadow-2xl">
            {/* Top label */}
            <div className="flex items-center gap-3 mb-6 min-w-[1100px]">
                <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f6ad55]" />
                <div className="flex-1 h-px bg-amber-400/30" />
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-[0.4em] font-bold whitespace-nowrap">
                    ◯ VISUAL PHENOTYPING MODULE (VPM) — 8-STAGE HORIZONTAL FLOW ARCHITECTURE
                </span>
                <div className="flex-1 h-px bg-amber-400/30" />
                <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f6ad55]" />
            </div>

            {/* Main row */}
            <div className="flex items-start gap-1 min-w-[1100px] h-[300px]">
                {/* COL 1: INPUTS */}
                <div className="w-[125px] flex-shrink-0">
                    <p className="text-[7px] font-mono text-blue-300 uppercase tracking-widest mb-3 text-center font-bold">MULTIMODAL INPUTS</p>
                    <div className="space-y-1.5">
                        {['Face Photos (Monthly)', 'Voice Notes (Monthly)', 'Food Behavior Log',
                            'Lifestyle Diary', 'Ancestry Profile', 'Eye-Tracking Data', 'Home Video (2–5 min)']
                            .map((l, i) => (
                                <div key={i} className="rounded border border-blue-400/30 bg-blue-500/10 px-2 py-1.5 hover:bg-blue-500/20 transition-colors">
                                    <p className="text-[7.5px] font-semibold text-blue-200 leading-tight text-center">{l}</p>
                                </div>
                            ))}
                    </div>
                </div>

                <Arrow stage={0} />

                {/* COL 2: PIPELINES */}
                <div className="w-[135px] flex-shrink-0">
                    <p className="text-[7px] font-mono text-emerald-300 uppercase tracking-widest mb-3 text-center font-bold">PIPELINES (1, 2, 3)</p>
                    <div className="space-y-1.5">
                        {[
                            { t: 'Pipeline 1', s: 'Dysmorphology Extractor', d: 'ResNet50 + Landmark Mesh' },
                            { t: 'Affect Processor', s: 'Micro-expression AU6', d: 'Temporal Flow Dynamics' },
                            { t: 'Pipeline 2', s: 'Acoustic Phenotype', d: 'wav2vec 2.0 Feature Map' },
                            { t: 'Pipeline 3', s: 'Behavioral & Motor', d: 'Pose Seg + Gait Tracking' },
                        ].map((b, i) => (
                            <div key={i} className="rounded border border-emerald-500/40 bg-emerald-700/20 px-2.5 py-2 hover:bg-emerald-700/30 transition-colors">
                                <p className="text-[8.5px] font-bold leading-tight text-white mb-0.5">{b.t}</p>
                                <p className="text-[7px] text-white/55 italic">{b.s}</p>
                                <p className="text-[6.5px] text-white/40 mt-1 font-mono">{b.d}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <Arrow stage={1} />

                {/* COL 3: STRATIFICATION (NEW) */}
                <div className="w-[125px] flex-shrink-0">
                    <p className="text-[7px] font-mono text-cyan-300 uppercase tracking-widest mb-3 text-center font-bold">STRATIFICATION</p>
                    <div className="rounded-xl border border-cyan-500/30 bg-cyan-900/20 p-3 space-y-2 h-[200px] flex flex-col justify-center">
                        <p className="text-[9px] font-bold text-cyan-300 text-center leading-tight">POPULATION STRATIFICATION</p>
                        <div className="h-px bg-cyan-500/30 w-full" />
                        <div className="space-y-1.5">
                            <p className="text-[7px] text-white/70 text-center">gnomAD Baseline Matching</p>
                            <div className="flex justify-center gap-1">
                                {['AFR', 'AMR', 'EAS', 'EUR', 'SAS'].map(c => <span key={c} className="text-[6px] bg-cyan-500/20 px-1 rounded text-cyan-200">{c}</span>)}
                            </div>
                            <p className="text-[7px] text-white/50 text-center italic">1000 Genomes Project Filter</p>
                        </div>
                    </div>
                </div>

                <Arrow stage={2} />

                {/* COL 4: NORMATIVE ENGINE */}
                <div className="w-[130px] flex-shrink-0">
                    <p className="text-[7px] font-mono text-teal-300 uppercase tracking-widest mb-3 text-center font-bold">NORMATIVE ENGINE</p>
                    <div className="rounded-xl border border-teal-500/40 bg-teal-900/30 px-3 py-4 space-y-2 h-[210px] flex flex-col justify-center">
                        <p className="text-[9.5px] font-bold text-teal-300 text-center leading-tight">QUANTITATIVE NORM ENGINE</p>
                        <div className="h-px bg-teal-500/30" />
                        <p className="text-[7px] text-white/70 text-center">Ancestry-matched z-score normalization</p>
                        <p className="text-[10px] text-amber-300 font-mono text-center my-1">z = (x - μ) / σ</p>
                        <p className="text-[7px] text-white/50 text-center leading-tight px-1">Per-feature deviation from cohort mean</p>
                    </div>
                </div>

                <Arrow stage={3} />

                {/* COL 5: LONGITUDINAL */}
                <div className="w-[135px] flex-shrink-0">
                    <p className="text-[7px] font-mono text-amber-400 uppercase tracking-widest mb-3 text-center font-bold">LONGITUDINAL DELTA</p>
                    <div className="rounded-xl border border-amber-500/40 bg-amber-600/10 px-3 py-4 space-y-2 h-[220px] flex flex-col justify-center">
                        <p className="text-[9.5px] font-bold text-amber-300 text-center leading-tight">DELTA (Δ) TRACKER</p>
                        <div className="h-px bg-amber-500/30" />
                        <p className="text-[7.5px] text-white/80 font-mono text-center">Δ = z(T) − z(T−1)</p>
                        <div className="space-y-1 px-1">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                <p className="text-[7px] text-white/60">Regression Alert</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                <p className="text-[7px] text-white/60">Plateau Monitor</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <p className="text-[7px] text-white/60">Target Convergence</p>
                            </div>
                        </div>
                    </div>
                </div>

                <Arrow stage={4} />

                {/* COL 6: HPO GENERATOR */}
                <div className="w-[125px] flex-shrink-0">
                    <p className="text-[7px] font-mono text-purple-400 uppercase tracking-widest mb-3 text-center font-bold">HPO GENERATOR</p>
                    <div className="rounded-xl border border-purple-500/40 bg-purple-700/15 px-3 py-4 space-y-2 h-[210px] flex flex-col justify-center">
                        <p className="text-[9.5px] font-bold text-purple-300 text-center leading-tight">HPO TERM SYNTHESIS</p>
                        <div className="h-px bg-purple-500/30" />
                        <p className="text-[7px] text-white/60 text-center pb-2">All signals → structured HPO + confidence weights</p>
                        <div className="py-1 px-1.5 bg-purple-500/10 rounded border border-purple-500/20 text-[6.5px] font-mono text-purple-200/80">
                            HP:0000343 | High Conf<br />
                            HP:0000431 | Moderate<br />
                            HP:0012448 | Low Conf
                        </div>
                    </div>
                </div>

                <Arrow stage={5} />

                {/* COL 7: GENESIS CORE */}
                <div className="w-[140px] flex-shrink-0">
                    <p className="text-[7px] font-mono text-red-400 uppercase tracking-widest mb-3 text-center font-bold">GENESIS CORE</p>
                    <div className="rounded-xl border border-red-500/40 bg-red-800/20 px-3 py-4 space-y-2 h-[220px] flex flex-col justify-center border-dashed">
                        <p className="text-[10px] font-bold text-red-300 text-center leading-tight">BAYESIAN FUSION ENGINE</p>
                        <div className="h-px bg-red-500/30" />
                        <div className="space-y-1">
                            <p className="text-[7px] text-white/70">BioBERT NLP Evidence</p>
                            <p className="text-[7px] text-white/70">GNN Gene-Disease Graph</p>
                            <p className="text-[7px] text-amber-400 font-bold border-t border-red-500/20 pt-1 mt-1 text-center italic">9th Evidence Source (VPM)</p>
                            <p className="text-[6px] text-white/40 text-center text-[5px] mt-1 whitespace-nowrap">CALIBRATING POSTERIOR PROBABILITY...</p>
                        </div>
                    </div>
                </div>

                <Arrow stage={6} />

                {/* COL 8: OUTPUTS */}
                <div className="w-[125px] flex-shrink-0">
                    <p className="text-[7px] font-mono text-emerald-400 uppercase tracking-widest mb-3 text-center font-bold">OUTPUTS & ACTIONS</p>
                    <div className="rounded-xl border border-emerald-500/40 bg-emerald-900/30 px-3 py-4 space-y-2 h-[210px] flex flex-col justify-center shadow-lg">
                        <p className="text-[10px] font-bold text-emerald-300 text-center leading-tight">DECISION SUPPORT</p>
                        <div className="h-px bg-emerald-500/30" />
                        <div className="space-y-1.5">
                            <div className="h-2 w-full bg-emerald-500/20 rounded-full overflow-hidden">
                                <motion.div animate={{ width: '85%' }} className="h-full bg-emerald-400" />
                            </div>
                            <p className="text-[7px] text-white/80 font-bold">PWS: 85.4%</p>
                            <p className="text-[6.5px] text-white/50 leading-tight">1. Methylation Array<br />2. Genetics Referral<br />3. Month 19 Recheck</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Column labels */}
            <div className="flex gap-1 mt-6 min-w-[1100px] border-t border-white/5 pt-4">
                {['INPUTS', 'PIPELINES', 'STRATIFICATION', 'NORM ENGINE', 'DELTA TRACK', 'HPO GEN', 'GENESIS CORE', 'DECISION SUPPORT'].map((lbl, i) => (
                    <div key={i} className={`flex-1 text-center text-[7px] font-mono uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity cursor-default ${i === 0 ? 'text-blue-400' : i === 1 ? 'text-emerald-400' : i === 2 ? 'text-cyan-400' : i === 3 ? 'text-teal-400' : i === 4 ? 'text-amber-400' : i === 5 ? 'text-purple-400' : i === 6 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {lbl}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Grad-CAM Face Heatmap Visualization ──────────────────────────────────────────
export function GradCAMFace({ hpoTerms }: { hpoTerms: any[] }) {
    const [hoverRegion, setHoverRegion] = useState<string | null>(null);

    // Simulated heatmap regions
    const regions = [
        { id: 'forehead', path: 'M30,25 Q50,15 70,25', label: 'Dysmorphic Forehead', hpo: 'HP:0000329', saliency: 0.82, color: '#ef4444' },
        { id: 'l-eye', path: 'M35,45 Q40,40 45,45 Q40,50 35,45', label: 'Almond-shaped Eyes', hpo: 'HP:0000574', saliency: 0.94, color: '#f87171' },
        { id: 'r-eye', path: 'M55,45 Q60,40 65,45 Q60,50 55,45', label: 'Almond-shaped Eyes', hpo: 'HP:0000574', saliency: 0.92, color: '#f87171' },
        { id: 'nose', path: 'M48,50 Q50,45 52,50 L52,65 Q50,75 48,65 Z', label: 'Narrow Nasal Bridge', hpo: 'HP:0000446', saliency: 0.65, color: '#fbbf24' },
        { id: 'mouth', path: 'M38,78 Q50,70 62,78 Q50,85 38,78', label: 'Thin Upper Lip', hpo: 'HP:0000219', saliency: 0.78, color: '#fca5a5' },
        { id: 'jaw', path: 'M30,85 Q50,95 70,85', label: 'Micrognathia', hpo: 'HP:0000347', saliency: 0.45, color: '#3b82f6' },
    ];

    return (
        <div className="flex gap-6 items-center w-full">
            <div className="relative w-64 h-64 bg-black/40 rounded-2xl border border-white/10 p-4 flex flex-col items-center justify-center overflow-hidden">
                {/* Heatmap intensity gradient background */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-teal-500/5 to-red-500/5 animate-pulse" />

                <svg viewBox="0 0 100 100" className="w-48 h-48 relative z-10">
                    {/* Face Silhouette */}
                    <path d="M50,10 C25,10 15,35 15,55 C15,85 35,95 50,95 C65,95 85,85 85,55 C85,35 75,10 50,10"
                        fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="2 2" />

                    {/* Heat blobs (Grad-CAM Saliency) */}
                    <g>
                        {regions.map(r => (
                            <motion.path
                                key={r.id}
                                d={r.path}
                                fill="none"
                                stroke={r.color}
                                strokeWidth={hoverRegion === r.id ? "3" : "1.5"}
                                strokeLinecap="round"
                                className="cursor-help"
                                onHoverStart={() => setHoverRegion(r.id)}
                                onHoverEnd={() => setHoverRegion(null)}
                                animate={{
                                    opacity: hoverRegion && hoverRegion !== r.id ? 0.3 : 0.8,
                                    filter: `blur(${8 - (r.saliency * 6)}px)`
                                }}
                            />
                        ))}
                        {/* Soft heat clusters */}
                        <circle cx="40" cy="45" r="8" fill="radial-gradient(circle, #ef4444 0%, transparent 100%)" className="opacity-40" />
                        <circle cx="60" cy="45" r="8" fill="radial-gradient(circle, #ef4444 0%, transparent 100%)" className="opacity-40" />
                        <circle cx="50" cy="78" r="10" fill="radial-gradient(circle, #fca5a5 0%, transparent 100%)" className="opacity-30" />
                    </g>

                    {/* MediaPipe-style Landmark dots */}
                    <g opacity="0.3">
                        {Array.from({ length: 40 }).map((_, i) => {
                            const angle = (i / 40) * Math.PI * 2;
                            const x = 50 + Math.cos(angle) * (20 + Math.sin(i) * 15);
                            const y = 50 + Math.sin(angle) * (30 + Math.cos(i) * 10);
                            return <circle key={i} cx={x} cy={y} r="0.5" fill="white" />;
                        })}
                    </g>
                </svg>

                {/* Label Overlay */}
                <div className="absolute top-2 left-2 flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                    <span className="text-[8px] font-mono font-bold text-red-100 uppercase tracking-widest">Saliency Map (Active)</span>
                </div>

                {/* Colorbar legend */}
                <div className="absolute right-3 bottom-12 h-24 w-1.5 bg-gradient-to-t from-blue-500 via-yellow-400 to-red-500 rounded-full border border-white/10" />
                <div className="absolute right-5 bottom-12 h-24 flex flex-col justify-between text-[6px] font-mono text-white/40">
                    <span>HIGH</span>
                    <span>MED</span>
                    <span>LOW</span>
                </div>
            </div>

            <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">Grad-CAM Feature Detection</p>
                    <span className="text-[8px] font-mono text-white/30 truncate max-w-[120px]">ResNet-50 Heatmap v3.2</span>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-2">
                    <table className="w-full text-[9px] font-mono">
                        <thead className="text-white/30 uppercase tracking-widest border-b border-white/5 pb-2">
                            <tr>
                                <th className="text-left font-normal pb-2">Anatomical Region</th>
                                <th className="text-right font-normal pb-2">HPO ID</th>
                                <th className="text-right font-normal pb-2">Saliency</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {regions.map(r => (
                                <tr key={r.id} className={`transition-colors ${hoverRegion === r.id ? 'bg-white/5 text-amber-300' : 'text-white/60'}`}
                                    onMouseEnter={() => setHoverRegion(r.id)} onMouseLeave={() => setHoverRegion(null)}>
                                    <td className="py-2">{r.label}</td>
                                    <td className="py-2 text-right">{r.hpo}</td>
                                    <td className="py-2 text-right font-bold">{(r.saliency * 100).toFixed(0)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-[8px] text-white/30 italic leading-relaxed">
                    Overlay shows pixels with highest contribution to HPO classification.
                    Bounding boxes calculated using MediaPipe Face Mesh.
                </p>
            </div>
        </div>
    );
}

// ── HPO Term Grid ────────────────────────────────────────────────────────────
export function HPOTermGrid({ terms, started }: { terms: any[]; started: boolean }) {
    const [open, setOpen] = useState<string | null>(null);
    const tiers = {
        active: terms.filter(t => t.confidence > 0.65),
        new: terms.filter(t => t.confidence >= 0.4 && t.confidence <= 0.65),
        low: terms.filter(t => t.confidence < 0.4),
    };
    return (
        <div className="space-y-3">
            {[
                { label: 'HIGH CONFIDENCE', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/25', items: tiers.active },
                { label: 'MODERATE (NEW SINCE LAST SNAPSHOT)', color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20', items: tiers.new },
                { label: 'LOW / MONITORING', color: 'text-white/30', bg: 'bg-white/5', border: 'border-white/10', items: tiers.low },
            ].map(tier => tier.items.length > 0 && (
                <div key={tier.label}>
                    <p className={`text-[8px] font-mono uppercase tracking-widest mb-1 ${tier.color}`}>{tier.label}</p>
                    <div className="grid grid-cols-2 gap-1">
                        {tier.items.map((t, i) => {
                            const conf = Math.round(t.confidence * 100);
                            return (
                                <div key={i} onClick={() => setOpen(open === t.hpo_id ? null : t.hpo_id)}
                                    className={`cursor-pointer border rounded-lg p-2 transition-all ${tier.border} ${tier.bg} hover:brightness-125`}>
                                    <div className="flex items-start gap-2">
                                        <div className="flex-1">
                                            <p className="text-[9px] font-bold text-foreground leading-tight">{t.label}</p>
                                            <p className="text-[7.5px] font-mono text-muted-foreground/50">{t.hpo_id}</p>
                                        </div>
                                        <div className="relative w-7 h-7 flex-shrink-0">
                                            <svg viewBox="0 0 28 28" className="w-full h-full -rotate-90">
                                                <circle cx="14" cy="14" r="10" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                                                <circle cx="14" cy="14" r="10" fill="none" stroke={tier.color.replace('text-', '#').replace('amber-400', 'f6ad55').replace('teal-400', '4fd1c5').replace('white/30', 'ffffff')}
                                                    strokeWidth="3" strokeDasharray={`${2 * Math.PI * 10 * conf / 100} 999`} strokeLinecap="round" />
                                            </svg>
                                            <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold">{conf}</span>
                                        </div>
                                    </div>
                                    <AnimatePresence>
                                        {open === t.hpo_id && (
                                            <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                className="text-[7.5px] font-mono text-muted-foreground/50 italic mt-1 overflow-hidden leading-relaxed">
                                                {t.evidence}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Bayesian Fusion Panel ────────────────────────────────────────────────────
export function BayesianPanel({ priors, started }: { priors: Record<string, number>; started: boolean }) {
    const sources = [
        { label: 'Clinical Notes NLP', wt: 0.22, icon: '📋' },
        { label: 'Phenotype HPO Input', wt: 0.18, icon: '🧬' },
        { label: 'Family History', wt: 0.12, icon: '👨‍👩‍👧' },
        { label: 'Prior Tests', wt: 0.10, icon: '🧪' },
        { label: 'Imaging Summary', wt: 0.09, icon: '🧠' },
        { label: 'Lab Values', wt: 0.08, icon: '🔬' },
        { label: 'Pop. Priors (gnomAD)', wt: 0.08, icon: '🌍' },
        { label: 'Delta Vector (Chrono)', wt: 0.07, icon: '📈' },
        { label: 'VPM / MIRA (9th)', wt: 0.06, icon: '⚡', highlight: true },
    ];
    return (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-widest font-mono text-amber-400">Bayesian Fusion — 9 Evidence Sources</span>
            </div>
            <div className="font-mono text-[8.5px] text-teal-300/80 bg-black/30 rounded-lg p-2">
                P(D|E) = P(E|D) · P(D) / P(E)
                <span className="text-white/30 ml-2">·  posterior = likelihood × prior / evidence</span>
            </div>
            <div className="space-y-1.5">
                {sources.map((s, i) => (
                    <div key={i} className={`flex items-center gap-2 ${s.highlight ? 'opacity-100' : 'opacity-70'}`}>
                        <span className="w-4 text-[10px]">{s.icon}</span>
                        <span className={`text-[8.5px] font-mono flex-1 ${s.highlight ? 'text-amber-300 font-bold' : 'text-white/60'}`}>{s.label}</span>
                        <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: started ? `${s.wt * 100 / 0.22 * 100}%` : 0 }}
                                transition={{ duration: 0.8, delay: i * 0.07 }}
                                className={`h-full rounded-full ${s.highlight ? 'bg-amber-400' : 'bg-white/25'}`} />
                        </div>
                        <span className={`text-[8px] font-mono w-8 text-right ${s.highlight ? 'text-amber-400' : 'text-white/40'}`}>{(s.wt * 100).toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── MRI ROI Z-Score Bars ─────────────────────────────────────────────────────
export function MRIRoiBars({ started }: { started: boolean }) {
    const rois = [
        { label: 'Hypothalamus', z: 1.8, note: 'Hyperphagia circuit' },
        { label: 'Insula', z: 1.2, note: 'Interoception' },
        { label: 'Corpus Callosum', z: 0.6, note: 'White matter' },
        { label: 'Caudate Nucleus', z: -0.4, note: 'Motor/reward' },
        { label: 'Amygdala', z: 0.9, note: 'Affective tone' },
        { label: 'Prefrontal Cortex', z: 1.1, note: 'Executive fn' },
    ];
    const maxAbs = 2;
    return (
        <div className="rounded-xl border border-blue-400/20 bg-blue-500/5 p-4 space-y-3">
            <p className="text-[9px] font-bold uppercase tracking-widest font-mono text-blue-400">MRI ROI Z-Scores</p>
            <p className="text-[7.5px] text-muted-foreground/40 font-mono -mt-2">Deviation from ancestry-matched normative atlas</p>
            <div className="space-y-2">
                {rois.map((r, i) => {
                    const absPct = Math.abs(r.z) / maxAbs * 50;
                    const pos = r.z >= 0;
                    return (
                        <div key={i} className="space-y-0.5">
                            <div className="flex items-center justify-between text-[8px] font-mono">
                                <span className="text-white/60">{r.label}</span>
                                <span className={r.z > 1 ? 'text-amber-400 font-bold' : 'text-white/40'}>{r.z > 0 ? '+' : ''}{r.z.toFixed(1)}σ</span>
                            </div>
                            <div className="flex items-center gap-0 h-2.5">
                                {/* Left (negative) */}
                                <div className="flex-1 h-full flex justify-end">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: started && !pos ? `${absPct}%` : 0 }}
                                        transition={{ duration: 0.8, delay: i * 0.08 }}
                                        className="h-full rounded-l bg-blue-400/60" />
                                </div>
                                {/* Center line */}
                                <div className="w-px h-full bg-white/20 flex-shrink-0" />
                                {/* Right (positive) */}
                                <div className="flex-1 h-full">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: started && pos ? `${absPct}%` : 0 }}
                                        transition={{ duration: 0.8, delay: i * 0.08 }}
                                        className="h-full rounded-r bg-amber-400/70" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <p className="text-[7px] font-mono text-white/20 border-t border-white/5 pt-2">
                ← below norm · center = cohort mean · above norm →
            </p>
        </div>
    );
}

// ── Next-Best Diagnostic Action Cards ───────────────────────────────────────
export function DiagnosticActions({ visible }: { visible: boolean }) {
    const actions = [
        {
            priority: 'URGENT', color: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/8',
            title: 'Methylation Array (15q11-q13)', rationale: 'MIRA facial features + elevated hypothalamic z-score highly consistent with PWS. Methylation is the gold standard first test.',
            tags: ['Not tested'], contribution: '+0.24 posterior'
        },
        {
            priority: 'HIGH', color: 'text-amber-400', border: 'border-amber-400/30', bg: 'bg-amber-400/8',
            title: 'Refer to Clinical Geneticist', rationale: 'Multi-modal phenotype complexity warrants specialist evaluation before further genetic testing.',
            tags: ['Pending'], contribution: '+0.12 posterior'
        },
        {
            priority: 'HIGH', color: 'text-amber-400', border: 'border-amber-400/30', bg: 'bg-amber-400/8',
            title: 'Reanalyze Existing WES (if available)', rationale: 'Variants of uncertain significance in SNRPN region may be reclassifiable with updated phenotype data from MIRA.',
            tags: ['Ordered'], contribution: '+0.09 posterior'
        },
        {
            priority: 'MOD', color: 'text-teal-400', border: 'border-teal-500/25', bg: 'bg-teal-500/5',
            title: 'Recheck in 4 Weeks — Repeat MIRA Snapshot', rationale: 'Longitudinal delta tracking requires next monthly snapshot to confirm trajectory acceleration pattern.',
            tags: ['Scheduled'], contribution: '+0.06 posterior'
        },
        {
            priority: 'MOD', color: 'text-teal-400', border: 'border-teal-500/25', bg: 'bg-teal-500/5',
            title: 'Hyperphagia Behavioral Assessment', rationale: 'Food behavior log indicates elevated hyperphagia score. Structured PWS dietary behavioral assessment recommended.',
            tags: ['Not tested'], contribution: '+0.04 posterior'
        },
    ];

    const tagColor = (t: string) => t === 'Ordered' ? 'bg-teal-500/20 text-teal-400' : t === 'Pending' ? 'bg-amber-400/20 text-amber-400' : 'bg-white/10 text-white/40';

    return (
        <AnimatePresence>
            {visible && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="space-y-3">
                    <div className="flex items-center gap-3">
                        <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest font-bold">Next-Best Diagnostic Steps</span>
                        <div className="flex-1 h-px bg-amber-400/15" />
                        <span className="text-[8px] font-mono text-muted-foreground/40">Ranked by information gain · GENESIS Engine</span>
                    </div>
                    {actions.map((a, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                            className={`flex items-start gap-4 p-4 rounded-xl border ${a.border} ${a.bg}`}>
                            <div className="flex-shrink-0 flex flex-col items-center gap-1">
                                <span className={`text-[7px] font-bold uppercase tracking-widest font-mono px-1.5 py-0.5 rounded ${a.color} border ${a.border}`}>{a.priority}</span>
                                <span className="text-[8px] font-mono text-muted-foreground/40">#{i + 1}</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-[11px] font-bold text-foreground">{a.title}</p>
                                <p className="text-[9px] text-muted-foreground/70 mt-0.5 leading-relaxed">{a.rationale}</p>
                                <div className="flex gap-1.5 mt-1.5">
                                    {a.tags.map((t, ti) => (
                                        <span key={ti} className={`text-[7.5px] font-mono px-1.5 py-0.5 rounded ${tagColor(t)}`}>{t}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-shrink-0 text-right">
                                <span className={`text-[9px] font-bold font-mono ${a.color}`}>{a.contribution}</span>
                                <p className="text-[7px] text-muted-foreground/40 mt-0.5">info gain</p>
                            </div>
                        </motion.div>
                    ))}

                    {/* Uncertainty statement */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                        <p className="text-[8.5px] font-mono text-teal-300/60 leading-relaxed">
                            WHAT WOULD CHANGE THIS:{' '}
                            <span className="text-white/50">A second pathogenic SNRPN allele would raise posterior to 0.94 (conclusive). Absence of maternal methylation would lower PWS probability to 0.18 and elevate Angelman to 0.41. A negative methylation result with persistent MIRA signals would trigger Silver-Russell pathway.</span>
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ── FAISS Ranking Panel (GestaltMatcher) ─────────────────────────────────────
export function FAISSRankingPanel({ rankings, started }: { rankings: any[]; started: boolean }) {
    if (!rankings || rankings.length === 0) return null;

    return (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 space-y-4">
            <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-widest font-mono text-amber-400">FAISS CFPS Similarity Ranking</span>
                <span className="px-1.5 py-0.5 roundedbg-amber-400/20 text-amber-400 text-[6px] border border-amber-400/30">PATIENT-TO-PATIENT DB</span>
            </div>

            <div className="font-mono text-[8.5px] text-teal-300/80 bg-black/30 rounded-lg p-2 leading-relaxed">
                Matched 320-dim FPD vector against 5,000+ synthetic patient profiles.
                <br /><span className="text-white/30">Score fused from Top-20 Neighbor Density + Ancestry Centroid Distance.</span>
            </div>

            <div className="space-y-2 relative">
                {/* Headers */}
                <div className="flex text-[7px] font-mono text-white/40 mb-1 px-1">
                    <span className="w-6">RANK</span>
                    <span className="flex-1">SYNDROME</span>
                    <span className="w-16 text-right">NEIGHBORS</span>
                    <span className="w-16 text-right">CENTROID Δ</span>
                    <span className="w-16 text-right">SIMILARITY</span>
                </div>

                {rankings.map((r, i) => (
                    <motion.div key={r.syndrome}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: started ? 1 : 0, x: started ? 0 : -10 }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border ${i === 0 ? 'bg-amber-400/10 border-amber-400/30 glow-border' : 'bg-white/5 border-transparent'}`}>

                        <span className={`w-6 text-[10px] font-bold font-mono text-center ${i === 0 ? 'text-amber-400' : 'text-white/40'}`}>#{r.rank}</span>
                        <span className={`text-[10px] font-bold flex-1 ${i === 0 ? 'text-amber-300' : 'text-white/60'}`}>{r.syndrome}</span>

                        <span className="w-16 text-[9px] font-mono text-teal-400/70 text-right">{r.neighbor_cluster ?? r.neighbor_count ?? '—'}</span>
                        <span className="w-16 text-[9px] font-mono text-blue-400/70 text-right">{(r.centroid_distance ?? r.max_similarity != null ? (1 - (r.max_similarity ?? 0)).toFixed(3) : '—')}</span>

                        <div className="w-16 flex items-center justify-end gap-1">
                            <span className={`text-[10px] font-mono font-bold ${i === 0 ? 'text-amber-400' : 'text-white/60'}`}>
                                {r.similarity != null ? (r.similarity * 100).toFixed(1) + '%' : (r.confidence_pct != null ? r.confidence_pct + '%' : '—')}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
