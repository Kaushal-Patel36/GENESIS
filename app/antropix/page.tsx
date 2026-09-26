'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Orbit, Brain, Gauge, ArrowLeft, Sparkles, Zap, Activity, Shield,
    AlertTriangle, Layers, Network, Cpu, Terminal, Search, ChevronRight,
    Atom, Dna, Beaker, Eye, Clock, Target, FlaskConical, Radiation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, Tooltip
} from 'recharts';

// ═══════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════
const MOCK_DATA = {
    gene: "FBN1",
    spectral_analysis: {
        fiedler_value: 0.4412,
        eigenvalue_std: 0.2581,
        instability_score: 1.72,
        critical_path_alert: true,
        gene_fiedler_component: 0.1283,
        top_eigenvalues: [0, 0.4412, 0.8923, 1.2341, 1.5672, 2.0134, 2.4521, 3.1002],
    },
    attractor_field: {
        attractors: [
            { disease_id: "OMIM:154700", disease_name: "Marfan Syndrome", x: 1.8, y: 1.2, z: -0.5, gravity: 4.82, confidence: 0.74, poincare_distance: 0.21, radius: 1.48 },
            { disease_id: "OMIM:609192", disease_name: "Loeys-Dietz Syndrome", x: -1.5, y: 2.0, z: 1.8, gravity: 2.15, confidence: 0.14, poincare_distance: 0.46, radius: 0.28 },
            { disease_id: "OMIM:121050", disease_name: "Ehlers-Danlos Syndrome", x: 2.5, y: -1.0, z: 0.8, gravity: 1.03, confidence: 0.06, poincare_distance: 0.97, radius: 0.15 },
            { disease_id: "OMIM:143890", disease_name: "Hypermobile EDS", x: -2.0, y: -1.5, z: -1.2, gravity: 0.72, confidence: 0.04, poincare_distance: 1.38, radius: 0.15 },
            { disease_id: "OMIM:192600", disease_name: "Hypertrophic Cardiomyopathy", x: 0.5, y: -2.5, z: 2.0, gravity: 0.48, confidence: 0.02, poincare_distance: 2.06, radius: 0.15 },
        ],
        flow_vectors: [],
        patient_position: { x: 0.0, y: 0.0, z: 0.0 },
    },
    digital_twin: {
        gene: "FBN1",
        knockout: {
            impacted_genes: [
                { gene: "TGFBR1", baseline_interaction: 1.3, knockout_interaction: 0.52, delta: 0.78 },
                { gene: "COL1A1", baseline_interaction: 1.1, knockout_interaction: 0.44, delta: 0.66 },
                { gene: "ELN", baseline_interaction: 0.8, knockout_interaction: 0.32, delta: 0.48 },
            ], fiedler_value: 0.1812, stability_change: -0.26, network_disruption: 0.41
        },
        drug_stabilization: { reinforced_interactions: ["TGFBR1", "COL1A1", "ELN"], fiedler_value: 0.5823, stability_improvement: 0.1411, network_resilience: 1.32 },
        baseline_fiedler: 0.4412,
    },
    shadow_phenotypes: [
        { hpo_id: "HP:0002616", label: "Aortic root dilation", probability: 0.82, source_disease: "Marfan Syndrome", source_disease_id: "OMIM:154700", time_horizon_months: 8, latent_distance: 0.18 },
        { hpo_id: "HP:0001659", label: "Aortic regurgitation", probability: 0.64, source_disease: "Marfan Syndrome", source_disease_id: "OMIM:154700", time_horizon_months: 14, latent_distance: 0.36 },
        { hpo_id: "HP:0001083", label: "Ectopia lentis", probability: 0.51, source_disease: "Marfan Syndrome", source_disease_id: "OMIM:154700", time_horizon_months: 18, latent_distance: 0.49 },
        { hpo_id: "HP:0002650", label: "Scoliosis", probability: 0.38, source_disease: "Loeys-Dietz Syndrome", source_disease_id: "OMIM:609192", time_horizon_months: 22, latent_distance: 0.62 },
    ],
    evidence_reliability: [
        { axis: "Genomic", certainty: 0.92, source: "ClinVar", effect: "glow", pulse_speed: 1.16, intensity: 92 },
        { axis: "Phenotype", certainty: 0.78, source: "HPO", effect: "glow", pulse_speed: 1.44, intensity: 78 },
        { axis: "Pathway", certainty: 0.65, source: "Reactome", effect: "normal", pulse_speed: 1.7, intensity: 65 },
        { axis: "Literature", certainty: 0.42, source: "PubMed", effect: "blur", pulse_speed: 2.16, intensity: 42 },
        { axis: "GNN", certainty: 0.78, source: "Graph Net", effect: "glow", pulse_speed: 1.44, intensity: 78 },
        { axis: "Diffusion", certainty: 0.70, source: "Laplacian", effect: "normal", pulse_speed: 1.6, intensity: 70 },
    ],
    cascade_wavefront: [
        { id: "input", label: "Genomic Input", stage: 0, signal_strength: 1.0, is_bottleneck: false, effect: "wave", color: "#22c55e", delay_ms: 0 },
        { id: "variant", label: "Variant Analysis", stage: 1, signal_strength: 0.85, is_bottleneck: false, effect: "wave", color: "#22c55e", delay_ms: 400 },
        { id: "phenotype", label: "Phenotype Map", stage: 2, signal_strength: 0.7225, is_bottleneck: false, effect: "wave", color: "#22c55e", delay_ms: 800 },
        { id: "network", label: "Network Diffusion", stage: 3, signal_strength: 0.1842, is_bottleneck: true, effect: "explosion", color: "#ef4444", delay_ms: 1200 },
        { id: "attractor", label: "Attractor Conv.", stage: 4, signal_strength: 0.5220, is_bottleneck: false, effect: "wave", color: "#f59e0b", delay_ms: 1600 },
        { id: "diagnosis", label: "Clinical Output", stage: 5, signal_strength: 0.4437, is_bottleneck: false, effect: "wave", color: "#f59e0b", delay_ms: 2000 },
    ],
    mechanistic_narrative: {
        primary_analysis: "Model detects a Bifurcation Point in the patient's trajectory. Mathematical instability in the Extracellular matrix organization pathway (Spectral Gap: 0.4412) suggests a 74% transition toward Marfan Syndrome phenotype within 18 months.",
        shadow_prediction: "Shadow-Phenotype Analysis predicts 82% emergence of 'Aortic root dilation' within 8 months based on latent proximity to Marfan Syndrome cohort.",
        recommendation: "Recommend prioritizing Fibrillin 1 functional assay and Extracellular matrix organization pathway monitoring to resolve manifold ambiguity.",
        bifurcation_detected: true,
        confidence: 74,
        pathway_focus: "Extracellular matrix organization",
    },
    spectral_log: [
        "[AntropiX] Initializing Cross-Modal Latent Attractor System for FBN1...",
        "[MANIFOLD] Embedding 35 diseases into Poincaré Disk (κ = -1).",
        "[SPECTRAL] Laplacian eigendecomposition: Fiedler value = 0.441200",
        "[SPECTRAL] Eigenvalue σ = 0.258100 | Instability = 1.7200",
        "[ATTRACTOR] Computed gravitational field for 5 disease attractors.",
        "[ATTRACTOR] Strongest pull: Marfan Syndrome (g = 4.8200)",
        "[TWIN] Digital Twin simulation complete: knockout Δ-Fiedler = -0.260000",
        "[SHADOW] Detected 4 latent shadow phenotypes via autoencoder reconstruction.",
        "[CASCADE] Wavefront propagation: BOTTLENECK DETECTED",
        "[NARRATIVE] Bifurcation: DETECTED — CRITICAL PATH",
        "[AntropiX] Analysis complete. Manifold convergence: SUCCESS.",
    ],
};

// ═══════════════════════════════════════════════════════════
// 2D SVG ATTRACTOR FIELD (no WebGL required)
// ═══════════════════════════════════════════════════════════
const ATTRACTOR_COLORS = ['#f43f5e', '#8b5cf6', '#f59e0b', '#3b82f6', '#10b981'];

function AttractorFieldSVG({ data }: { data: typeof MOCK_DATA }) {
    const { attractors, patient_position } = data.attractor_field;
    const cx = 400, cy = 290; // center of SVG
    const scale = 55;
    const mapX = (v: number) => cx + v * scale;
    const mapY = (v: number) => cy - v * scale;
    const px = mapX(patient_position.x);
    const py = mapY(patient_position.y);

    return (
        <svg viewBox="0 0 800 580" className="w-full h-full" style={{ background: 'transparent' }}>
            <defs>
                {attractors.map((a, i) => (
                    <radialGradient key={`g-${i}`} id={`glow-${i}`}>
                        <stop offset="0%" stopColor={ATTRACTOR_COLORS[i] || '#64748b'} stopOpacity="0.5" />
                        <stop offset="100%" stopColor={ATTRACTOR_COLORS[i] || '#64748b'} stopOpacity="0" />
                    </radialGradient>
                ))}
                <radialGradient id="patient-glow">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </radialGradient>
                <filter id="blur-sm"><feGaussianBlur stdDeviation="3" /></filter>
            </defs>
            {/* Grid lines */}
            {Array.from({ length: 17 }).map((_, i) => (<line key={`gx-${i}`} x1={i * 50} y1={0} x2={i * 50} y2={580} stroke="#1e293b" strokeWidth="0.5" opacity="0.3" />))}
            {Array.from({ length: 12 }).map((_, i) => (<line key={`gy-${i}`} x1={0} y1={i * 50} x2={800} y2={i * 50} stroke="#1e293b" strokeWidth="0.5" opacity="0.3" />))}
            {/* Poincaré disk boundary */}
            <circle cx={cx} cy={cy} r={220} fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
            <circle cx={cx} cy={cy} r={150} fill="none" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.3" />
            {/* Gravity lines from patient to attractors */}
            {attractors.map((a, i) => {
                const ax = mapX(a.x), ay = mapY(a.y);
                const midX = (px + ax) / 2 + Math.sin(i * 1.5) * 30;
                const midY = (py + ay) / 2 + Math.cos(i * 1.5) * 30;
                return (
                    <motion.path key={`line-${i}`} d={`M${px},${py} Q${midX},${midY} ${ax},${ay}`}
                        fill="none" stroke={ATTRACTOR_COLORS[i] || '#64748b'} strokeWidth={Math.min(a.gravity * 0.4, 2.5)} opacity={Math.min(a.gravity / 5, 0.5)}
                        strokeDasharray="6 4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: i * 0.2 }} />
                );
            })}
            {/* Attractor glow + sphere */}
            {attractors.map((a, i) => {
                const ax = mapX(a.x), ay = mapY(a.y);
                const r = Math.max(12, a.confidence * 50);
                return (
                    <g key={a.disease_id}>
                        <motion.circle cx={ax} cy={ay} r={r * 3} fill={`url(#glow-${i})`}
                            animate={{ r: [r * 2.5, r * 3.5, r * 2.5] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }} />
                        <motion.circle cx={ax} cy={ay} r={r} fill={ATTRACTOR_COLORS[i] || '#64748b'} opacity={0.85}
                            stroke={ATTRACTOR_COLORS[i] || '#64748b'} strokeWidth="1.5"
                            animate={{ r: [r - 1, r + 2, r - 1] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }} />
                        <text x={ax} y={ay - r - 10} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" opacity="0.9">{a.disease_name}</text>
                        <text x={ax} y={ay - r - 0} textAnchor="middle" fill={ATTRACTOR_COLORS[i]} fontSize="8" fontFamily="monospace" opacity="0.7">{a.gravity.toFixed(2)}g</text>
                    </g>
                );
            })}
            {/* Patient particle */}
            <motion.circle cx={px} cy={py} r={40} fill="url(#patient-glow)"
                animate={{ r: [35, 45, 35] }} transition={{ duration: 2, repeat: Infinity }} />
            <motion.circle cx={px} cy={py} r={7} fill="#06b6d4"
                animate={{ r: [6, 8, 6] }} transition={{ duration: 1.5, repeat: Infinity }} />
            <circle cx={px} cy={py} r={16} fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.4">
                <animateTransform attributeName="transform" type="rotate" from={`0 ${px} ${py}`} to={`360 ${px} ${py}`} dur="6s" repeatCount="indefinite" />
            </circle>
            <text x={px} y={py + 28} textAnchor="middle" fill="#06b6d4" fontSize="8" fontFamily="monospace" fontWeight="bold">PATIENT</text>
        </svg>
    );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════
export default function AntropiXPage() {
    const [data, setData] = useState(MOCK_DATA);
    const [loading, setLoading] = useState(false);
    const [gene, setGene] = useState("FBN1");
    const [activeTab, setActiveTab] = useState("attractor");
    const [cascadeStep, setCascadeStep] = useState(-1);
    const [twinMode, setTwinMode] = useState<'knockout' | 'drug'>('knockout');

    // Cascade animation
    useEffect(() => {
        if (activeTab !== 'cascade') { setCascadeStep(-1); return; }
        setCascadeStep(-1);
        const timer = setTimeout(() => {
            let step = 0;
            const interval = setInterval(() => {
                setCascadeStep(step);
                step++;
                if (step > 5) { step = 0; setCascadeStep(-1); }
            }, 600);
            return () => clearInterval(interval);
        }, 300);
        return () => clearTimeout(timer);
    }, [activeTab]);

    const fetchAnalysis = async (symbol: string) => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/antropix/${symbol}`);
            const json = await res.json();
            setData(json);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const radarData = data.evidence_reliability.map(e => ({
        subject: e.axis, A: e.intensity, fullMark: 100, effect: e.effect, certainty: e.certainty,
    }));

    return (
        <div className="min-h-screen bg-[#02020a] text-slate-200 selection:bg-rose-500/30 overflow-x-hidden">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-rose-500/8 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/8 blur-[150px] rounded-full" />
                <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] bg-cyan-500/5 blur-[120px] rounded-full" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-2xl">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="group p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-violet-500 to-cyan-400 flex items-center justify-center p-0.5 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                                <div className="w-full h-full bg-black/20 rounded-[10px] flex items-center justify-center">
                                    <Radiation className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-400">
                                    Antropi<span className="text-rose-400">X</span>
                                </h1>
                                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">Latent Attractor Engine</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {data.spectral_analysis.critical_path_alert && (
                            <div className="hidden md:flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-1.5 backdrop-blur-md animate-pulse">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Critical Path</span>
                            </div>
                        )}
                        <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[9px]">Riemannian κ=-1</Badge>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10 relative">
                <div className="grid lg:grid-cols-12 gap-8">

                    {/* ═══ LEFT SIDEBAR (4/12) ═══ */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Gene Input */}
                        <Card className="bg-[#0a0a1a]/60 border-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden">
                            <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2 text-white"><Cpu className="w-4 h-4 text-rose-400" />Attractor Parameters</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input value={gene} onChange={e => setGene(e.target.value.toUpperCase())} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-rose-500/50 outline-none transition-all focus:ring-4 focus:ring-rose-500/10 placeholder:text-slate-600" placeholder="GENE SYMBOL" />
                                        <Badge className="absolute right-2 top-1/2 -translate-y-1/2 bg-rose-500/10 text-rose-400 border-rose-500/20 text-[9px]">HUGO</Badge>
                                    </div>
                                    <Button onClick={() => fetchAnalysis(gene)} disabled={loading} className="bg-rose-600 hover:bg-rose-500 text-white rounded-xl px-6 h-auto shadow-[0_4px_15px_rgba(244,63,94,0.3)]">
                                        {loading ? '...' : <ChevronRight className="w-5 h-5" />}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Mechanistic Narrative */}
                        <Card className="bg-[#0a0a1a]/60 border-white/5 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-rose-500 to-violet-600" />
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-white"><Brain className="w-4 h-4 text-rose-400" />Mechanistic Narrative</CardTitle>
                                {data.mechanistic_narrative.bifurcation_detected && (
                                    <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[9px] animate-pulse w-fit">⚠ BIFURCATION POINT</Badge>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-[11px] leading-relaxed font-mono text-slate-200">{data.mechanistic_narrative.primary_analysis}</div>
                                {data.mechanistic_narrative.shadow_prediction && (
                                    <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20 text-[10px] leading-relaxed font-mono text-violet-300/80">{data.mechanistic_narrative.shadow_prediction}</div>
                                )}
                                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-[10px] leading-relaxed font-mono text-emerald-300/80">{data.mechanistic_narrative.recommendation}</div>
                            </CardContent>
                        </Card>

                        {/* Shadow Phenotypes */}
                        <Card className="bg-[#0a0a1a]/60 border-white/5 backdrop-blur-2xl shadow-2xl">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-white"><Eye className="w-4 h-4 text-violet-400" />Shadow Phenotypes</CardTitle>
                                <CardDescription className="text-[10px]">Predicted future symptom emergence</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {data.shadow_phenotypes.map((sp, i) => (
                                    <motion.div key={sp.hpo_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-violet-500/30 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-[11px] font-bold text-white">{sp.label}</p>
                                                <p className="text-[9px] text-slate-500 font-mono">{sp.hpo_id}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-rose-400">{(sp.probability * 100).toFixed(0)}%</p>
                                                <p className="text-[8px] text-slate-500 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{sp.time_horizon_months}mo</p>
                                            </div>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${sp.probability * 100}%` }} transition={{ duration: 1, delay: i * 0.15 }} className="h-full bg-gradient-to-r from-violet-600 to-rose-500 rounded-full" />
                                        </div>
                                        <p className="text-[8px] text-slate-500 mt-1.5">via {sp.source_disease}</p>
                                    </motion.div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Spectral Terminal */}
                        <Card className="bg-black/60 border-white/5 backdrop-blur-2xl shadow-2xl h-[220px] flex flex-col">
                            <CardHeader className="py-3 bg-white/5 border-b border-white/5">
                                <CardTitle className="text-[10px] font-mono uppercase tracking-[0.2em] flex items-center gap-2 text-slate-400"><Terminal className="w-3 h-3" />AntropiX Convergence Log</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-4 font-mono text-[10px] text-rose-400/80 space-y-1.5 scrollbar-hide">
                                {data.spectral_log.map((log, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex gap-2">
                                        <span className="text-slate-600 shrink-0">[{new Date().toLocaleTimeString('en-GB')}]</span>
                                        <span className={log.includes('CRITICAL') || log.includes('BOTTLENECK') || log.includes('BIFURCATION') ? 'text-red-400 font-bold' : ''}>{log}</span>
                                    </motion.div>
                                ))}
                                <div className="animate-pulse">_</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ═══ RIGHT COLUMN (8/12) ═══ */}
                    <div className="lg:col-span-8 space-y-8">
                        <Tabs defaultValue="attractor" className="w-full" onValueChange={setActiveTab}>
                            <div className="flex justify-between items-end mb-4">
                                <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl">
                                    <TabsTrigger value="attractor" className="rounded-lg data-[state=active]:bg-rose-500 data-[state=active]:text-white transition-all px-5 py-2 text-xs"><Target className="w-3.5 h-3.5 mr-1.5" />Attractor</TabsTrigger>
                                    <TabsTrigger value="radar" className="rounded-lg data-[state=active]:bg-rose-500 data-[state=active]:text-white transition-all px-5 py-2 text-xs"><Shield className="w-3.5 h-3.5 mr-1.5" />Evidence</TabsTrigger>
                                    <TabsTrigger value="cascade" className="rounded-lg data-[state=active]:bg-rose-500 data-[state=active]:text-white transition-all px-5 py-2 text-xs"><Zap className="w-3.5 h-3.5 mr-1.5" />Cascade</TabsTrigger>
                                    <TabsTrigger value="twin" className="rounded-lg data-[state=active]:bg-rose-500 data-[state=active]:text-white transition-all px-5 py-2 text-xs"><FlaskConical className="w-3.5 h-3.5 mr-1.5" />Twin</TabsTrigger>
                                </TabsList>
                                <div className="text-right">
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono"><Activity className="w-3 h-3 text-rose-400 animate-pulse" />LIVE ATTRACTOR FIELD</div>
                                </div>
                            </div>

                            {/* TAB 1: ATTRACTOR FIELD 3D */}
                            <TabsContent value="attractor" className="mt-0 ring-0 outline-none">
                                <Card className="bg-[#0a0a1a]/60 border-white/5 backdrop-blur-2xl shadow-3xl h-[580px] relative overflow-hidden border-rose-500/10">
                                    <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent pointer-events-none z-10" />
                                    <AttractorFieldSVG data={data} />
                                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-20 pointer-events-none">
                                        <div className="flex gap-6">
                                            <div><p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Space</p><p className="text-xs font-bold text-white">Poincaré Disk (κ=-1)</p></div>
                                            <div><p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Attractors</p><p className="text-xs font-bold text-white">{data.attractor_field.attractors.length}</p></div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 border border-white/5 backdrop-blur-md"><div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" /><span className="text-[9px] font-mono text-slate-400">Patient</span></div>
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 border border-white/5 backdrop-blur-md"><div className="w-2 h-2 rounded-full bg-rose-400" /><span className="text-[9px] font-mono text-slate-400">Attractors</span></div>
                                        </div>
                                    </div>
                                </Card>
                            </TabsContent>

                            {/* TAB 2: KINETIC EVIDENCE RADAR */}
                            <TabsContent value="radar" className="mt-0 ring-0 outline-none">
                                <div className="grid md:grid-cols-2 gap-6 h-[580px]">
                                    <Card className="bg-[#0a0a1a]/60 border-white/5 backdrop-blur-2xl shadow-3xl flex flex-col items-center justify-center p-6 border-rose-500/10">
                                        <CardHeader className="w-full pt-0"><CardTitle className="text-sm font-bold flex items-center gap-2"><Shield className="w-4 h-4 text-rose-400" />Kinetic Evidence Radar</CardTitle><CardDescription className="text-[10px]">Bayesian uncertainty per evidence axis</CardDescription></CardHeader>
                                        <div className="w-full flex-1">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                                    <PolarGrid stroke="#ffffff08" />
                                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 9, fontFamily: 'monospace' }} />
                                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                    <Radar name="Evidence" dataKey="A" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.2} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333', fontSize: '10px' }} />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </Card>
                                    <Card className="bg-[#0a0a1a]/60 border-white/5 backdrop-blur-2xl shadow-3xl p-6 flex flex-col border-rose-500/10">
                                        <CardHeader className="pt-0"><CardTitle className="text-sm font-bold">Evidence Reliability</CardTitle></CardHeader>
                                        <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                                            {data.evidence_reliability.map((ev, i) => (
                                                <motion.div key={ev.axis} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} className="space-y-1.5">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${ev.effect === 'glow' ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : ev.effect === 'blur' ? 'bg-slate-600 blur-[1px]' : 'bg-amber-400'}`} />
                                                            <span className="text-[11px] font-bold text-white">{ev.axis}</span>
                                                        </div>
                                                        <span className="text-[10px] font-mono text-slate-400">{ev.intensity}%</span>
                                                    </div>
                                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                        <motion.div initial={{ width: 0 }} animate={{ width: `${ev.intensity}%` }} transition={{ duration: 1, delay: i * 0.1 }} className={`h-full rounded-full ${ev.effect === 'glow' ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_8px_#10b981]' : ev.effect === 'blur' ? 'bg-slate-600' : 'bg-gradient-to-r from-amber-600 to-amber-400'}`} />
                                                    </div>
                                                    <p className="text-[8px] text-slate-600 font-mono">{ev.source} | pulse: {ev.pulse_speed}s</p>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </Card>
                                </div>
                            </TabsContent>

                            {/* TAB 3: MOLECULAR CASCADE */}
                            <TabsContent value="cascade" className="mt-0 ring-0 outline-none">
                                <Card className="bg-[#0a0a1a]/60 border-white/5 backdrop-blur-2xl shadow-3xl h-[580px] p-8 border-orange-500/10 flex flex-col">
                                    <div className="flex items-center gap-2 mb-6"><Zap className="w-5 h-5 text-orange-400" /><h3 className="text-lg font-bold text-white tracking-tight">Molecular Cascade Wavefront</h3></div>
                                    <div className="flex-1 flex items-center">
                                        <div className="w-full flex items-center justify-between gap-2 relative">
                                            {/* Connection lines */}
                                            <div className="absolute top-1/2 left-[8%] right-[8%] h-[2px] bg-white/5 -translate-y-1/2" />
                                            {data.cascade_wavefront.map((node, i) => {
                                                const isActive = cascadeStep >= node.stage;
                                                const isCurrentWave = cascadeStep === node.stage;
                                                return (
                                                    <motion.div key={node.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="relative flex flex-col items-center gap-3 z-10 flex-1">
                                                        <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${node.is_bottleneck && isActive ? 'bg-red-500/20 border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] scale-110' : isActive ? 'bg-white/10 border border-white/20 shadow-lg' : 'bg-white/5 border border-white/5'}`}>
                                                            {node.is_bottleneck && isActive && (
                                                                <>
                                                                    <div className="absolute inset-0 rounded-2xl animate-ping bg-red-500/20" />
                                                                    {[...Array(8)].map((_, j) => (
                                                                        <motion.div key={j} initial={{ scale: 0, opacity: 1 }} animate={{ scale: 3, opacity: 0, x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 80 }} transition={{ duration: 1, repeat: Infinity, delay: j * 0.1 }} className="absolute w-1.5 h-1.5 bg-red-400 rounded-full" />
                                                                    ))}
                                                                </>
                                                            )}
                                                            {isCurrentWave && !node.is_bottleneck && <div className="absolute inset-0 rounded-2xl animate-ping bg-cyan-400/10" />}
                                                            <div className="text-lg font-bold" style={{ color: isActive ? node.color : '#475569' }}>{(node.signal_strength * 100).toFixed(0)}%</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-[9px] font-bold text-white whitespace-nowrap">{node.label}</p>
                                                            <p className="text-[8px] text-slate-500 font-mono">{node.is_bottleneck ? '⚡ BOTTLENECK' : `S${node.stage}`}</p>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="mt-6 p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-[10px] text-red-300/80 font-mono leading-relaxed">
                                        <span className="font-bold text-red-400">⚡ BOTTLENECK ANALYSIS:</span> Signal fracture at Network Diffusion node — rare variant in {data.gene} causes {((1 - (data.cascade_wavefront.find(c => c.is_bottleneck)?.signal_strength || 0.5)) * 100).toFixed(0)}% signal attenuation. Downstream clinical confidence degraded.
                                    </div>
                                </Card>
                            </TabsContent>

                            {/* TAB 4: DIGITAL TWIN */}
                            <TabsContent value="twin" className="mt-0 ring-0 outline-none">
                                <Card className="bg-[#0a0a1a]/60 border-white/5 backdrop-blur-2xl shadow-3xl h-[580px] p-8 border-emerald-500/10 flex flex-col">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2"><FlaskConical className="w-5 h-5 text-emerald-400" /><h3 className="text-lg font-bold text-white">Digital Twin Simulator</h3></div>
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => setTwinMode('knockout')} className={`text-xs rounded-lg ${twinMode === 'knockout' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-slate-400'}`}>Gene Knockout</Button>
                                            <Button size="sm" onClick={() => setTwinMode('drug')} className={`text-xs rounded-lg ${twinMode === 'drug' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-slate-400'}`}>Drug Stabilization</Button>
                                        </div>
                                    </div>
                                    {twinMode === 'knockout' ? (
                                        <div className="flex-1 space-y-4 overflow-y-auto">
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-center"><p className="text-[9px] text-slate-500 uppercase mb-1">Fiedler Δ</p><p className="text-2xl font-bold text-red-400">{data.digital_twin.knockout.stability_change.toFixed(3)}</p></div>
                                                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-center"><p className="text-[9px] text-slate-500 uppercase mb-1">Disruption</p><p className="text-2xl font-bold text-red-400">{(data.digital_twin.knockout.network_disruption * 100).toFixed(1)}%</p></div>
                                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center"><p className="text-[9px] text-slate-500 uppercase mb-1">Baseline</p><p className="text-2xl font-bold text-slate-300">{data.digital_twin.baseline_fiedler.toFixed(4)}</p></div>
                                            </div>
                                            <h4 className="text-xs font-bold text-white uppercase tracking-wider mt-4">Impacted Genes</h4>
                                            {data.digital_twin.knockout.impacted_genes.map((ig: any, i: number) => (
                                                <motion.div key={ig.gene} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                                    <span className="text-sm font-bold text-white">{ig.gene}</span>
                                                    <div className="flex gap-6 text-[10px] font-mono">
                                                        <span className="text-slate-400">Before: {ig.baseline_interaction.toFixed(2)}</span>
                                                        <span className="text-red-400">After: {ig.knockout_interaction.toFixed(2)}</span>
                                                        <span className="text-red-500 font-bold">Δ {ig.delta.toFixed(2)}</span>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex-1 space-y-4">
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center"><p className="text-[9px] text-slate-500 uppercase mb-1">Fiedler Δ</p><p className="text-2xl font-bold text-emerald-400">+{data.digital_twin.drug_stabilization.stability_improvement.toFixed(3)}</p></div>
                                                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center"><p className="text-[9px] text-slate-500 uppercase mb-1">Resilience</p><p className="text-2xl font-bold text-emerald-400">{(data.digital_twin.drug_stabilization.network_resilience * 100).toFixed(0)}%</p></div>
                                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center"><p className="text-[9px] text-slate-500 uppercase mb-1">New Fiedler</p><p className="text-2xl font-bold text-emerald-300">{data.digital_twin.drug_stabilization.fiedler_value.toFixed(4)}</p></div>
                                            </div>
                                            <h4 className="text-xs font-bold text-white uppercase tracking-wider mt-4">Reinforced Interactions</h4>
                                            {data.digital_twin.drug_stabilization.reinforced_interactions.map((g: string, i: number) => (
                                                <motion.div key={g} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center"><Sparkles className="w-4 h-4 text-emerald-400" /></div>
                                                    <div><p className="text-sm font-bold text-white">{g}</p><p className="text-[9px] text-emerald-400/60 font-mono">Interaction reinforced ×1.5</p></div>
                                                </motion.div>
                                            ))}
                                            <div className="mt-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[10px] text-emerald-300/80 font-mono">
                                                Drug stabilization improves network Fiedler value by {(data.digital_twin.drug_stabilization.stability_improvement / data.digital_twin.baseline_fiedler * 100).toFixed(1)}%, reducing bifurcation probability.
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-20 py-16 border-t border-white/5 bg-black/40 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-rose-500/5 to-transparent opacity-20" />
                <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 opacity-60"><Radiation className="w-4 h-4 text-rose-400" /><span className="text-[10px] font-mono tracking-[0.3em] uppercase">GENESIS PREDICTIVE SYSTEMS BIOLOGY</span></div>
                    <div className="text-[10px] text-slate-600 tracking-widest text-center max-w-2xl leading-relaxed">
                        ANTROPIX USES RIEMANNIAN GEOMETRY ON POINCARÉ DISK MODELS AND LAPLACIAN SPECTRAL DECOMPOSITION. RESULTS ARE PROBABILISTIC AND INTENDED FOR RESEARCH USE ONLY. © 2025 GENESIS AI LABORATORIES.
                    </div>
                </div>
            </footer>
        </div>
    );
}
