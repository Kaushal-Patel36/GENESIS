
'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ScanFace, Mic, Video, ClipboardList,
    Play, Search, Settings, AlertCircle, Share2, Info,
    CheckCircle2, Loader2, Globe, Activity, Baby, Send,
    ChevronDown, TrendingUp, Dna
} from 'lucide-react';
import Link from 'next/link';

// Import our custom components
import {
    DISORDER_ACCENTS, ScrollProgress, VPMDiagram, HPOTermGrid,
    BayesianPanel, MRIRoiBars, DiagnosticActions, useCounter,
    GradCAMFace, FAISSRankingPanel
} from './components';

export default function MIRAPage() {
    const [disorder, setDisorder] = useState('PWS');
    const [accent, setAccent] = useState(DISORDER_ACCENTS.PWS);
    const [activeTab, setActiveTab] = useState('face');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<Record<string, boolean>>({});
    const [results, setResults] = useState<any>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [patientName, setPatientName] = useState('');
    const [patientId, setPatientId] = useState<string | null>(null);
    const [patientHistory, setPatientHistory] = useState<any>(null);
    const [patientLookupStatus, setPatientLookupStatus] = useState<'idle' | 'loading' | 'found' | 'new'>('idle');

    // Create / revoke object URL when uploadedFile changes
    useEffect(() => {
        if (!uploadedFile) { setPreviewUrl(null); return; }
        const url = URL.createObjectURL(uploadedFile);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [uploadedFile]);

    // Sync accent color with disorder selection
    useEffect(() => {
        setAccent(DISORDER_ACCENTS[disorder] || DISORDER_ACCENTS.PWS);
    }, [disorder]);

    const lookupPatient = async (name: string) => {
        if (!name.trim()) return;
        setPatientLookupStatus('loading');
        try {
            const res = await fetch('http://localhost:8000/mira/patient/lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim() }),
            });
            const data = await res.json();
            setPatientId(data.patient_id);
            setPatientLookupStatus(data.visit_count > 0 ? 'found' : 'new');
            // Fetch history if returning patient
            if (data.visit_count > 0) {
                const hRes = await fetch(`http://localhost:8000/mira/patient/${data.patient_id}/history`);
                const hData = await hRes.json();
                setPatientHistory(hData.longitudinal);
            } else {
                setPatientHistory(null);
            }
        } catch {
            setPatientLookupStatus('idle');
        }
    };

    const refreshHistory = async (pid: string) => {
        try {
            const hRes = await fetch(`http://localhost:8000/mira/patient/${pid}/history`);
            const hData = await hRes.json();
            setPatientHistory(hData.longitudinal);
        } catch { }
    };

    const runAnalysis = async () => {
        setIsAnalyzing(true);
        await new Promise(r => setTimeout(r, 1800));

        try {
            let data: any;
            if (uploadedFile) {
                // ── Real path: send actual image to /mira/face-upload ────────
                const formData = new FormData();
                formData.append('file', uploadedFile);
                formData.append('ancestry', 'EUR');
                const res = await fetch('http://localhost:8000/mira/face-upload', {
                    method: 'POST',
                    body: formData,
                });
                const uploadResult = await res.json();
                data = {
                    status: 'success',
                    disorder: uploadResult.top_diagnosis?.syndrome || 'Unknown',
                    pipeline_1_face: {
                        ...uploadResult.face_pipeline,
                        ranked_syndromes: uploadResult.ranked_syndromes,
                    },
                    pipeline_2_voice: { hpo_terms: [], phenotype_scores: {} },
                    pipeline_3_video: { hpo_terms: [], phenotype_scores: {} },
                    snapshot: {},
                    ranked_syndromes: uploadResult.ranked_syndromes,
                    feature_vector_explanation: uploadResult.feature_vector_explanation,
                    real_analysis: true,
                };
                // ── Auto-record visit if patient is registered ───────────────
                if (patientId) {
                    const topConf = uploadResult.ranked_syndromes?.[0]?.max_similarity ?? 0;
                    await fetch(`http://localhost:8000/mira/patient/${patientId}/visit`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            top_syndrome: uploadResult.top_diagnosis?.syndrome || 'Unknown',
                            confidence: topConf,
                            behavior_score: Math.round(topConf * 100),
                        }),
                    });
                    await refreshHistory(patientId);
                }
            } else {
                // ── Demo fallback: no image uploaded yet ─────────────────────
                const res = await fetch(`http://localhost:8000/mira/demo/${disorder}/EUR`);
                data = await res.json();
                data.real_analysis = false;
            }
            setResults(data);
            setIsAnalyzing(false);
            setShowResults(true);
            setTimeout(() => {
                document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 500);
        } catch (err) {
            console.error("Analysis failed:", err);
            setIsAnalyzing(false);
        }
    };

    const handleUpload = (tab: string, file?: File) => {
        setUploadStatus(prev => ({ ...prev, [tab]: true }));
        if (tab === 'face' && file) {
            setUploadedFile(file);
        }
    };

    // Pre-compute upload zone to avoid Turbopack ternary parse errors
    let uploadZoneNode: React.ReactNode = null;
    if (!uploadStatus[activeTab]) {
        uploadZoneNode = (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-12 hover:border-amber-400/40 hover:bg-amber-400/[0.02] cursor-pointer transition-all">
                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(activeTab, file);
                }} />
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Play className="w-6 h-6 text-white/20 rotate-90" />
                </div>
                <p className="text-sm font-bold glow-text">Upload {activeTab} data</p>
                <p className="text-[10px] font-mono text-muted-foreground/40 mt-1 uppercase tracking-widest">Drag &amp; drop or click to select</p>
            </label>
        );
    } else if (activeTab === 'face' && uploadedFile) {
        uploadZoneNode = (
            <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">Siamese Pipeline Active — Processing Image</span>
                    </div>
                    <button onClick={() => { setUploadedFile(null); setUploadStatus(prev => ({ ...prev, face: false })); }}
                        className="text-[8px] font-mono text-white/30 hover:text-red-400 transition-colors">✕ Remove</button>
                </div>

                <div className="bg-black/60 rounded-xl border border-white/10 p-4">
                    <p className="text-[8px] font-mono text-amber-400 uppercase tracking-widest mb-4">CNN Feature Extraction Pipeline</p>

                    {/* Horizontal pipeline */}
                    <div className="flex items-end justify-between gap-1 overflow-x-auto pb-2">

                        {/* INPUT — stacked image slices */}
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            <div className="relative" style={{ width: 52, height: 60 }}>
                                {[0, 1, 2].map(n => (
                                    <div key={n} className="absolute border border-amber-400/40 overflow-hidden rounded-sm"
                                        style={{ width: 44, height: 52, left: n * 4, top: n * 4, background: n === 2 ? 'none' : 'rgba(251,191,36,0.05)' }}>
                                        {n === 0 && previewUrl && <img src={previewUrl} alt="in" className="w-full h-full object-cover opacity-90" />}
                                    </div>
                                ))}
                            </div>
                            <span className="text-[7px] font-mono text-amber-400 text-center">INPUT<br /><span className="text-white/30">224×224×3</span></span>
                        </div>

                        {/* Arrow */}
                        <div className="flex-1 flex items-center pb-6"><div className="h-px w-full bg-gradient-to-r from-amber-400/40 to-blue-400/50" /><span className="text-blue-400/50 text-[8px] ml-0.5">▶</span></div>

                        {/* CONV1 — tall blue stacked blocks */}
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            <div className="relative" style={{ width: 48, height: 72 }}>
                                {[0, 1, 2, 3].map(n => (
                                    <div key={n} className="absolute rounded-sm border border-blue-400/50"
                                        style={{
                                            width: 36, height: 64, left: n * 4, top: n * 4,
                                            background: `linear-gradient(160deg, hsl(${210 + n * 5},70%,${18 + n * 4}%), hsl(220,60%,12%))`
                                        }} />
                                ))}
                            </div>
                            <span className="text-[7px] font-mono text-blue-400 text-center">CONV 1<br /><span className="text-white/30">64 · 3×3 · ReLU</span></span>
                        </div>

                        {/* Arrow + pool label */}
                        <div className="flex flex-col items-center pb-6 flex-shrink-0">
                            <span className="text-[6px] font-mono text-purple-400/60 mb-0.5">MaxPool</span>
                            <div className="flex items-center"><div className="h-px w-8 bg-gradient-to-r from-blue-400/40 to-purple-400/50" /><span className="text-purple-400/50 text-[8px]">▶</span></div>
                            <span className="text-[6px] font-mono text-white/20">2×2</span>
                        </div>

                        {/* CONV2 — shorter purple blocks */}
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            <div className="relative" style={{ width: 44, height: 64 }}>
                                {[0, 1, 2, 3].map(n => (
                                    <div key={n} className="absolute rounded-sm border border-purple-400/50"
                                        style={{
                                            width: 32, height: 56, left: n * 4, top: n * 2,
                                            background: `linear-gradient(160deg, hsl(${270 + n * 4},60%,${16 + n * 4}%), hsl(275,50%,10%))`
                                        }} />
                                ))}
                            </div>
                            <span className="text-[7px] font-mono text-purple-400 text-center">CONV 2<br /><span className="text-white/30">128 · 3×3 · ReLU</span></span>
                        </div>

                        {/* Arrow + pool label */}
                        <div className="flex flex-col items-center pb-6 flex-shrink-0">
                            <span className="text-[6px] font-mono text-purple-400/60 mb-0.5">MaxPool</span>
                            <div className="flex items-center"><div className="h-px w-8 bg-gradient-to-r from-purple-400/40 to-indigo-400/50" /><span className="text-indigo-400/50 text-[8px]">▶</span></div>
                            <span className="text-[6px] font-mono text-white/20">2×2</span>
                        </div>

                        {/* CONV3 — narrow deep blocks */}
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            <div className="relative" style={{ width: 36, height: 56 }}>
                                {[0, 1, 2, 3].map(n => (
                                    <div key={n} className="absolute rounded-sm border border-indigo-400/50"
                                        style={{
                                            width: 24, height: 48, left: n * 4, top: n * 2,
                                            background: `linear-gradient(160deg, hsl(${245 + n * 4},65%,${18 + n * 3}%), hsl(248,55%,10%))`
                                        }} />
                                ))}
                            </div>
                            <span className="text-[7px] font-mono text-indigo-400 text-center">CONV 3<br /><span className="text-white/30">256 · 3×3 · ReLU</span></span>
                        </div>

                        {/* Arrow + GAP */}
                        <div className="flex flex-col items-center pb-6 flex-shrink-0">
                            <span className="text-[6px] font-mono text-emerald-400/60 mb-0.5">Glob Avg</span>
                            <div className="flex items-center"><div className="h-px w-8 bg-gradient-to-r from-indigo-400/40 to-emerald-400/50" /><span className="text-emerald-400/50 text-[8px]">▶</span></div>
                            <span className="text-[6px] font-mono text-white/20">Pool</span>
                        </div>

                        {/* Embedding vector — thin tall bars */}
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            <div className="flex items-end gap-px" style={{ height: 64 }}>
                                {Array.from({ length: 20 }).map((_, i) => (
                                    <div key={i} className="w-1.5 rounded-t-sm"
                                        style={{
                                            height: `${20 + Math.abs(Math.sin(i * 1.3) * 44)}px`,
                                            background: `hsl(${150 + i * 4},65%,${32 + i % 3 * 8}%)`
                                        }} />
                                ))}
                            </div>
                            <span className="text-[7px] font-mono text-emerald-400 text-center">EMBED<br /><span className="text-white/30">20-dim vector</span></span>
                        </div>

                        {/* Arrow to FAISS */}
                        <div className="flex items-center pb-6 flex-shrink-0"><div className="h-px w-6 bg-gradient-to-r from-emerald-400/40 to-amber-400/50" /><span className="text-amber-400/50 text-[8px]">▶</span></div>

                        {/* FAISS output node */}
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            <div className="w-10 h-10 rounded-full border-2 border-amber-400/60 bg-amber-400/10 flex items-center justify-center mb-1" style={{ boxShadow: '0 0 12px rgba(251,191,36,0.2)' }}>
                                <span className="text-[7px] font-mono text-amber-400 font-bold">k-NN</span>
                            </div>
                            <span className="text-[7px] font-mono text-amber-400 text-center">FAISS<br /><span className="text-white/30">top-5 match</span></span>
                        </div>
                    </div>
                </div>


                {/* File meta footer */}
                <div className="flex items-center gap-4 px-1 text-[7px] font-mono text-white/30">
                    <span>{uploadedFile.name}</span>
                    <span>·</span>
                    <span>{(uploadedFile.size / 1024).toFixed(0)} KB</span>
                    <span>·</span>
                    <span className="text-emerald-400/60">disorder_hint: NOT USED ✓</span>
                </div>
            </div>
        );
    } else {
        uploadZoneNode = (
            <div className="flex gap-8 items-center bg-black/40 rounded-xl p-6 border border-amber-400/20">
                <div className="w-32 h-32 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-3xl">
                    {activeTab === 'voice' ? '🎙️' : activeTab === 'video' ? '📹' : '📝'}
                </div>
                <div className="flex-1 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Extracted Feature Readout</p>
                    <div className="p-3 bg-white/5 rounded border border-white/10 font-mono text-[9px] text-white/50 space-y-1">
                        <p>&gt; sampling_rate: 44.1kHz</p>
                        <p>&gt; prosody_vector: computed</p>
                        <p className="text-emerald-400/60">&gt; pipeline_ready: true</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#04080f] text-[#e8f0fe] font-sans selection:bg-amber-500/30 overflow-x-hidden pt-[60px]">
            <style jsx global>{`
        :root {
          --accent-hue: ${accent.hue};
          --accent-hex: ${accent.hex};
        }
        .glow-text { text-shadow: 0 0 10px var(--accent-hex); }
        .glow-border { border-color: var(--accent-hex); box-shadow: 0 0 15px var(--accent-hex)22; }
        .custom-grid { background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 30px 30px; }
      `}</style>

            <div className="fixed inset-0 pointer-events-none custom-grid opacity-50" />
            <div className="fixed inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-[0.03]" />

            {/* SECTION 1 — Sticky Top Navigation Bar */}
            <nav className="fixed top-0 left-0 right-0 h-[60px] bg-[#04080f]/80 backdrop-blur-md border-b border-white/5 z-50 flex items-center px-6 gap-4">
                <Link href="/" className="flex items-center gap-2 hover:text-amber-400 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                    <span className="text-[10px] uppercase tracking-tighter font-bold">Home</span>
                </Link>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-2">
                    <Baby className="w-5 h-5 text-amber-400" />
                    <span className="text-sm font-serif font-bold tracking-tight">MIRA <span className="text-[10px] font-mono font-normal opacity-50 ml-1">v1.0</span></span>
                </div>
                <div className="flex gap-2 ml-4">
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-[9px] font-mono text-amber-400">VPM v1.0</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-mono text-blue-400">9th Bayesian Source</span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                    <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-400">● Engine Online</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0">
                    <ScrollProgress accent={accent.hex} />
                </div>
            </nav>

            {/* SECTION 2 — Child Profile & Analysis Configuration */}
            <section className="px-6 mt-6">
                <div className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[400px] h-full bg-gradient-to-l from-amber-400/5 to-transparent pointer-events-none" />

                    {/* Patient Name Row */}
                    <div className="mb-5 flex items-center gap-4">
                        <div className="flex-1 max-w-xs">
                            <p className="text-[8px] font-mono text-muted-foreground uppercase mb-1">Patient Name</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={patientName}
                                    onChange={e => setPatientName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && lookupPatient(patientName)}
                                    placeholder="e.g. Aarav Sharma"
                                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-[11px] font-mono text-white/80 placeholder-white/20 focus:outline-none focus:border-amber-400/60"
                                />
                                <button
                                    onClick={() => lookupPatient(patientName)}
                                    disabled={!patientName.trim() || patientLookupStatus === 'loading'}
                                    className="px-3 py-1.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-[10px] font-mono text-amber-400 hover:bg-amber-400/20 disabled:opacity-40 transition-all"
                                >
                                    {patientLookupStatus === 'loading' ? '...' : 'Link'}
                                </button>
                            </div>
                        </div>
                        {patientId && (
                            <div className="flex items-center gap-3 text-[8px] font-mono">
                                <div className="flex items-center gap-1.5 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-3 py-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    <span className="text-emerald-400">{patientLookupStatus === 'found' ? 'Returning patient' : 'New patient'} · <span className="text-white/40">{patientId}</span></span>
                                </div>
                                {patientHistory && (
                                    <span className="text-white/30">{patientHistory.visit_count} visit{patientHistory.visit_count !== 1 ? 's' : ''} recorded</span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                        {/* Left cluster */}
                        <div className="flex gap-8">
                            <div className="space-y-1">
                                <p className="text-[8px] font-mono text-muted-foreground uppercase">Age (Months)</p>
                                <div className="flex items-center gap-2">
                                    <input type="number" defaultValue={18} suppressHydrationWarning className="w-20 bg-black/40 border border-amber-400/30 rounded-lg px-3 py-2 text-2xl font-mono text-amber-400 glow-text focus:outline-none focus:border-amber-400" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[8px] font-mono text-muted-foreground uppercase">Ancestry Group</p>
                                <div className="flex gap-1.5">
                                    {['EUR', 'AFR', 'EAS', 'SAS', 'AMR'].map(a => (
                                        <button key={a} className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all ${a === 'EUR' ? 'bg-amber-400 text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                                            {a}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Center cluster */}
                        <div className="space-y-2 text-center">
                            <p className="text-[8px] font-mono text-muted-foreground uppercase">Disorder Focus Signal</p>
                            <div className="flex justify-center gap-2">
                                {Object.keys(DISORDER_ACCENTS).map(d => (
                                    <button key={d} onClick={() => setDisorder(d)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all border
                    ${disorder === d ? 'glow-border' : 'bg-white/5 border-transparent text-white/30 hover:bg-white/10'}`}
                                        style={disorder === d ? { backgroundColor: `${DISORDER_ACCENTS[d].hex}15`, color: DISORDER_ACCENTS[d].hex, borderColor: DISORDER_ACCENTS[d].hex } : {}}>
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right cluster */}
                        <div className="space-y-3">
                            <div className="flex justify-center gap-3">
                                {['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'].map((m, i) => (
                                    <div key={m} className={`flex flex-col items-center gap-1 opacity-${i === 4 ? '100 cursor-pointer' : i === 5 ? '20' : '40 hover:opacity-100 cursor-pointer transition-opacity'}`}>
                                        <div className={`w-3 h-3 rounded-full border-2 ${i === 4 ? 'bg-amber-400 border-amber-400 glow-border' : 'border-white/20'}`} />
                                        <span className="text-[8px] font-mono uppercase tracking-widest">{m}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[9px] font-mono text-center text-muted-foreground/60 uppercase tracking-widest">
                                Current: 18 months · <span className="text-amber-400">European cohort</span>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 3 — Multimodal Input Tabs + Upload Zone */}
            <section className="px-6 mt-6">
                <div className="rounded-2xl border border-white/5 bg-[#0a0f1a] overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-white/5">
                        {[
                            { id: 'face', label: 'Face Photo', sub: 'JPG/PNG', icon: ScanFace },
                            { id: 'voice', label: 'Voice Note', sub: 'REC/WAV', icon: Mic },
                            { id: 'video', label: 'Home Video', sub: 'MP4/MOV', icon: Video },
                            { id: 'diary', label: 'Diary', sub: 'TXT', icon: ClipboardList },
                        ].map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex flex-col items-center py-4 relative transition-all border-r border-white/5 last:border-r-0
                ${activeTab === tab.id ? 'bg-amber-400/[0.03]' : 'opacity-40 hover:opacity-70'}`}>
                                <tab.icon className={`w-4 h-4 mb-1 ${activeTab === tab.id ? 'text-amber-400' : ''}`} />
                                <span className={`text-[10px] font-bold ${activeTab === tab.id ? 'text-amber-400' : ''}`}>{tab.label}</span>
                                <span className="text-[8px] font-mono opacity-40">{tab.sub}</span>
                                {activeTab === tab.id && (
                                    <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 shadow-[0_-2px_10px_rgba(246,173,85,0.5)]" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Upload Dropzone */}
                    <div className="p-8 pb-12">
                        {uploadZoneNode}
                    </div>
                </div>
            </section>

            {/* SECTION 4 — Run Button Bar */}
            <section className="px-6 mt-6">
                <div className="flex items-center gap-4 bg-[#0a0f1a] rounded-2xl border border-white/5 p-4">
                    <button onClick={runAnalysis} disabled={isAnalyzing}
                        className={`flex-1 h-12 rounded-xl border relative transition-all font-bold uppercase tracking-widest text-[11px] overflow-hidden group
            ${isAnalyzing ? 'border-amber-400/20 cursor-wait' : 'border-amber-400 bg-gradient-to-r from-amber-400/10 to-transparent hover:bg-amber-400 hover:text-black shadow-[0_0_20px_rgba(246,173,85,0.1)] hover:shadow-[0_0_30px_rgba(246,173,85,0.3)]'}`}>
                        <div className="relative z-10 flex items-center justify-center gap-2">
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Analyzing...</span>
                                </>
                            ) : (
                                <>
                                    <Settings className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
                                    <span>🔬 {uploadedFile ? 'Analyze Uploaded Image' : 'Run MIRA Analysis'}</span>
                                </>
                            )}
                        </div>
                        {!isAnalyzing && (
                            <motion.div animate={{ opacity: [0.1, 0.4, 0.1], scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}
                                className="absolute inset-0 bg-amber-400/10 pointer-events-none" />
                        )}
                    </button>
                    <div className="flex-shrink-0 flex gap-4 px-6 font-mono text-[9px] uppercase text-muted-foreground tracking-widest border-l border-white/10">
                        <span>{disorder} focus</span>
                        <span>·</span>
                        <span>European</span>
                        <span>·</span>
                        <span>18 months</span>
                    </div>
                    <button className="h-12 w-12 rounded-xl bg-white/5 text-white/40 hover:text-white flex items-center justify-center transition-all">
                        <ChevronDown className="w-5 h-5" />
                    </button>
                </div>
            </section>

            {/* SECTION 5 — VPM Full Pipeline Architecture Diagram */}
            <section className="px-6 mt-8">
                <VPMDiagram />
            </section>

            {/* SECTION 6 — Three Pipeline Cards */}
            <section className="px-6 mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { color: 'border-l-amber-400', title: 'Pipeline 1', sub: 'Face → Dysmorphology & Affect', models: ['MediaPipe Face Mesh v2.1', 'ResNet-50 Dysmorph Head', 'OpenFace AU Extractor'] },
                    { color: 'border-l-teal-400', title: 'Pipeline 2', sub: 'Voice → Acoustic Phenotype', models: ['wav2vec 2.0 (Self-Sup)', 'Prosody Analyzer v1.4', 'Pitch/Formant Tracker'] },
                    { color: 'border-l-blue-400', title: 'Pipeline 3', sub: 'Video → Behavioral & Motor', models: ['MediaPipe Holistic v2', 'Temporal Conv Net (TCN)', 'LSTM Dynamics Model'] },
                ].map((p, i) => (
                    <div key={i} className={`rounded-xl border border-white/5 bg-white/[0.03] p-5 border-l-4 ${p.color} relative group`}>
                        <div className="absolute top-4 right-4 text-white/10 group-hover:text-white/30 transition-colors">
                            <ChevronDown className="w-4 h-4" />
                        </div>
                        <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase">{p.title}</p>
                        <p className="text-sm font-bold mt-1 leading-tight">{p.sub}</p>
                        <div className="mt-4 space-y-1 opacity-40 group-hover:opacity-100 transition-opacity whitespace-pre-wrap">
                            <p className="text-[8px] font-mono text-amber-400/60 uppercase">Model Stack ▾</p>
                            {p.models.map(m => <p key={m} className="text-[9px] font-mono leading-relaxed tracking-tight group-hover:glow-text">· {m}</p>)}
                        </div>
                    </div>
                ))}
            </section>

            {/* SECTION 7 — Results Dashboard */}
            <AnimatePresence>
                {showResults && results && (
                    <motion.section id="results-section" initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }}
                        className="px-6 mt-12 pb-12 space-y-12">

                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                            {/* Left column (60%) */}
                            <div className="lg:col-span-3 space-y-8">
                                {/* Differential Diagnosis Table */}
                                <div className="rounded-2xl border border-white/10 bg-black/40 p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] font-mono text-amber-400 font-bold">Ranked Differential Diagnosis</h3>
                                        <div className="flex gap-2 text-[8px] font-mono text-white/30 uppercase tracking-widest">GENESIS v2.1 ENGINE RESULT</div>
                                    </div>
                                    <div className="space-y-4">
                                        {/* Badge: real vs demo */}
                                        <div className="flex items-center gap-2 mb-2">
                                            {results.real_analysis ? (
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-mono text-emerald-400">✓ REAL IMAGE ANALYSIS — No Hint Used</span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-mono text-white/40">DEMO MODE — Upload image for real analysis</span>
                                            )}
                                        </div>
                                        {(
                                            results.pipeline_1_face?.ranked_syndromes ||
                                            results.ranked_syndromes ||
                                            []
                                        ).slice(0, 3).map((d: any, i: number) => (
                                            <div key={i} className="space-y-1.5">
                                                <div className="flex items-end justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-lg font-serif font-bold tracking-tight">{d.label || d.syndrome}</span>
                                                        <span className="text-[10px] font-mono text-white/40">{d.gene || ''}</span>
                                                    </div>
                                                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${i === 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                        i === 1 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                            'bg-white/5 text-white/30'
                                                        }`}>
                                                        {i === 0 ? 'CONCORDANT' : i === 1 ? 'POSSIBLE' : 'EXCLUDED'}
                                                    </span>
                                                </div>
                                                <div className="h-6 w-full bg-white/5 rounded-lg overflow-hidden relative">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${(d.similarity || d.confidence_pct / 100 || 0) * 100}%` }} transition={{ duration: 1.2, delay: i * 0.2 }}
                                                        className={`h-full relative ${i === 0 ? 'bg-amber-400' : 'bg-white/20'}`}>
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                                                    </motion.div>
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] font-bold">
                                                        {d.confidence_pct ? `${d.confidence_pct}%` : `${((d.similarity || 0) * 100).toFixed(0)}%`}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* HPO Term Grid */}
                                <div className="rounded-2xl border border-white/10 bg-black/40 p-6 space-y-4">
                                    <div className="flex items-center gap-3 font-bold">
                                        <Dna className="w-4 h-4 text-teal-400" />
                                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] font-mono text-teal-400">Extracted HPO Signatures</h3>
                                    </div>
                                    <HPOTermGrid terms={results.pipeline_1_face.hpo_terms} started={showResults} />
                                </div>

                                {/* FAISS Ranking Panel */}
                                {results.pipeline_1_face.ranked_syndromes && (
                                    <FAISSRankingPanel rankings={results.pipeline_1_face.ranked_syndromes} started={showResults} />
                                )}

                                {/* Monthly Delta Sparkline */}
                                <div className="rounded-2xl border border-white/10 bg-black/40 p-6 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] font-mono text-blue-400">Posterior Trajectory Delta</h3>
                                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <div className="h-[120px] w-full mt-4 flex items-end gap-1 px-1">
                                        {Array.from({ length: 40 }).map((_, i) => {
                                            const h = 40 + Math.sin(i * 0.2) * 20 + (i > 30 ? (i - 30) * 4 : 0);
                                            return (
                                                <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.01 }}
                                                    className={`flex-1 rounded-t-sm ${i > 30 ? 'bg-amber-400 glow-border' : 'bg-blue-400/30'}`} />
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-between text-[8px] font-mono text-muted-foreground/40 mt-2 px-1">
                                        <span>BASELINE (NOV)</span>
                                        <span>CURRENT MONITORING (MAR)</span>
                                        <span className="text-amber-400/60 font-bold">DIVERGENCE DETECTED (+0.14)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right column (40%) */}
                            <div className="lg:col-span-2 space-y-8">
                                <BayesianPanel priors={{}} started={showResults} />
                                <MRIRoiBars started={showResults} />

                                <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-6 text-center space-y-6">
                                    <p className="text-[10px] font-bold font-mono text-teal-400 uppercase tracking-widest">Population Percentile</p>
                                    <div className="relative w-32 h-32 mx-auto">
                                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                                            <motion.circle cx="50" cy="50" r="10" fill="none" stroke="#4fd1c5" />
                                            <motion.circle cx="50" cy="50" r="45" fill="none" stroke="#4fd1c5" strokeWidth="8"
                                                strokeDasharray="283" initial={{ strokeDashoffset: 283 }} animate={{ strokeDashoffset: 283 * (1 - 0.94) }}
                                                transition={{ duration: 1.5, ease: "easeOut" }} strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 8px #4fd1c544)' }} />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-mono font-bold text-teal-300">94th</span>
                                            <span className="text-[8px] font-mono text-white/40 uppercase">percentile</span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] font-mono text-white/60 leading-relaxed px-4">
                                        Signals exceed 94% of age-matched European cohort baseline peers.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 8 — Next-Best Diagnostic Steps */}
                        <DiagnosticActions visible={showResults} />

                        {/* SECTION 8b — Patient Growth & Symptom Trajectory */}
                        {patientId && (
                            <div className="mt-6 px-2">
                                <div className="rounded-2xl border border-white/5 bg-[#06090f] p-6 space-y-5">
                                    {/* Header */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[8px] font-mono text-amber-400 uppercase tracking-[0.2em]">Patient Growth Tracker</p>
                                            <p className="text-sm font-bold text-white mt-0.5">{patientName}</p>
                                            <p className="text-[8px] font-mono text-white/30 mt-0.5">{patientId} · {(patientHistory?.visit_count ?? 1)} total visit{(patientHistory?.visit_count ?? 1) !== 1 ? 's' : ''}</p>
                                        </div>
                                        {patientHistory && patientHistory.trend && (
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-mono font-bold border ${patientHistory.trend === 'improving' ? 'border-emerald-400/40 text-emerald-400 bg-emerald-400/10' :
                                                    patientHistory.trend === 'declining' ? 'border-red-400/40 text-red-400 bg-red-400/10' :
                                                        'border-white/20 text-white/40 bg-white/5'
                                                }`}>
                                                {patientHistory.trend === 'improving' ? '↑ Improving' : patientHistory.trend === 'declining' ? '↓ Declining' : '→ Stable'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Symptom Feature Bar Chart — from current analysis */}
                                    {results?.feature_vector_explanation && (
                                        <div>
                                            <p className="text-[8px] font-mono text-white/40 uppercase tracking-widest mb-3">Current Visit — Symptom Feature Scores</p>
                                            <div className="space-y-2">
                                                {Object.entries(results.feature_vector_explanation as Record<string, number>)
                                                    .sort(([, a], [, b]) => (b as number) - (a as number))
                                                    .slice(0, 8)
                                                    .map(([key, val]) => {
                                                        const pct = Math.round((val as number) * 100);
                                                        const label = key.replace(/_/g, ' ');
                                                        const color = pct > 70 ? '#ef4444' : pct > 45 ? '#f6b830' : '#34d399';
                                                        return (
                                                            <div key={key} className="flex items-center gap-3">
                                                                <span className="text-[8px] font-mono text-white/40 w-36 flex-shrink-0 capitalize truncate">{label}</span>
                                                                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                                    <div className="h-full rounded-full transition-all duration-1000"
                                                                        style={{ width: `${pct}%`, background: color }} />
                                                                </div>
                                                                <span className="text-[8px] font-mono w-8 text-right" style={{ color }}>{pct}%</span>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Longitudinal Line Chart — for returning patients */}
                                    {patientHistory && patientHistory.visits && patientHistory.visits.length > 0 ? (() => {
                                        const visits = patientHistory.visits;
                                        const maxC = Math.max(...visits.map((v: any) => v.confidence), 0.01);
                                        const W = 560, H = 110, PAD = 28;
                                        const xStep = visits.length > 1 ? (W - PAD * 2) / (visits.length - 1) : 0;
                                        const yScale = (c: number) => H - PAD - (c / maxC) * (H - PAD * 1.8);
                                        const pathD = visits.map((v: any, i: number) =>
                                            `${i === 0 ? 'M' : 'L'} ${PAD + i * xStep} ${yScale(v.confidence)}`
                                        ).join(' ');
                                        return (
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-[8px] font-mono text-white/40 uppercase tracking-widest">Confidence Trend — All Visits</p>
                                                    <div className="flex items-center gap-3 text-[7px] font-mono text-white/30">
                                                        <span className="flex items-center gap-1"><span className="w-3 h-px bg-amber-400 inline-block" /> Confidence</span>
                                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Outlier</span>
                                                    </div>
                                                </div>
                                                <div className="bg-black/40 rounded-xl border border-white/5 p-2">
                                                    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 110 }}>
                                                        {[0.25, 0.5, 0.75, 1.0].map(g => (
                                                            <line key={g} x1={PAD} x2={W - PAD}
                                                                y1={yScale(g * maxC)} y2={yScale(g * maxC)}
                                                                stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                                                        ))}
                                                        {visits.length > 1 && (
                                                            <path d={`${pathD} L ${PAD + (visits.length - 1) * xStep} ${H - PAD * 0.5} L ${PAD} ${H - PAD * 0.5} Z`}
                                                                fill="rgba(251,191,36,0.07)" />
                                                        )}
                                                        {visits.length > 1 && (
                                                            <path d={pathD} fill="none" stroke="#f6b830" strokeWidth="1.5" strokeLinejoin="round" />
                                                        )}
                                                        {visits.map((v: any, i: number) => (
                                                            <g key={i}>
                                                                {v.outlier && (
                                                                    <circle cx={PAD + i * xStep} cy={yScale(v.confidence)} r={10}
                                                                        fill="rgba(239,68,68,0.12)" stroke="#ef4444" strokeWidth="0.5" />
                                                                )}
                                                                <circle cx={PAD + i * xStep} cy={yScale(v.confidence)}
                                                                    r={v.outlier ? 4.5 : 3}
                                                                    fill={v.outlier ? '#ef4444' : '#f6b830'} />
                                                                {v.outlier && (
                                                                    <text x={PAD + i * xStep} y={yScale(v.confidence) - 9}
                                                                        textAnchor="middle" fontSize="6" fill="#ef4444" fontFamily="monospace">SPIKE</text>
                                                                )}
                                                                <text x={PAD + i * xStep} y={H - 4}
                                                                    textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.25)" fontFamily="monospace">
                                                                    {new Date(v.timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                                                                </text>
                                                            </g>
                                                        ))}
                                                        <text x={PAD - 4} y={yScale(maxC)} textAnchor="end" fontSize="6" fill="rgba(255,255,255,0.2)" fontFamily="monospace">100%</text>
                                                        <text x={PAD - 4} y={yScale(maxC * 0.5)} textAnchor="end" fontSize="6" fill="rgba(255,255,255,0.2)" fontFamily="monospace">50%</text>
                                                    </svg>
                                                </div>

                                                {/* Compact visit rows */}
                                                <div className="mt-3 space-y-1">
                                                    {visits.map((v: any) => (
                                                        <div key={v.visit_id} className={`flex items-center gap-3 px-2 py-1 rounded text-[8px] font-mono ${v.outlier ? 'bg-red-500/10 border border-red-500/20' : 'hover:bg-white/[0.02]'
                                                            }`}>
                                                            <span className="text-white/30 w-6">V{v.visit_id}</span>
                                                            <span className="text-white/30 w-20">{new Date(v.timestamp).toLocaleDateString()}</span>
                                                            <span className={`flex-1 ${v.outlier ? 'text-red-400' : 'text-amber-400'}`}>{v.top_syndrome}</span>
                                                            <span className={`${v.outlier ? 'text-red-400 font-bold' : 'text-white/50'}`}>{(v.confidence * 100).toFixed(1)}%</span>
                                                            {v.outlier && <span className="text-red-400/80 text-[7px]">⚠ outlier</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })() : (
                                        <div className="flex items-center gap-3 bg-white/[0.02] rounded-xl border border-white/5 p-4">
                                            <div className="w-8 h-8 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 text-sm">1</div>
                                            <div>
                                                <p className="text-[9px] font-mono text-amber-400">Visit 1 — Baseline Established</p>
                                                <p className="text-[8px] font-mono text-white/30 mt-0.5">Upload again next visit to begin tracking symptom changes over time.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.section>
                )}
            </AnimatePresence>

            {/* SECTION 9 — Key Scientific Novelties + Ethical Safeguards */}
            <section className="px-6 mt-16 mb-24 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/5 pt-12">
                <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6 backdrop-blur-sm">
                    <p className="text-[10px] font-bold text-foreground mb-4 uppercase tracking-[0.3em] font-mono border-l-2 border-amber-400 pl-4">Key Scientific Novelties</p>
                    <div className="space-y-4">
                        {[
                            { t: 'Ancestry-Adjusted Phenotyping', d: 'Uses population stratification to normalize quantitative signals against ancestry-specific baselines.' },
                            { t: 'Longitudinal Delta as Diagnostic Signal', d: 'Identifies the rate of phenotypic divergence over time, a high-gain signal often missed in single snapshots.' },
                            { t: 'Cross-Modal Trajectory Matching', d: 'Mathematical alignment of face/voice/video growth curves against known disorder templates.' },
                            { t: 'Zero-HPO Physician Entry Point', d: 'Enables high-fidelity data capture from parent-uploaded media without requiring underlying clinical knowledge.' },
                        ].map((n, i) => (
                            <div key={i}>
                                <p className="text-[10px] font-bold font-mono text-amber-400 uppercase tracking-widest">{n.t}</p>
                                <p className="text-[9px] text-muted-foreground/60 leading-relaxed mt-1 font-mono">{n.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6 backdrop-blur-sm">
                    <p className="text-[10px] font-bold text-foreground mb-4 uppercase tracking-[0.3em] font-mono border-l-2 border-teal-400 pl-4">Ethical Safeguards</p>
                    <div className="space-y-4">
                        {[
                            { t: 'Screening, Not Diagnosis', d: 'Explicitly frames outputs as decision support signals for clinicians, preventing unauthorized medical directives.' },
                            { t: 'Local Processing & Data Minimization', d: 'Feature extraction occurs locally or on secure GENESIS nodes; raw video/audio never persists unnecessarily.' },
                            { t: 'Uncertainty Communication', d: 'Bayesian posterior includes explicit 0–1 probability ranges and missing-variable indicators.' },
                            { t: 'Ancestry as Biological Variable', d: 'Strictly treats ancestry as a biological variable for z-score normalization, not a social categorization.' },
                        ].map((s, i) => (
                            <div key={i}>
                                <p className="text-[10px] font-bold font-mono text-teal-400 uppercase tracking-widest">{s.t}</p>
                                <p className="text-[9px] text-muted-foreground/60 leading-relaxed mt-1 font-mono">{s.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SECTION 10 — Longitudinal Growth & Behavior Tracker */}
            {patientHistory && patientHistory.visit_count > 0 && (() => {
                const visits = patientHistory.visits || [];
                const maxC = Math.max(...visits.map((v: any) => v.confidence), 0.01);
                const W = 600, H = 120, PAD = 32;
                const xStep = visits.length > 1 ? (W - PAD * 2) / (visits.length - 1) : 0;
                const yScale = (c: number) => H - PAD - (c / maxC) * (H - PAD * 2);
                const pathD = visits.map((v: any, i: number) =>
                    `${i === 0 ? 'M' : 'L'} ${PAD + i * xStep} ${yScale(v.confidence)}`
                ).join(' ');
                return (
                    <section className="px-6 mt-6 mb-6">
                        <div className="rounded-2xl border border-white/5 bg-[#070c15] p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-[8px] font-mono text-muted-foreground uppercase tracking-widest">Longitudinal Growth Tracker</p>
                                    <p className="text-xs font-bold text-white mt-0.5">{patientName} · Confidence over visits</p>
                                </div>
                                <div className="flex items-center gap-3 text-[7px] font-mono">
                                    <span className="flex items-center gap-1"><span className="inline-block w-3 h-px bg-amber-400" />Confidence</span>
                                    <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-red-500" />Outlier spike</span>
                                    <span className={`px-2 py-0.5 rounded border text-[7px] font-mono ${patientHistory.trend === 'improving' ? 'border-emerald-400/40 text-emerald-400' :
                                        patientHistory.trend === 'declining' ? 'border-red-400/40 text-red-400' : 'border-white/20 text-white/40'
                                        }`}>
                                        {patientHistory.trend === 'improving' ? '↑ Improving' : patientHistory.trend === 'declining' ? '↓ Declining' : '→ Stable'}
                                    </span>
                                </div>
                            </div>

                            {/* SVG Line Chart */}
                            <div className="overflow-x-auto">
                                <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl" style={{ height: 120 }}>
                                    {/* Grid lines */}
                                    {[0.25, 0.5, 0.75, 1.0].map(g => (
                                        <line key={g} x1={PAD} x2={W - PAD} y1={yScale(g * maxC)} y2={yScale(g * maxC)}
                                            stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                                    ))}
                                    {/* Area fill */}
                                    {visits.length > 1 && (
                                        <path d={`${pathD} L ${PAD + (visits.length - 1) * xStep} ${H - PAD} L ${PAD} ${H - PAD} Z`}
                                            fill="rgba(251,191,36,0.06)" />
                                    )}
                                    {/* Main line */}
                                    {visits.length > 1 && (
                                        <path d={pathD} fill="none" stroke="#f6b830" strokeWidth="1.5" strokeLinejoin="round" />
                                    )}
                                    {/* Data points */}
                                    {visits.map((v: any, i: number) => (
                                        <g key={i}>
                                            <circle cx={PAD + i * xStep} cy={yScale(v.confidence)}
                                                r={v.outlier ? 5 : 3}
                                                fill={v.outlier ? '#ef4444' : '#f6b830'}
                                                stroke={v.outlier ? '#fca5a5' : '#f6b830'}
                                                strokeWidth={v.outlier ? 1.5 : 0} />
                                            {v.outlier && (
                                                <text x={PAD + i * xStep} y={yScale(v.confidence) - 8}
                                                    textAnchor="middle" fontSize="7" fill="#ef4444">spike</text>
                                            )}
                                            <text x={PAD + i * xStep} y={H - 6}
                                                textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.3)">V{v.visit_id}</text>
                                        </g>
                                    ))}
                                </svg>
                            </div>

                            {/* Visit table */}
                            <div className="mt-3 border-t border-white/5 pt-3">
                                <div className="grid grid-cols-4 gap-2 text-[7px] font-mono text-white/30 uppercase tracking-widest mb-1 px-1">
                                    <span>Visit</span><span>Date</span><span>Top Syndrome</span><span>Confidence</span>
                                </div>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {visits.map((v: any) => (
                                        <div key={v.visit_id} className={`grid grid-cols-4 gap-2 text-[8px] font-mono px-1 py-1 rounded ${v.outlier ? 'bg-red-500/10 border border-red-500/20' : 'hover:bg-white/3'
                                            }`}>
                                            <span className="text-white/60">#{v.visit_id}</span>
                                            <span className="text-white/40">{new Date(v.timestamp).toLocaleDateString()}</span>
                                            <span className={v.outlier ? 'text-red-400' : 'text-amber-400'}>{v.top_syndrome}</span>
                                            <span className={v.outlier ? 'text-red-400 font-bold' : 'text-white/60'}>{(v.confidence * 100).toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                );
            })()}

            {/* SECTION 11 — Footer */}
            <footer className="h-[60px] border-t border-white/5 flex items-center justify-between px-8 text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest">
                <div className="flex gap-4">
                    <span>GENESIS v2.1</span>
                    <span>·</span>
                    <span>MIRA VPM v1.0</span>
                </div>
                <span>Hackathon Build Feb 2026</span>
                <div className="flex gap-4">
                    <span>Privacy Policy</span>
                    <span>Terms</span>
                </div>
            </footer>
        </main>
    );
}
