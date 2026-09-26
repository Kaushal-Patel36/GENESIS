'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Atom, Brain, Gauge, Info, ArrowLeft,
    Sparkles, Zap, Activity, Shield, AlertTriangle,
    Layers, Network, Cpu, Terminal, Search, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts';

// Mock data for initial render
const MOCK_ENTROPIX = {
    gene: "FBN1",
    entropy_weights: {
        "HP:0001083": 0.88,
        "HP:0001382": 0.92,
        "HP:0001007": 0.45,
        "HP:0002108": 0.78,
        "HP:0002650": 0.65,
        "HP:0001166": 0.55
    },
    diffusion_nodes: [
        { gene: "FBN1", heat: 1.0, is_source: true },
        { gene: "TGFB1", heat: 0.72, is_source: false },
        { gene: "LTBP1", heat: 0.65, is_source: false },
        { gene: "COL1A1", heat: 0.42, is_source: false },
        { gene: "ELN", heat: 0.38, is_source: false }
    ],
    manifold_projection: [
        { id: "current_patient", label: "Current Patient", type: "patient", x: 0, y: 0, z: 0, similarity: 1.0, glowing: true },
        { id: "OMIM:154700", label: "Marfan Syndrome", type: "disease", x: 1.2, y: 0.8, z: -0.5, similarity: 0.88 },
        { id: "OMIM:609192", label: "Loeys-Dietz Syndrome", type: "disease", x: -0.8, y: 1.5, z: 1.2, similarity: 0.74 },
        { id: "OMIM:121050", label: "MASS Syndrome", type: "disease", x: 2.1, y: -0.5, z: 0.8, similarity: 0.62 }
    ],
    uncertainty_eigenvalue: 0.258,
    differential_summary: "Patient clusters with 88% similarity to Marfan Syndrome based on Manifold Alignment; Diffusion model predicts 12% risk of secondary cardiac involvement in 24 months.",
    organ_risks: [
        { organ: "Cardiac", risk: 0.12 },
        { organ: "Ocular", risk: 0.05 },
        { organ: "Skeletal", risk: 0.08 }
    ],
    spectral_log: [
        "Initializing Bi-Partite Manifold Alignment for FBN1...",
        "Computing Shannon Entropy weights for 6 phenotypic features.",
        "Shannon Domain H_max: 1.000 | System Entropy H(x): 0.712",
        "Applying Heat Diffusion Kernel (beta=0.5) on PPI Graph.",
        "Spectral Gap (Fiedler Value): 0.4412",
        "Manifold Convergence: SUCCESS (ε < 1e-9).",
        "Clusters detected: 3 reference disease points."
    ]
};

export default function EntropiXPage() {
    const [data, setData] = useState(MOCK_ENTROPIX);
    const [loading, setLoading] = useState(false);
    const [gene, setGene] = useState("FBN1");
    const [jitter, setJitter] = useState(0);
    const [activeTab, setActiveTab] = useState("topology");

    // Uncertainty Jitter Effect
    useEffect(() => {
        const interval = setInterval(() => {
            const intensity = data.uncertainty_eigenvalue * 8;
            setJitter((Math.random() - 0.5) * intensity);
        }, 40);
        return () => clearInterval(interval);
    }, [data.uncertainty_eigenvalue]);

    const fetchAnalysis = async (symbol: string) => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/entropix/${symbol}`);
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const radarData = Object.entries(data.entropy_weights).map(([subject, value]) => ({
        subject,
        A: value * 100,
        fullMark: 100,
    }));

    return (
        <div className="min-h-screen bg-[#02020a] text-slate-200 selection:bg-cyan-500/30 overflow-x-hidden">
            {/* Dynamic Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-cyan-500/10 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 blur-[150px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15]" />

                {/* Manifold Lines Background Decor */}
                <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="white" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            <header className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-2xl">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="group p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-violet-600 flex items-center justify-center p-0.5 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                                <div className="w-full h-full bg-black/20 rounded-[10px] flex items-center justify-center">
                                    <Atom className="w-6 h-6 text-white animate-spin-slow" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-400">
                                    Entropi<span className="text-cyan-400">X</span>
                                </h1>
                                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">Spectral Diagnostic Engine</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-md">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                            <span className="text-[10px] font-medium text-slate-300">Stiefel Convergence: 99.8%</span>
                        </div>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                            v3.1.2-beta
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10 relative">
                <div className="grid lg:grid-cols-12 gap-8">

                    {/* Left Column (4/12): Analytics & Controls */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="bg-[#0a0a1a]/60 border-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Search className="w-20 h-20 text-cyan-400" />
                            </div>
                            <CardHeader>
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                                    <Cpu className="w-4 h-4 text-cyan-400" />
                                    Alignment Parameters
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block">Patient Sample ID</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                value={gene}
                                                onChange={(e) => setGene(e.target.value.toUpperCase())}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none transition-all focus:ring-4 focus:ring-cyan-500/10 placeholder:text-slate-600"
                                                placeholder="GENE SYMBOL"
                                            />
                                            <Badge className="absolute right-2 top-1/2 -translate-y-1/2 bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[9px]">HUGO</Badge>
                                        </div>
                                        <Button
                                            onClick={() => fetchAnalysis(gene)}
                                            disabled={loading}
                                            className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl px-6 h-auto shadow-[0_4px_15px_rgba(6,182,212,0.3)] transition-all hover:scale-105 active:scale-95"
                                        >
                                            {loading ? '...' : <ChevronRight className="w-5 h-5" />}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-[#0a0a1a]/60 border-white/5 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-cyan-400 to-blue-600" />
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold flex items-center justify-between text-white">
                                    <div className="flex items-center gap-2">
                                        <Gauge className="w-4 h-4 text-cyan-400" />
                                        Confidence Metric
                                    </div>
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] uppercase tracking-tighter">Verified AI</Badge>
                                </CardTitle>
                                <CardDescription className="text-[10px] text-slate-400">Stochastic Jitter indicates Laplacian sparsity</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative h-36 flex items-center justify-center py-4">
                                    <motion.div
                                        animate={{ rotate: jitter, x: jitter * 0.4 }}
                                        className="relative w-32 h-32 rounded-full border-[8px] border-slate-800/50 flex flex-col items-center justify-center shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
                                        style={{
                                            borderTopColor: '#06b6d4',
                                            borderRightColor: '#06b6d4',
                                            borderLeftColor: '#06b6d4'
                                        }}
                                    >
                                        <div className="text-4xl font-bold text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                                            {(100 - data.uncertainty_eigenvalue * 2).toFixed(1)}<span className="text-xl text-cyan-400">%</span>
                                        </div>
                                    </motion.div>
                                    {/* Decorative p-value info */}
                                    <div className="absolute bottom-[-10px] text-[9px] font-mono text-cyan-500/60 uppercase tracking-tighter">
                                        p_val: {(0.05 / (1 + data.uncertainty_eigenvalue)).toFixed(5)}
                                    </div>
                                </div>
                                <div className="mt-8 flex items-start gap-3 p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 text-orange-400/80">
                                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-wider mb-1">Spectral Instability Detected</p>
                                        <p className="text-[10px] leading-relaxed font-mono opacity-80">
                                            Standard deviation of eigenvalues: {data.uncertainty_eigenvalue.toFixed(4)}. Sparse clinical signal detected.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-black/60 border-white/5 backdrop-blur-2xl shadow-2xl h-[250px] flex flex-col">
                            <CardHeader className="py-3 bg-white/5 border-b border-white/5">
                                <CardTitle className="text-[10px] font-mono uppercase tracking-[0.2em] flex items-center gap-2 text-slate-400">
                                    <Terminal className="w-3 h-3" />
                                    Spectral Convergence Log
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-4 font-mono text-[10px] text-cyan-400/80 space-y-2 scrollbar-hide">
                                {data.spectral_log.map((log, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex gap-2"
                                    >
                                        <span className="text-slate-600">[{new Date().toLocaleTimeString('en-GB')}]</span>
                                        <span className="text-white opacity-40">{'>'}</span>
                                        <span>{log}</span>
                                    </motion.div>
                                ))}
                                <div className="animate-pulse">_</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column (8/12): Interactive Visuals */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Main Tabs for Visualization */}
                        <Tabs defaultValue="topology" className="w-full" onValueChange={setActiveTab}>
                            <div className="flex justify-between items-end mb-4">
                                <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl">
                                    <TabsTrigger value="topology" className="rounded-lg data-[state=active]:bg-cyan-500 data-[state=active]:text-white transition-all px-6 py-2">
                                        <Layers className="w-4 h-4 mr-2" />
                                        Topology
                                    </TabsTrigger>
                                    <TabsTrigger value="entropy" className="rounded-lg data-[state=active]:bg-cyan-500 data-[state=active]:text-white transition-all px-6 py-2">
                                        <Shield className="w-4 h-4 mr-2" />
                                        Entropy
                                    </TabsTrigger>
                                    <TabsTrigger value="diffusion" className="rounded-lg data-[state=active]:bg-cyan-500 data-[state=active]:text-white transition-all px-6 py-2">
                                        <Network className="w-4 h-4 mr-2" />
                                        Pulse
                                    </TabsTrigger>
                                </TabsList>

                                <div className="text-right">
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                                        <Activity className="w-3 h-3 text-emerald-500" />
                                        LIVE MANIFOLD UPDATING
                                    </div>
                                </div>
                            </div>

                            <TabsContent value="topology" className="mt-0 ring-0 outline-none">
                                <Card className="bg-[#0a0a1a]/60 border-white/5 backdrop-blur-2xl shadow-3xl h-[550px] relative overflow-hidden group border-cyan-500/20">
                                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />

                                    {/* Manifold Grid Background */}
                                    <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
                                        <div className="absolute w-[200%] h-[200%] top-[-50%] left-[-50%] rotate-[15deg]">
                                            {[...Array(20)].map((_, i) => (
                                                <div key={i} className="w-full h-[0.5px] bg-cyan-500/30 mb-[100px]" />
                                            ))}
                                            {[...Array(20)].map((_, i) => (
                                                <div key={i} className="h-full w-[0.5px] bg-cyan-500/30 ml-[100px] absolute top-0" style={{ left: i * 100 }} />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="w-full h-full flex items-center justify-center p-20 relative">
                                        {/* Visual representation of the Stiefel Manifold */}
                                        <div className="absolute w-[300px] h-[300px] rounded-full border border-dashed border-cyan-500/20 animate-spin-slow opacity-40 shrink-0" />
                                        <div className="absolute w-[450px] h-[450px] rounded-full border border-dashed border-violet-500/10 animate-spin-reverse opacity-40 shrink-0" />

                                        <div className="relative w-full h-full perspective-[1200px]">
                                            <motion.div
                                                animate={{ rotateY: 360 }}
                                                transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
                                                className="w-full h-full transform-style-3d flex items-center justify-center"
                                            >
                                                <AnimatePresence>
                                                    {data.manifold_projection.map((node, i) => (
                                                        <motion.div
                                                            key={node.id}
                                                            initial={{ opacity: 0, scale: 0 }}
                                                            animate={{
                                                                opacity: 1,
                                                                scale: 1,
                                                                x: node.x * 120,
                                                                y: node.y * 120,
                                                                z: node.z * 120
                                                            }}
                                                            className={`absolute group/node flex flex-col items-center justify-center`}
                                                        >
                                                            <div className={`w-3 h-3 rounded-full ${node.type === 'patient' ? 'bg-cyan-400 shadow-[0_0_30px_#06b6d4]' : 'bg-slate-700/80 border border-white/10'
                                                                } transition-all group-hover/node:scale-150`}>
                                                                {node.glowing && (
                                                                    <div className="absolute inset-0 rounded-full animate-ping bg-cyan-500/40" />
                                                                )}
                                                            </div>

                                                            <motion.div className="absolute top-6 whitespace-nowrap hidden group-hover/node:block z-50">
                                                                <div className="bg-black/90 border border-white/10 px-3 py-1.5 rounded-lg text-[10px] shadow-2xl">
                                                                    <div className="font-bold text-white mb-0.5">{node.label}</div>
                                                                    <div className="text-cyan-400 font-mono">Sim: {(node.similarity * 100).toFixed(2)}%</div>
                                                                </div>
                                                            </motion.div>

                                                            {/* Label only for patient or close nodes */}
                                                            {(node.type === 'patient' || node.similarity > 0.8) && (
                                                                <div className="absolute top-6 left-1/2 -translate-x-1/2 text-[8px] whitespace-nowrap font-mono text-slate-400 opacity-60 pointer-events-none">
                                                                    {node.label}
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </motion.div>
                                        </div>
                                    </div>

                                    <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                                        <div className="flex gap-6">
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Manifold Type</p>
                                                <p className="text-xs font-bold text-white">Stiefel V_k(R^n)</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Dimensions</p>
                                                <p className="text-xs font-bold text-white">16 Latent Nodes</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 backdrop-blur-md">
                                                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
                                                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter">Current Subject</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 backdrop-blur-md">
                                                <div className="w-2 h-2 rounded-full bg-slate-700" />
                                                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter">Disease Clusters</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </TabsContent>

                            <TabsContent value="entropy" className="mt-0 ring-0 outline-none">
                                <div className="grid md:grid-cols-2 gap-6 h-[550px]">
                                    <Card className="bg-[#0a0a1a]/60 border-white/5 backdrop-blur-2xl shadow-3xl flex flex-col items-center justify-center p-6 border-cyan-500/10">
                                        <CardHeader className="w-full pt-0">
                                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-cyan-400" />
                                                Evidence Radar
                                            </CardTitle>
                                            <CardDescription className="text-[10px]">Entropy weighting (Shannon-Based)</CardDescription>
                                        </CardHeader>
                                        <div className="w-full flex-1">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                                    <PolarGrid stroke="#ffffff10" />
                                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#888888', fontSize: 8, fontFamily: 'monospace' }} />
                                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                    <Radar
                                                        name="Weights"
                                                        dataKey="A"
                                                        stroke="#06b6d4"
                                                        fill="#06b6d4"
                                                        fillOpacity={0.2}
                                                    />
                                                    <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333', fontSize: '10px' }} />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </Card>

                                    <Card className="bg-[#0a0a1a]/60 border-white/5 backdrop-blur-2xl shadow-3xl p-6 flex flex-col border-cyan-500/10">
                                        <CardHeader className="pt-0">
                                            <CardTitle className="text-sm font-bold">Phenotype Specificity</CardTitle>
                                        </CardHeader>
                                        <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scroll">
                                            {Object.entries(data.entropy_weights).sort((a, b) => b[1] - a[1]).map(([hpo, weight], i) => (
                                                <div key={hpo} className="space-y-1.5">
                                                    <div className="flex justify-between items-end">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-mono text-cyan-500/80 font-bold">{hpo}</span>
                                                            <span className="text-[11px] font-medium text-slate-300">Feature Persistence</span>
                                                        </div>
                                                        <span className="text-xs font-mono text-cyan-400">{(weight * 100).toFixed(1)}%</span>
                                                    </div>
                                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${weight * 100}%` }}
                                                            transition={{ duration: 1, delay: i * 0.1 }}
                                                            className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-cyan-300"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-6 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                                            <p className="text-[9px] text-slate-500 leading-relaxed italic">
                                                H(x) weights are calculated as 1 - H(i)/H_max. Phenotypes with lower background frequency (rare) receive higher specificity scores.
                                            </p>
                                        </div>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="diffusion" className="mt-0 ring-0 outline-none">
                                <Card className="bg-[#0a0a1a]/60 border-white/5 backdrop-blur-2xl shadow-3xl h-[550px] p-8 border-orange-500/10">
                                    <div className="grid md:grid-cols-2 gap-10 h-full">
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Zap className="w-5 h-5 text-orange-400" />
                                                    <h3 className="text-lg font-bold text-white tracking-tighter">Heat Pulse Predictor</h3>
                                                </div>
                                                <p className="text-xs text-slate-400">Modeling disease progression as fluid dynamics across the PPI network.</p>
                                            </div>

                                            <div className="space-y-4">
                                                {data.diffusion_nodes.slice(0, 7).map((node, i) => (
                                                    <div key={node.gene} className="relative group">
                                                        <div className="flex items-center justify-between mb-1.5 px-1">
                                                            <span className={`text-[11px] font-bold ${node.is_source ? 'text-orange-400' : 'text-slate-200'}`}>
                                                                {node.gene} {node.is_source && '(SOURCE)'}
                                                            </span>
                                                            <span className="text-[10px] font-mono text-slate-500">{(node.heat * 100).toFixed(2)}°C</span>
                                                        </div>
                                                        <div className="h-3 bg-white/5 border border-white/5 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${node.heat * 100}%` }}
                                                                transition={{ duration: 1.5, ease: "circOut" }}
                                                                className={`h-full ${node.is_source ? 'bg-gradient-to-r from-orange-600 to-yellow-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-slate-700'}`}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex flex-col justify-between">
                                            <div className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/20 relative overflow-hidden shrink-0">
                                                <div className="absolute top-[-10px] right-[-10px] opacity-10">
                                                    <Activity className="w-24 h-24 text-orange-400" />
                                                </div>
                                                <h4 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-4">Differential Logic Summary</h4>
                                                <div className="font-mono text-[11px] leading-relaxed text-slate-100 bg-black/40 p-4 rounded-xl border border-white/5">
                                                    {data.differential_summary}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 mt-6 flex-1">
                                                {data.organ_risks.map((risk, i) => (
                                                    <motion.div
                                                        key={i}
                                                        whileHover={{ y: -5 }}
                                                        className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2"
                                                    >
                                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                                                            <Sparkles className={`w-5 h-5 ${i === 0 ? 'text-red-400' : i === 1 ? 'text-cyan-400' : 'text-yellow-400'}`} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] text-slate-500 font-bold uppercase">{risk.organ}</p>
                                                            <p className="text-xl font-bold text-white tracking-tighter">{(risk.risk * 100).toFixed(1)}%</p>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </main>

            <footer className="mt-20 py-16 border-t border-white/5 bg-black/40 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent opacity-20" />
                <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 opacity-60">
                        <Shield className="w-4 h-4 text-cyan-400" />
                        <span className="text-[10px] font-mono tracking-[0.3em] uppercase">GENESIS BIOMATHEMATICS CORE</span>
                    </div>
                    <div className="text-[10px] text-slate-600 tracking-widest text-center max-w-2xl leading-relaxed">
                        ENTROPIX USES ADVANCED SPECTRAL RADIUS CALCULATIONS ON BIOLOGICAL GRAPHS. RESULTS ARE PROBABILISTIC AND INTENDED FOR RESEARCH USE ONLY. © 2025 GENESIS AI LABORATORIES.
                    </div>
                </div>
            </footer>
        </div>
    );
}
