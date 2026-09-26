'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Orbit, Brain, Gauge, ArrowLeft, Sparkles, Zap, Activity, Shield,
    AlertTriangle, Layers, Network, Cpu, Terminal, Search, ChevronRight,
    Atom, Dna, Beaker, Eye, Clock, Target, FlaskConical, Radiation, Users, Maximize
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, Tooltip
} from 'recharts';
import { StatusHub } from '@/components/StatusHub';
import { ConsultAI } from '@/components/ConsultAI';
import { CohortDeepZoom } from '@/components/CohortDeepZoom';


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
        { id: "input", label: "Genomic Input", stage: 0, signal_strength: 1.0, is_bottleneck: false, effect: "wave", color: "#3b82f6", delay_ms: 0 },
        { id: "variant", label: "Variant Analysis", stage: 1, signal_strength: 0.85, is_bottleneck: false, effect: "wave", color: "#2563eb", delay_ms: 400 },
        { id: "phenotype", label: "Phenotype Map", stage: 2, signal_strength: 0.7225, is_bottleneck: false, effect: "wave", color: "#1d4ed8", delay_ms: 800 },
        { id: "network", label: "Network Diffusion", stage: 3, signal_strength: 0.1842, is_bottleneck: true, effect: "explosion", color: "#f43f5e", delay_ms: 1200 },
        { id: "attractor", label: "Attractor Conv.", stage: 4, signal_strength: 0.5220, is_bottleneck: false, effect: "wave", color: "#06b6d4", delay_ms: 1600 },
        { id: "diagnosis", label: "Clinical Output", stage: 5, signal_strength: 0.4437, is_bottleneck: false, effect: "wave", color: "#0891b2", delay_ms: 2000 },
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
        "[GENESIS] Initializing Unified Intelligence Engine for FBN1...",
        "[MANIFOLD] Embedding 35 diseases into Poincaré Disk (κ = -1).",
        "[SPECTRAL] Laplacian eigendecomposition: Fiedler value = 0.441200",
        "[ENTROPY] Shannon weights computed for 6 phenotypic features.",
        "[ATTRACTOR] Strongest pull: Marfan Syndrome (g = 4.8200)",
        "[TWIN] Digital Twin simulation: knockout Δ-Fiedler = -0.260000",
        "[SHADOW] 4 latent shadow phenotypes detected.",
        "[CASCADE] Wavefront: BOTTLENECK DETECTED at Network Diffusion.",
        "[COHORT] PSN built: 23 patients, 4 communities resolved.",
        "[PAGERANK] Representative patient: PT-FBN1-007. Similarity: 78.4%.",
        "[NARRATIVE] Bifurcation: DETECTED — CRITICAL PATH",
        "[GENESIS] Analysis complete. Manifold convergence: SUCCESS.",
    ],
    // EntropiX data
    entropy_weights: {
        "HP:0001083": 0.88, "HP:0001382": 0.92, "HP:0001007": 0.45,
        "HP:0002108": 0.78, "HP:0002650": 0.65, "HP:0001166": 0.55
    },
    manifold_projection: [
        { id: "patient", label: "FBN1 (Patient)", x: 0.1, y: -0.2, z: 0, similarity: 1, type: "patient", glowing: true },
        { id: "d1", label: "Marfan Syndrome", x: 0.8, y: 0.5, z: -0.3, similarity: 0.92, type: "disease", glowing: false },
        { id: "d2", label: "Loeys-Dietz", x: -0.6, y: 0.7, z: 0.4, similarity: 0.61, type: "disease", glowing: false },
        { id: "d3", label: "Ehlers-Danlos", x: -0.9, y: -0.5, z: 0.6, similarity: 0.34, type: "disease", glowing: false },
        { id: "d4", label: "Stickler", x: 0.3, y: -0.9, z: -0.7, similarity: 0.28, type: "disease", glowing: false },
        { id: "d5", label: "Homocystinuria", x: -0.4, y: 0.1, z: 0.9, similarity: 0.15, type: "disease", glowing: false },
    ],
    diffusion_nodes: [
        { gene: "FBN1", heat: 1.0, is_source: true },
        { gene: "TGFBR1", heat: 0.72, is_source: false },
        { gene: "COL1A1", heat: 0.58, is_source: false },
        { gene: "ELN", heat: 0.41, is_source: false },
        { gene: "SMAD3", heat: 0.35, is_source: false },
        { gene: "NOTCH1", heat: 0.22, is_source: false },
        { gene: "MYH7", heat: 0.15, is_source: false },
    ],
    organ_risks: [
        { organ: "Cardiac", risk: 0.12 },
        { organ: "Ocular", risk: 0.05 },
        { organ: "Skeletal", risk: 0.08 },
    ],
    uncertainty_eigenvalue: 0.2581,
    differential_summary: "FBN1 variant drives primary signal through connective tissue PPI subgraph. Heat diffusion reveals TGFBR1 as strongest downstream target (72°C). Spectral gap of 0.4412 indicates moderate cluster separation — differential resolution is achievable but requires additional phenotypic evidence.",
    // Cohort Intelligence data
    cohort: {
        n_patients: 23, n_clusters: 4, patient_cluster: 1, cluster_similarity: 78.4,
        representative_patient: "PT-FBN1-007", best_treatment: "Losartan", most_likely_outcome: "Stable",
        cluster_summary: "Patient maps to Cluster #2 (78.4% avg. similarity, 7 members). This cluster historically responds well to Losartan and shows stable trajectory.",
        nodes: [
            { id: "CURRENT", x: 400, y: 280, cluster: 1, is_current: true, confidence: 0.95, has_genomic_data: true, disease: "Under Investigation", age: 28, n_phenotypes: 5 },
            { id: "PT-FBN1-001", x: 380, y: 240, cluster: 1, is_current: false, confidence: 0.92, has_genomic_data: true, disease: "Marfan Syndrome", age: 34, n_phenotypes: 6 },
            { id: "PT-FBN1-003", x: 420, y: 310, cluster: 1, is_current: false, confidence: 0.88, has_genomic_data: true, disease: "Marfan Syndrome", age: 41, n_phenotypes: 4 },
            { id: "PT-FBN1-007", x: 360, y: 300, cluster: 1, is_current: false, confidence: 0.91, has_genomic_data: true, disease: "Marfan Syndrome", age: 29, n_phenotypes: 7 },
            { id: "PT-FBN1-002", x: 200, y: 150, cluster: 0, is_current: false, confidence: 0.85, has_genomic_data: true, disease: "Loeys-Dietz Syndrome", age: 22, n_phenotypes: 5 },
            { id: "PT-FBN1-005", x: 240, y: 190, cluster: 0, is_current: false, confidence: 0.45, has_genomic_data: false, disease: "Loeys-Dietz Syndrome", age: 55, n_phenotypes: 3 },
            { id: "PT-FBN1-004", x: 580, y: 180, cluster: 2, is_current: false, confidence: 0.78, has_genomic_data: true, disease: "Ehlers-Danlos Syndrome", age: 19, n_phenotypes: 4 },
            { id: "PT-FBN1-006", x: 620, y: 220, cluster: 2, is_current: false, confidence: 0.33, has_genomic_data: false, disease: "Undiagnosed", age: 47, n_phenotypes: 2 },
            { id: "PT-FBN1-008", x: 300, y: 430, cluster: 3, is_current: false, confidence: 0.71, has_genomic_data: true, disease: "Hypermobile EDS", age: 36, n_phenotypes: 5 },
            { id: "PT-FBN1-009", x: 500, y: 420, cluster: 3, is_current: false, confidence: 0.62, has_genomic_data: true, disease: "Undiagnosed", age: 51, n_phenotypes: 3 },
        ],
        similarity_beams: [
            { target_id: "PT-FBN1-007", similarity: 0.89, shared_phenotypes: ["HP:0001083", "HP:0001382", "HP:0002108"], target_disease: "Marfan Syndrome", target_treatment: "Losartan", target_outcome: "Stable", confidence: 0.91 },
            { target_id: "PT-FBN1-001", similarity: 0.84, shared_phenotypes: ["HP:0001382", "HP:0002650"], target_disease: "Marfan Syndrome", target_treatment: "Atenolol", target_outcome: "Improved", confidence: 0.92 },
            { target_id: "PT-FBN1-003", similarity: 0.76, shared_phenotypes: ["HP:0002108", "HP:0001166"], target_disease: "Marfan Syndrome", target_treatment: "Monitor only", target_outcome: "Stable", confidence: 0.88 },
        ],
    },
};

// ═══════════════════════════════════════════════════════════
// 2D SVG ATTRACTOR FIELD (no WebGL required)
// ═══════════════════════════════════════════════════════════
const ATTRACTOR_COLORS = ['#3b82f6', '#2563eb', '#60a5fa', '#06b6d4', '#1d4ed8'];

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
    const [showCohortZoom, setShowCohortZoom] = useState(false);
    const [hoveredAttractor, setHoveredAttractor] = useState<any>(null);


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
            const res = await fetch(`http://localhost:8000/genesis-intelligence/${symbol}`);
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
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-500/8 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/8 blur-[150px] rounded-full" />
                <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] bg-rose-500/5 blur-[120px] rounded-full" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-blue-500/10 bg-[#02040a]/80 backdrop-blur-2xl">
                <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="group flex items-center gap-2 px-3 py-1.5 bg-blue-500/5 hover:bg-blue-500/10 rounded-full transition-all border border-blue-500/10">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-blue-400" />
                            <span className="text-[11px] font-medium text-blue-400/80 group-hover:text-blue-400 transition-colors font-mono tracking-wider">HOME</span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-blue-400 flex items-center justify-center p-0.5 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                                <div className="w-full h-full bg-[#02040a]/40 rounded-[10px] flex items-center justify-center backdrop-blur-sm">
                                    <Orbit className="w-6 h-6 text-white animate-[spin_10s_linear_infinite]" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-50 via-white to-blue-200">
                                    Anthropic<span className="text-blue-400">X</span>
                                </h1>
                                <p className="text-[9px] text-blue-500/70 font-mono uppercase tracking-[0.2em]">Cross-Modal Latent Attractor System</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <StatusHub />
                        <div className="flex gap-2 items-center">
                            <div className="relative">
                                <input value={gene} onChange={e => setGene(e.target.value.toUpperCase())} className="w-32 bg-blue-500/5 border border-blue-500/10 rounded-lg px-3 py-1.5 text-xs focus:border-blue-500/50 outline-none transition-all focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-600 font-mono text-blue-100" placeholder="GENE" />
                            </div>
                            <Button onClick={() => fetchAnalysis(gene)} disabled={loading} size="sm" className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 h-8 text-xs shadow-[0_2px_10px_rgba(37,99,235,0.3)]">
                                {loading ? '...' : 'Analyze'}
                            </Button>
                        </div>
                        {data.spectral_analysis.critical_path_alert && (
                            <div className="hidden lg:flex items-center gap-2 bg-blue-500/10 border border-blue-400/30 rounded-full px-3 py-1 backdrop-blur-md">
                                <AlertTriangle className="w-3 h-3 text-blue-400" />
                                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Stability Warning</span>
                            </div>
                        )}
                        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[9px] hidden md:inline-flex">κ=-1</Badge>
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-6 py-6 relative">
                {/* Mathematical Framework Overview */}
                <section className="mb-8 grid md:grid-cols-3 gap-4">
                    <Card className="bg-blue-500/5 border-blue-500/10 backdrop-blur-xl group hover:border-blue-400/40 transition-all">
                        <CardContent className="p-4">
                            <h3 className="text-[10px] font-mono text-blue-400 uppercase tracking-widest mb-3">Manifold Alignment</h3>
                            <div className="mb-3 h-[30px] flex items-center">
                                <svg width="240" height="30" viewBox="0 0 240 30">
                                    <text x="0" y="20" className="fill-blue-100 font-serif italic text-base">
                                        V<tspan dy="4" fontSize="10" fontStyle="normal">k</tspan><tspan dy="-4">(ℝ</tspan><tspan dy="-4" fontSize="10" fontStyle="normal">n</tspan><tspan dy="4">) = {"{ X ∈ ℝ"}</tspan><tspan dy="-4" fontSize="10" fontStyle="normal">n×k</tspan><tspan dy="4"> : X</tspan><tspan dy="-4" fontSize="10" fontStyle="normal">T</tspan><tspan dy="4">X = I</tspan><tspan dy="4" fontSize="10" fontStyle="normal">k</tspan><tspan dy="-4"> {"}"}</tspan>
                                    </text>
                                </svg>
                            </div>
                            <p className="text-[9px] text-slate-400 leading-relaxed font-mono">
                                Patient genomes are projected onto a Stiefel Manifold ensuring orthogonal latent feature preservation in high-dimensional space.
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-blue-500/5 border-blue-500/10 backdrop-blur-xl group hover:border-blue-400/40 transition-all">
                        <CardContent className="p-4">
                            <h3 className="text-[10px] font-mono text-blue-400 uppercase tracking-widest mb-3">Stability Diffusion</h3>
                            <div className="mb-3 h-[30px] flex items-center">
                                <svg width="240" height="30" viewBox="0 0 240 30">
                                    <text x="0" y="20" className="fill-blue-100 font-serif italic text-base">
                                        λ<tspan dy="4" fontSize="10" fontStyle="normal">2</tspan><tspan dy="-4"> = min {"{"} x ⊥ 1, ||x||=1 {"}"} x</tspan><tspan dy="-4" fontSize="10" fontStyle="normal">T</tspan><tspan dy="4">L x</tspan>
                                    </text>
                                </svg>
                            </div>
                            <p className="text-[9px] text-slate-400 leading-relaxed font-mono">
                                Algebraic connectivity (Fiedler value) measures the spectral gap in the gene-phenotype interaction network.
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-blue-500/5 border-blue-500/10 backdrop-blur-xl group hover:border-rose-400/40 transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 blur-2xl rounded-full" />
                        <CardContent className="p-4">
                            <h3 className="text-[10px] font-mono text-rose-400 uppercase tracking-widest mb-3">Information Entropy</h3>
                            <div className="mb-3 h-[30px] flex items-center">
                                <svg width="240" height="30" viewBox="0 0 240 30">
                                    <text x="0" y="20" className="fill-blue-100 font-serif italic text-base">
                                        H(X) = -Σ P(x<tspan dy="4" fontSize="10" fontStyle="normal">i</tspan><tspan dy="-4">) log</tspan><tspan dy="4" fontSize="10" fontStyle="normal">2</tspan><tspan dy="-4"> P(x</tspan><tspan dy="4" fontSize="10" fontStyle="normal">i</tspan><tspan dy="-4">)</tspan>
                                    </text>
                                </svg>
                            </div>
                            <p className="text-[9px] text-slate-400 leading-relaxed font-mono">
                                Shannon entropy weights phenotypic rarity, prioritizing low-frequency, high-information clinical signatures.
                            </p>
                        </CardContent>
                    </Card>
                </section>
                <Tabs defaultValue="attractor" className="w-full" onValueChange={setActiveTab}>
                    {/* ═══ FULL-WIDTH TAB BAR ═══ */}
                    <div className="flex items-center justify-between mb-5">
                        <TabsList className="bg-blue-500/5 border border-blue-500/10 p-1 rounded-xl">
                            <TabsTrigger value="attractor" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all px-4 py-2 text-xs"><Target className="w-3.5 h-3.5 mr-1.5" />Attractor</TabsTrigger>
                            <TabsTrigger value="topology" className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all px-4 py-2 text-xs"><Layers className="w-3.5 h-3.5 mr-1.5" />Topology</TabsTrigger>
                            <TabsTrigger value="entropy" className="rounded-lg data-[state=active]:bg-cyan-500 data-[state=active]:text-white transition-all px-4 py-2 text-xs"><Gauge className="w-3.5 h-3.5 mr-1.5" />Entropy</TabsTrigger>
                            <TabsTrigger value="diffusion" className="rounded-lg data-[state=active]:bg-blue-400 data-[state=active]:text-white transition-all px-4 py-2 text-xs"><Network className="w-3.5 h-3.5 mr-1.5" />Diffusion</TabsTrigger>
                            <TabsTrigger value="radar" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all px-4 py-2 text-xs"><Shield className="w-3.5 h-3.5 mr-1.5" />Evidence</TabsTrigger>
                            <TabsTrigger value="cascade" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all px-4 py-2 text-xs"><Zap className="w-3.5 h-3.5 mr-1.5" />Cascade</TabsTrigger>
                            <TabsTrigger value="twin" className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all px-4 py-2 text-xs"><FlaskConical className="w-3.5 h-3.5 mr-1.5" />Twin</TabsTrigger>
                            <TabsTrigger value="cohort" className="rounded-lg data-[state=active]:bg-blue-400 data-[state=active]:text-white transition-all px-4 py-2 text-xs"><Users className="w-3.5 h-3.5 mr-1.5" />Cohort</TabsTrigger>
                        </TabsList>
                        <div className="flex items-center gap-2 text-[10px] text-blue-500 font-mono shrink-0"><Activity className="w-3 h-3 text-blue-400 animate-pulse" />SYSTEM ONLINE</div>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-6">

                        {/* ═══ LEFT SIDEBAR (3/12) ═══ */}
                        <div className="lg:col-span-3 space-y-4">

                            {/* Confidence Metric */}
                            <Card className="bg-[#0a0a1a]/60 border-blue-500/10 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-600 to-cyan-500" />
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2"><Brain className="w-3.5 h-3.5 text-blue-400" /><span className="text-xs font-bold text-white">Narrative</span></div>
                                        {data.mechanistic_narrative.bifurcation_detected && <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[8px]">⚠ ANALYSIS GAP</Badge>}
                                    </div>
                                    <p className="text-[10px] leading-relaxed font-mono text-slate-300 bg-blue-500/5 p-2.5 rounded-lg border border-blue-500/5">{data.mechanistic_narrative.primary_analysis}</p>
                                    <p className="text-[9px] leading-relaxed font-mono text-blue-300/70 bg-blue-500/5 p-2 rounded-lg border border-blue-500/15">{data.mechanistic_narrative.recommendation}</p>
                                </CardContent>
                            </Card>

                            {/* Shadow Phenotypes */}
                            <Card className="bg-[#0a0a1a]/60 border-blue-500/10 backdrop-blur-2xl shadow-2xl">
                                <CardContent className="p-4 space-y-2.5">
                                    <div className="flex items-center gap-2 mb-1"><Eye className="w-3.5 h-3.5 text-blue-400" /><span className="text-xs font-bold text-white">Shadow Phenotypes</span></div>
                                    {data.shadow_phenotypes.map((sp, i) => (
                                        <motion.div key={sp.hpo_id} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="p-2.5 rounded-lg bg-blue-500/[0.02] border border-blue-500/5 hover:border-blue-500/30 transition-all group">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <div><p className="text-[10px] font-bold text-white group-hover:text-blue-200 transition-colors">{sp.label}</p><p className="text-[8px] text-slate-500 font-mono">{sp.hpo_id}</p></div>
                                                <div className="text-right"><p className={`text-sm font-bold ${sp.probability > 0.8 ? 'text-rose-400' : 'text-blue-400'}`}>{(sp.probability * 100).toFixed(0)}%</p><p className="text-[7px] text-slate-500">{sp.time_horizon_months}mo</p></div>
                                            </div>
                                            <div className="h-1 bg-blue-500/10 rounded-full overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${sp.probability * 100}%` }} transition={{ duration: 1, delay: i * 0.1 }} className={`h-full bg-gradient-to-r ${sp.probability > 0.8 ? 'from-rose-600 to-blue-500' : 'from-blue-600 to-cyan-500'} rounded-full`} />
                                            </div>
                                        </motion.div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Spectral Terminal */}
                            <Card className="bg-black/60 border-white/5 backdrop-blur-2xl shadow-2xl h-[200px] flex flex-col">
                                <CardHeader className="py-2 px-4 bg-white/5 border-b border-white/5">
                                    <CardTitle className="text-[9px] font-mono uppercase tracking-[0.2em] flex items-center gap-2 text-slate-400"><Terminal className="w-3 h-3" />AntropiX Log</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-y-auto p-3 font-mono text-[9px] text-rose-400/80 space-y-1 scrollbar-hide">
                                    {data.spectral_log.map((log, i) => (
                                        <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex gap-1.5">
                                            <span suppressHydrationWarning className="text-slate-600 shrink-0">[{new Date().toLocaleTimeString('en-GB')}]</span>
                                            <span className={log.includes('CRITICAL') || log.includes('BOTTLENECK') || log.includes('BIFURCATION') ? 'text-red-400 font-bold' : ''}>{log}</span>
                                        </motion.div>
                                    ))}
                                    <div className="animate-pulse">_</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* ═══ RIGHT COLUMN (9/12) ═══ */}
                        <div className="lg:col-span-9">

                            {/* TAB 1: ATTRACTOR FIELD 3D */}
                            <TabsContent value="attractor" className="mt-0 ring-0 outline-none">
                                <Card className="bg-[#0a0a1a]/60 border-white/5 backdrop-blur-2xl shadow-3xl h-[580px] relative overflow-hidden border-rose-500/10">
                                    <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent pointer-events-none z-10" />
                                    <svg viewBox="0 0 800 600" className="w-full h-full">
                                        <defs>
                                            <radialGradient id="grad0" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                                                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.6" />
                                                <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                                            </radialGradient>
                                            <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                                                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
                                                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                                            </radialGradient>
                                            <radialGradient id="grad2" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                            </radialGradient>
                                        </defs>

                                        {/* Grid Lines */}
                                        <g opacity="0.1">
                                            {[...Array(12)].map((_, i) => (
                                                <line key={`v${i}`} x1={i * 80} y1="0" x2={i * 80} y2="600" stroke="white" strokeWidth="1" />
                                            ))}
                                            {[...Array(8)].map((_, i) => (
                                                <line key={`h${i}`} x1="0" y1={i * 80} x2="800" y2={i * 80} stroke="white" strokeWidth="1" />
                                            ))}
                                        </g>

                                        {/* Poincaré Disk Boundary */}
                                        <circle cx="400" cy="300" r="280" fill="none" stroke="white" strokeWidth="1" opacity="0.1" strokeDasharray="4 4" />

                                        {/* Connection Curves */}
                                        {data.attractor_field.attractors.map((attr, i: number) => {
                                            const cx = 400 + attr.x * 50;
                                            const cy = 290 + attr.y * 50;
                                            return (
                                                <path key={`path${i}`} d={`M 400 300 Q ${400 + (cx - 400) * 0.5 + (i % 2 === 0 ? 50 : -50)} ${300 + (cy - 300) * 0.5} ${cx} ${cy}`}
                                                    stroke="white" strokeWidth="1" opacity="0.2" fill="none" />
                                            );
                                        })}

                                        {/* Patient Node */}
                                        <g>
                                            <circle cx="400" cy="300" r="6" fill="#06b6d4">
                                                <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
                                                <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite" />
                                            </circle>
                                            <circle cx="400" cy="300" r="20" fill="#06b6d4" opacity="0.2">
                                                <animate attributeName="r" values="20;30;20" dur="2s" repeatCount="indefinite" />
                                                <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite" />
                                            </circle>
                                            <text x="400" y="335" textAnchor="middle" fill="#06b6d4" fontSize="10" fontWeight="bold">PATIENT</text>
                                        </g>

                                        {/* Attractor Nodes */}
                                        {data.attractor_field.attractors.map((attr, i: number) => {
                                            const cx = 400 + attr.x * 50;
                                            const cy = 290 + attr.y * 50;
                                            const radius = attr.radius * 40;
                                            return (
                                                <g key={i}
                                                    onMouseEnter={() => setHoveredAttractor({ ...attr, cx, cy })}
                                                    onMouseLeave={() => setHoveredAttractor(null)}
                                                    className="cursor-pointer transition-all duration-300 hover:opacity-100"
                                                >
                                                    {/* Gravity Well Gradient */}
                                                    <circle cx={cx} cy={cy} r={radius} fill={`url(#grad${i % 3})`} opacity={0.6} />

                                                    {/* Core Node */}
                                                    <circle cx={cx} cy={cy} r={4} fill="white" />

                                                    {/* Label */}
                                                    <text x={cx} y={cy - radius - 10} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">{attr.disease_name}</text>
                                                    <text x={cx} y={cy + 5} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="8">{attr.gravity}g</text>
                                                </g>
                                            );
                                        })}

                                        {/* Tooltip Overlay */}
                                        {hoveredAttractor && (
                                            <g pointerEvents="none">
                                                <rect x={hoveredAttractor.cx + 20} y={hoveredAttractor.cy - 40} width="160" height="70" rx="4" fill="rgba(10,10,20,0.95)" stroke="rgba(255,255,255,0.15)" />
                                                <text x={hoveredAttractor.cx + 30} y={hoveredAttractor.cy - 25} fill="white" fontSize="10" fontWeight="bold">{hoveredAttractor.disease_name}</text>
                                                <text x={hoveredAttractor.cx + 30} y={hoveredAttractor.cy - 10} fill="#94a3b8" fontSize="9" fontFamily="monospace">Gravity Field: {hoveredAttractor.gravity}g</text>
                                                <text x={hoveredAttractor.cx + 30} y={hoveredAttractor.cy + 2} fill="#94a3b8" fontSize="9" fontFamily="monospace">Poincaré Dist: {hoveredAttractor.poincare_distance}</text>
                                                <text x={hoveredAttractor.cx + 30} y={hoveredAttractor.cy + 14} fill={hoveredAttractor.confidence > 0.5 ? "#f43f5e" : "#94a3b8"} fontSize="9" fontFamily="monospace" fontWeight="bold">
                                                    Confidence: {(hoveredAttractor.confidence * 100).toFixed(0)}%
                                                </text>
                                            </g>
                                        )}
                                    </svg>
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
                                                    <Radar name="Evidence" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
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
                                            <div className="absolute top-1/2 left-[8%] right-[8%] h-[2px] bg-blue-500/5 -translate-y-1/2" />
                                            {data.cascade_wavefront.map((node, i) => {
                                                const isActive = cascadeStep >= node.stage;
                                                const isCurrentWave = cascadeStep === node.stage;
                                                return (
                                                    <motion.div key={node.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="relative flex flex-col items-center gap-3 z-10 flex-1">
                                                        <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${node.is_bottleneck && isActive ? 'bg-rose-500/20 border-2 border-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.5)] scale-110' : isActive ? 'bg-blue-500/10 border border-blue-500/20 shadow-lg' : 'bg-blue-500/5 border border-blue-500/5'}`}>
                                                            {node.is_bottleneck && isActive && (
                                                                <>
                                                                    <div className="absolute inset-0 rounded-2xl animate-ping bg-rose-500/20" />
                                                                    {[...Array(8)].map((_, j) => (
                                                                        <motion.div key={j} initial={{ scale: 0, opacity: 1 }} animate={{ scale: 3, opacity: 0, x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 80 }} transition={{ duration: 1, repeat: Infinity, delay: j * 0.1 }} className="absolute w-1.5 h-1.5 bg-rose-400 rounded-full" />
                                                                    ))}
                                                                </>
                                                            )}
                                                            {isCurrentWave && !node.is_bottleneck && <div className="absolute inset-0 rounded-2xl animate-ping bg-cyan-400/10" />}
                                                            <div className="text-lg font-bold" style={{ color: isActive ? (node.is_bottleneck ? '#f43f5e' : node.color) : '#475569' }}>{(node.signal_strength * 100).toFixed(0)}%</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-[9px] font-bold text-white whitespace-nowrap">{node.label}</p>
                                                            <p className="text-[8px] text-slate-500 font-mono">{node.is_bottleneck ? '⚠ SIGNAL FRACTURE' : `S${node.stage}`}</p>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="mt-6 p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 text-[10px] text-rose-300/80 font-mono leading-relaxed">
                                        <span className="font-bold text-rose-400">⚠ NETWORK FRAGILITY:</span> Signal fracture detected at Network Diffusion node — rare variant in {data.gene} causes {((1 - (data.cascade_wavefront.find(c => c.is_bottleneck)?.signal_strength || 0.5)) * 100).toFixed(0)}% information loss. Manifold stability degraded.
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
                                                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-center"><p className="text-[9px] text-slate-500 uppercase mb-1">Fiedler \u0394</p><p className="text-2xl font-bold text-blue-400">{data.digital_twin.knockout.stability_change.toFixed(3)}</p></div>
                                                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-center"><p className="text-[9px] text-slate-500 uppercase mb-1">Disruption</p><p className="text-2xl font-bold text-blue-400">{(data.digital_twin.knockout.network_disruption * 100).toFixed(1)}%</p></div>
                                                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-center"><p className="text-[9px] text-slate-500 uppercase mb-1">Baseline</p><p className="text-2xl font-bold text-slate-300">{data.digital_twin.baseline_fiedler.toFixed(4)}</p></div>
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

                            {/* TAB: TOPOLOGY (from EntropiX) */}
                            <TabsContent value="topology" className="mt-0 ring-0 outline-none">
                                <Card className="bg-[#0a0a1a]/60 border-white/5 backdrop-blur-2xl shadow-3xl h-[580px] relative overflow-hidden border-cyan-500/20">
                                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                                    <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
                                        <div className="absolute w-[200%] h-[200%] top-[-50%] left-[-50%] rotate-[15deg]">
                                            {[...Array(20)].map((_, i) => (<div key={i} className="w-full h-[0.5px] bg-cyan-500/30 mb-[100px]" />))}
                                        </div>
                                    </div>
                                    <div className="w-full h-full flex items-center justify-center p-20 relative">
                                        <div className="absolute w-[300px] h-[300px] rounded-full border border-dashed border-cyan-500/20 animate-spin-slow opacity-40 shrink-0" />
                                        <div className="absolute w-[450px] h-[450px] rounded-full border border-dashed border-violet-500/10 animate-spin-reverse opacity-40 shrink-0" />
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            <AnimatePresence>
                                                {data.manifold_projection.map((node: any) => (
                                                    <motion.div key={node.id} initial={{ opacity: 0, scale: 0 }}
                                                        animate={{ opacity: 1, scale: 1, x: node.x * 120, y: node.y * 120 }}
                                                        className="absolute group/node flex flex-col items-center justify-center">
                                                        <div className={`w-3 h-3 rounded-full ${node.type === 'patient' ? 'bg-cyan-400 shadow-[0_0_30px_#06b6d4]' : 'bg-slate-700/80 border border-white/10'} transition-all group-hover/node:scale-150`}>
                                                            {node.glowing && <div className="absolute inset-0 rounded-full animate-ping bg-cyan-500/40" />}
                                                        </div>
                                                        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-[8px] whitespace-nowrap font-mono text-slate-400 opacity-60 pointer-events-none">{node.label}</div>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-6 left-6 flex gap-6">
                                        <div><p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Manifold</p><p className="text-xs font-bold text-white">Stiefel V_k(R^n)</p></div>
                                        <div><p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Nodes</p><p className="text-xs font-bold text-white">{data.manifold_projection.length}</p></div>
                                    </div>
                                </Card>
                            </TabsContent>

                            {/* TAB: ENTROPY RADAR (from EntropiX) */}
                            <TabsContent value="entropy" className="mt-0 ring-0 outline-none">
                                <div className="grid md:grid-cols-2 gap-6 h-[580px]">
                                    <Card className="bg-[#0a0a1a]/60 border-white/5 backdrop-blur-2xl shadow-3xl flex flex-col items-center justify-center p-6 border-cyan-500/10">
                                        <CardHeader className="w-full pt-0"><CardTitle className="text-sm font-bold flex items-center gap-2"><Shield className="w-4 h-4 text-cyan-400" />Entropy Radar</CardTitle><CardDescription className="text-[10px]">Shannon entropy weighting (H-Based)</CardDescription></CardHeader>
                                        <div className="w-full flex-1">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={Object.entries(data.entropy_weights).map(([k, v]: [string, any]) => ({ subject: k, A: v * 100, fullMark: 100 }))}>
                                                    <PolarGrid stroke="#ffffff10" />
                                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 8, fontFamily: 'monospace' }} />
                                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                    <Radar name="Weights" dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333', fontSize: '10px' }} />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </Card>
                                    <Card className="bg-[#0a0a1a]/60 border-white/5 backdrop-blur-2xl shadow-3xl p-6 flex flex-col border-cyan-500/10">
                                        <CardHeader className="pt-0"><CardTitle className="text-sm font-bold">Phenotype Specificity</CardTitle></CardHeader>
                                        <div className="flex-1 space-y-5 overflow-y-auto pr-2">
                                            {Object.entries(data.entropy_weights).sort((a: any, b: any) => b[1] - a[1]).map(([hpo, weight]: [string, any], i: number) => (
                                                <div key={hpo} className="space-y-1.5">
                                                    <div className="flex justify-between items-end">
                                                        <div><span className="text-[10px] font-mono text-cyan-500/80 font-bold">{hpo}</span></div>
                                                        <span className="text-xs font-mono text-cyan-400">{(weight * 100).toFixed(1)}%</span>
                                                    </div>
                                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                        <motion.div initial={{ width: 0 }} animate={{ width: `${weight * 100}%` }} transition={{ duration: 1, delay: i * 0.1 }} className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-cyan-300" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </div>
                            </TabsContent>

                            {/* TAB: HEAT DIFFUSION (from EntropiX) */}
                            <TabsContent value="diffusion" className="mt-0 ring-0 outline-none">
                                <Card className="bg-[#0a0a1a]/60 border-blue-500/10 backdrop-blur-2xl shadow-3xl h-[580px] p-8 flex flex-col overflow-hidden">
                                    <div className="grid md:grid-cols-2 gap-8 h-full">
                                        <div className="flex flex-col gap-6">
                                            <div><div className="flex items-center gap-2"><Zap className="w-5 h-5 text-blue-400" /><h3 className="text-lg font-bold text-white tracking-tighter">Heat Pulse Predictor</h3></div><p className="text-xs text-slate-400 mt-1">Disease progression modeled as fluid dynamics across PPI network.</p></div>
                                            <div className="space-y-4">
                                                {data.diffusion_nodes.map((node: any, i: number) => (
                                                    <div key={node.gene}>
                                                        <div className="flex items-center justify-between mb-1.5 px-1">
                                                            <span className={`text-[11px] font-bold ${node.is_source ? 'text-blue-400' : 'text-slate-200'}`}>{node.gene} {node.is_source && '(SOURCE)'}</span>
                                                            <span className="text-[10px] font-mono text-slate-500">{(node.heat * 100).toFixed(2)}°C</span>
                                                        </div>
                                                        <div className="h-3 bg-blue-500/5 border border-blue-500/10 rounded-full overflow-hidden">
                                                            <motion.div initial={{ width: 0 }} animate={{ width: `${node.heat * 100}%` }} transition={{ duration: 1.5, ease: "circOut" }}
                                                                className={`h-full ${node.is_source ? 'bg-gradient-to-r from-blue-600 to-cyan-500 shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-slate-700'}`} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex flex-col justify-between">
                                            <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20 relative overflow-hidden">
                                                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Differential Logic Summary</h4>
                                                <div className="font-mono text-[11px] leading-relaxed text-slate-100 bg-black/40 p-4 rounded-xl border border-blue-500/10">{data.differential_summary}</div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4 mt-6">
                                                {data.organ_risks.map((risk: any, i: number) => (
                                                    <motion.div key={i} whileHover={{ y: -5 }} className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2">
                                                        <div className="w-10 h-10 rounded-full bg-blue-900/40 flex items-center justify-center">
                                                            <Sparkles className={`w-5 h-5 ${i === 0 ? 'text-blue-400' : i === 1 ? 'text-cyan-400' : 'text-blue-200'}`} />
                                                        </div>
                                                        <div><p className="text-[9px] text-slate-500 font-bold uppercase">{risk.organ}</p><p className="text-xl font-bold text-white tracking-tighter">{(risk.risk * 100).toFixed(1)}%</p></div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </TabsContent>

                            {/* TAB: COHORT INTELLIGENCE (NEW) */}
                            <TabsContent value="cohort" className="mt-0 ring-0 outline-none">
                                <Card className="bg-[#0a0a1a]/60 border-white/5 backdrop-blur-2xl shadow-3xl h-[580px] p-6 border-violet-500/10 flex flex-col overflow-hidden">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xs font-bold text-white flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" />Patient Similarity Network</h3>
                                        <div className="flex gap-2">
                                            <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/20">Louvain Modularity: 0.62</Badge>
                                            <Button variant="ghost" size="sm" onClick={() => setShowCohortZoom(true)} className="h-6 w-6 p-0 hover:bg-blue-500/10 text-slate-400 hover:text-white"><Maximize className="w-3.5 h-3.5" /></Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2"><Users className="w-5 h-5 text-blue-400" /><h3 className="text-lg font-bold text-white">Cohort Intelligence</h3><Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[9px]">{data.cohort.n_patients} patients</Badge></div>
                                        <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[9px]">{data.cohort.n_clusters} clusters</Badge>
                                    </div>
                                    <div className="flex-1 grid md:grid-cols-5 gap-4 min-h-0">
                                        {/* Constellation Map */}
                                        <div className="md:col-span-3 relative bg-black/40 rounded-xl border border-blue-500/10 overflow-hidden">
                                            <svg viewBox="0 0 800 530" className="w-full h-full">
                                                <defs>
                                                    <radialGradient id="grad0" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                                    </radialGradient>
                                                    <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                                                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.8" />
                                                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                                                    </radialGradient>
                                                    <radialGradient id="grad2" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                                                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                                                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                                                    </radialGradient>
                                                </defs>
                                                {/* Similarity beams */}
                                                {data.cohort.similarity_beams.map((beam: any, i: number) => {
                                                    const target = data.cohort.nodes.find((n: any) => n.id === beam.target_id);
                                                    const current = data.cohort.nodes.find((n: any) => n.is_current);
                                                    if (!target || !current) return null;
                                                    return (<motion.line key={i} x1={current.x} y1={current.y} x2={target.x} y2={target.y}
                                                        stroke="#3b82f6" strokeWidth={beam.similarity * 3} opacity={beam.confidence * 0.6}
                                                        strokeDasharray={beam.confidence < 0.8 ? "6 4" : "none"}
                                                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: i * 0.3 }} />);
                                                })}
                                                {/* Patient nodes */}
                                                {data.cohort.nodes.map((node: any, i: number) => {
                                                    const CLUSTER_COLORS = ['#3b82f6', '#f43f5e', '#10b981', '#f59e0b'];
                                                    const color = node.is_current ? '#06b6d4' : CLUSTER_COLORS[node.cluster % 4];
                                                    const r = node.is_current ? 10 : 5 + node.n_phenotypes * 0.8;
                                                    return (<g key={node.id}>
                                                        {node.is_current && <motion.circle cx={node.x} cy={node.y} r={25} fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.3"
                                                            animate={{ r: [20, 30, 20] }} transition={{ duration: 2, repeat: Infinity }} />}
                                                        <circle cx={node.x} cy={node.y} r={r} fill={color} opacity={node.has_genomic_data ? 0.9 : 0.3}
                                                            stroke={node.is_current ? '#06b6d4' : 'none'} strokeWidth={node.is_current ? 2 : 0}
                                                            filter={!node.has_genomic_data ? 'url(#blur-sm)' : 'none'} />
                                                        {(node.is_current || node.id === data.cohort.representative_patient) && (
                                                            <text x={node.x} y={node.y - r - 6} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">{node.is_current ? 'YOU' : 'REP'}</text>
                                                        )}
                                                    </g>);
                                                })}

                                            </svg>
                                            <div className="absolute bottom-2 left-2 flex gap-3">
                                                {['#3b82f6', '#f43f5e', '#10b981', '#f59e0b'].map((c, i) => (
                                                    <div key={i} className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: c }} /><span className="text-[8px] text-slate-500 font-mono">C{i}</span></div>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Clinical Comparison */}
                                        <div className="md:col-span-2 flex flex-col gap-3 overflow-y-auto">
                                            <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/20 text-[10px] font-mono text-violet-300/80 leading-relaxed">{data.cohort.cluster_summary}</div>
                                            <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Top Similar Cases</h4>
                                            {data.cohort.similarity_beams.map((beam: any, i: number) => (
                                                <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}
                                                    className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-violet-500/30 transition-all space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[11px] font-bold text-white">{beam.target_id}</span>
                                                        <span className="text-lg font-bold text-violet-400">{(beam.similarity * 100).toFixed(0)}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div initial={{ width: 0 }} animate={{ width: `${beam.similarity * 100}%` }} transition={{ duration: 1 }}
                                                            className="h-full bg-gradient-to-r from-violet-600 to-cyan-400 rounded-full" />
                                                    </div>
                                                    <div className="flex justify-between text-[9px] font-mono text-slate-500">
                                                        <span>Dx: {beam.target_disease}</span><span>Tx: {beam.target_treatment}</span>
                                                    </div>
                                                    <div className="flex gap-1 flex-wrap">
                                                        {beam.shared_phenotypes.map((p: string) => (<Badge key={p} className="text-[7px] bg-violet-500/10 text-violet-400 border-violet-500/20 px-1.5 py-0">{p}</Badge>))}
                                                    </div>
                                                    {beam.confidence < 0.8 && <p className="text-[8px] text-amber-400/60 italic">⚠ Low genomic confidence — beam flickering</p>}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            </TabsContent>
                        </div>
                    </div>
                </Tabs>
                <ConsultAI />
                <AnimatePresence>
                    {showCohortZoom && <CohortDeepZoom nodes={MOCK_DATA.cohort.nodes} onClose={() => setShowCohortZoom(false)} />}
                </AnimatePresence>
            </main>

            {/* Footer */}
            <footer className="mt-20 py-16 border-t border-blue-500/10 bg-black/40 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent opacity-20" />
                <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 opacity-60"><Radiation className="w-4 h-4 text-blue-400" /><span className="text-[10px] font-mono tracking-[0.3em] uppercase">ANTHROPICX UNIFIED INTELLIGENCE</span></div>
                    <div className="text-[10px] text-slate-600 tracking-widest text-center max-w-2xl leading-relaxed">
                        ANTHROPICX INTELLIGENCE COMBINES SPECTRAL GRAPH THEORY, RIEMANNIAN GEOMETRY, AND PATIENT SIMILARITY NETWORKS. RESULTS ARE PROBABILISTIC AND INTENDED FOR RESEARCH USE ONLY. © 2025 GENESIS AI LABORATORIES.
                    </div>
                </div>
            </footer>
        </div >
    );
}
