'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Dna,
    Scan,
    Mic,
    MicOff,
    Activity,
    Play,
    Fingerprint,
    Loader2,
    Brain,
    Layers,
    FlaskConical,
    AlignCenter,
    ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { PhenoScanner } from './components/PhenoScanner';
import { GenomicAvatar } from './components/GenomicAvatar';
import { TimeTravelEngine } from './components/TimeTravelEngine';
import { BiometricInput } from './components/BiometricInput';

const API = 'http://localhost:8000';

interface HPOTerm {
    hpo_id: string;
    label: string;
    confidence: number;
    source: 'face' | 'speech';
    negated?: boolean;
}

interface DysmorphyFeature {
    name: string;
    key: string;
    confidence: number;
    severity: string;
    value: number;
    normal_range: string;
}

interface DiagnosisResult {
    rank: number;
    gene: string;
    disease: string;
    score: number;
    confidence: string;
    explanation: string;
}

interface GeneExpression {
    gene: string;
    expression_level: number;
    status: string;
    z_score: number;
}

interface EpigeneticAge {
    chronological_age: number;
    estimated_age: number;
    acceleration: number;
    mechanism: string;
    percentile: number;
    horvath_score: number;
}

interface LogEvent {
    time: string;
    level: 'info' | 'success' | 'warn' | 'error';
    msg: string;
}

type ScanPhase = 'idle' | 'scanning' | 'analyzing' | 'complete';

const STATUS_LABELS: Record<ScanPhase, string> = {
    idle: 'Bio-Digital Twin · Ready',
    scanning: 'Biometric Acquisition · Running',
    analyzing: 'ML Pipeline · Processing',
    complete: 'Analysis · Complete',
};

const LOG_COLORS: Record<string, string> = {
    info: 'text-blue-400/70',
    success: 'text-emerald-400',
    warn: 'text-white/50',
    error: 'text-red-400/80',
};

const CONFIDENCE_STYLE: Record<string, string> = {
    High: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    Medium: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
    Low: 'border-white/20 text-white/40 bg-white/5',
};

const EXPRESSION_BAR: Record<string, string> = {
    High: 'bg-blue-400',
    Elevated: 'bg-blue-300',
    Normal: 'bg-emerald-400',
    Suppressed: 'bg-white/30',
};

export default function ChronoAvatarPage() {
    const [timelineYear, setTimelineYear] = useState(2025);
    const [scanPhase, setScanPhase] = useState<ScanPhase>('idle');
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [hpoTerms, setHpoTerms] = useState<HPOTerm[]>([]);
    const [dysmorphyFeatures, setDysmorphyFeatures] = useState<DysmorphyFeature[]>([]);
    const [diagnosisResults, setDiagnosisResults] = useState<DiagnosisResult[]>([]);
    const [geneExpression, setGeneExpression] = useState<GeneExpression[]>([]);
    const [epigeneticAge, setEpigeneticAge] = useState<EpigeneticAge | null>(null);
    const [logEvents, setLogEvents] = useState<LogEvent[]>([
        { time: new Date().toLocaleTimeString(), level: 'info', msg: 'GENESIS Chrono-Avatar v3.0 initialized.' },
        { time: new Date().toLocaleTimeString(), level: 'info', msg: 'ML models loaded: NLP · GNN · Variant Predictor · Phenotype Net.' },
        { time: new Date().toLocaleTimeString(), level: 'info', msg: 'Awaiting biometric capture to begin analysis pipeline.' },
    ]);

    const webcamRef = useRef<any>(null);
    const recognitionRef = useRef<any>(null);
    const logEndRef = useRef<HTMLDivElement>(null);

    const addLog = useCallback((level: LogEvent['level'], msg: string) => {
        setLogEvents(prev => [
            ...prev.slice(-40),
            { time: new Date().toLocaleTimeString(), level, msg },
        ]);
        setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }, []);

    // ── Web Speech API ────────────────────────────────────────────────────────
    const startListening = useCallback(() => {
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) { addLog('warn', 'SpeechRecognition not available in this browser.'); return; }

        const rec = new SR();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onstart = () => { setIsListening(true); addLog('info', '[Echo-V] Acoustic stream open · listening for clinical phenotype descriptors...'); };
        rec.onresult = (e: any) => {
            let final = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
            }
            if (final) setTranscript(prev => prev + final);
        };
        rec.onerror = (e: any) => { addLog('warn', `[Echo-V] Recognition error: ${e.error}`); setIsListening(false); };
        rec.onend = () => setIsListening(false);

        recognitionRef.current = rec;
        rec.start();
    }, [addLog]);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);

    // ── NLP: transcript → HPO extraction ─────────────────────────────────────
    const runSpeechNLP = useCallback(async (text: string) => {
        if (!text.trim()) return;
        addLog('info', `[NLP] Sending transcript to BioBERT/TF-IDF clinical phenotype extractor...`);
        try {
            const res = await fetch(`${API}/avatar/speech-to-phenotype`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });
            if (!res.ok) throw new Error(res.statusText);
            const data = await res.json();

            const terms: HPOTerm[] = data.hpo_terms.map((t: any) => ({
                hpo_id: t.hpo_id,
                label: t.label,
                confidence: t.confidence,
                source: 'speech' as const,
                negated: t.negated,
            }));
            setHpoTerms(prev => {
                const seen = new Set(prev.map(t => t.hpo_id));
                return [...prev, ...terms.filter(t => !seen.has(t.hpo_id))];
            });
            addLog('success', `[NLP] Extracted ${data.confirmed_terms.length} confirmed HPO terms · ${data.negated_terms.length} negated.`);
        } catch (err) {
            addLog('warn', `[NLP] Extraction failed: ${err}`);
        }
    }, [addLog]);

    // ── Webcam frame capture ──────────────────────────────────────────────────
    const captureFrame = useCallback((): string | null => {
        try {
            const shot = webcamRef.current?.getScreenshot?.();
            return shot ? shot.split(',')[1] : null;
        } catch { return null; }
    }, []);

    // ── Full biometric pipeline ───────────────────────────────────────────────
    const runBiometricAnalysis = useCallback(async () => {
        if (scanPhase === 'scanning' || scanPhase === 'analyzing') return;

        // Reset prior results
        setDysmorphyFeatures([]);
        setDiagnosisResults([]);
        setGeneExpression([]);
        setEpigeneticAge(null);
        setHpoTerms([]);

        setScanPhase('scanning');
        addLog('info', '[Pipeline] Biometric acquisition started.');
        stopListening();
        await new Promise(r => setTimeout(r, 300));

        const frame = captureFrame();
        addLog('info', frame
            ? '[Pheno-Mirror] Webcam frame acquired · forwarding to facial landmark analyzer...'
            : '[Pheno-Mirror] Camera unavailable · skipping dysmorphology analysis.'
        );
        setScanPhase('analyzing');

        try {
            const res = await fetch(`${API}/avatar/biometric-analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    speech_text: transcript || null,
                    image_base64: frame || null,
                    existing_hpo_ids: [],
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            // Relay backend pipeline log
            for (const e of (data.pipeline_log || [])) {
                addLog(e.level === 'success' ? 'success' : 'info', e.msg);
            }

            // Face dysmorphology
            if (data.face_analysis?.features?.length) {
                setDysmorphyFeatures(data.face_analysis.features);
                const faceHPO: HPOTerm[] = (data.face_analysis.hpo_terms || []).map((t: any) => ({
                    hpo_id: t.hpo_id, label: t.label,
                    confidence: t.confidence, source: 'face' as const, negated: false,
                }));
                setHpoTerms(prev => {
                    const seen = new Set(prev.map(t => t.hpo_id));
                    return [...prev, ...faceHPO.filter(t => !seen.has(t.hpo_id))];
                });
            }

            // NLP speech HPO
            if (data.speech_analysis?.confirmed_hpo?.length) {
                const sHPO: HPOTerm[] = data.speech_analysis.confirmed_hpo.map((id: string) => ({
                    hpo_id: id, label: id, confidence: 0.75, source: 'speech' as const,
                }));
                setHpoTerms(prev => {
                    const seen = new Set(prev.map(t => t.hpo_id));
                    return [...prev, ...sHPO.filter(t => !seen.has(t.hpo_id))];
                });
            }

            if (data.diagnosis?.top_results?.length) setDiagnosisResults(data.diagnosis.top_results);
            if (data.gene_expression?.length) setGeneExpression(data.gene_expression.slice(0, 6));
            if (data.epigenetic_age) {
                setEpigeneticAge(data.epigenetic_age);
                setTimelineYear(Math.round(2000 + data.epigenetic_age.estimated_age));
            }

            addLog('success', '[Pipeline] Analysis complete. Results rendered.');
            setScanPhase('complete');
        } catch (err) {
            addLog('error', `[Pipeline] Critical error: ${err}`);
            setScanPhase('idle');
        }
    }, [scanPhase, transcript, captureFrame, stopListening, addLog]);

    const isScanning = scanPhase === 'scanning' || scanPhase === 'analyzing';

    return (
        <div className="min-h-screen bg-black text-white font-sans overflow-hidden selection:bg-emerald-500/20">

            {/* Ambient background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/8 rounded-full blur-[120px]" />
                <div className="absolute top-60 -left-20 w-80 h-80 bg-blue-600/8 rounded-full blur-[100px]" />
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-white/8 bg-black/60 backdrop-blur-lg">
                <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="group flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-white/60" />
                            <span className="text-[11px] font-medium text-white/60 group-hover:text-white transition-colors">Home</span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                                <Fingerprint className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h1 className="text-base font-bold tracking-tight">
                                    GENESIS <span className="text-emerald-400">Chrono-Avatar</span>
                                </h1>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isScanning ? 'bg-blue-400 animate-pulse' :
                                        scanPhase === 'complete' ? 'bg-emerald-500' : 'bg-emerald-500/40'
                                        }`} />
                                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                        {STATUS_LABELS[scanPhase]}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={isListening ? stopListening : startListening}
                            className={`border-white/10 text-[11px] font-mono h-7 px-3 transition-all ${isListening
                                ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                                : 'hover:bg-white/5 text-white/60'
                                }`}
                        >
                            {isListening
                                ? <><MicOff className="w-3 h-3 mr-1.5" />Stop Recording</>
                                : <><Mic className="w-3 h-3 mr-1.5" />Start Recording</>
                            }
                        </Button>

                        {transcript && !isScanning && (
                            <Button
                                variant="outline"
                                onClick={() => runSpeechNLP(transcript)}
                                className="border-blue-500/25 hover:bg-blue-500/10 text-blue-400 text-[11px] font-mono h-7 px-3"
                            >
                                <Brain className="w-3 h-3 mr-1.5" />
                                Run NLP Extraction
                            </Button>
                        )}

                        <Button
                            onClick={runBiometricAnalysis}
                            disabled={isScanning}
                            className="h-7 px-4 bg-gradient-to-r from-emerald-700 to-blue-700 hover:from-emerald-600 hover:to-blue-600 text-white text-[11px] font-mono font-semibold tracking-wider disabled:opacity-50"
                        >
                            {isScanning
                                ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />ANALYZING</>
                                : <><Play className="w-3 h-3 mr-1.5" />CAPTURE BIOMETRICS</>
                            }
                        </Button>
                    </div>
                </div>
            </header >

            <main
                className="relative z-10 max-w-7xl mx-auto p-4 grid grid-cols-12 gap-4"
                style={{ height: 'calc(100vh - 61px)' }}
            >
                {/* ── LEFT: Inputs + log ───────────────────────────────── */}
                <div className="col-span-3 flex flex-col gap-3 min-h-0">

                    {/* Pheno-Mirror */}
                    <BiometricInput
                        type="face"
                        title="Pheno-Mirror"
                        icon={Scan}
                        description={
                            dysmorphyFeatures.length > 0
                                ? `${dysmorphyFeatures.length} dysmorphic features mapped`
                                : 'Craniofacial Landmark Analysis'
                        }
                        active={isScanning}
                        hpoTerms={dysmorphyFeatures.map(f => ({
                            hpo_id: f.key, label: f.name, confidence: f.confidence, source: 'face' as const,
                        }))}
                    >
                        <PhenoScanner
                            isScanning={isScanning}
                            webcamRef={webcamRef}
                            dysmorphyFeatures={dysmorphyFeatures}
                        />
                    </BiometricInput>

                    {/* Echo-V */}
                    <BiometricInput
                        type="voice"
                        title="Echo-V"
                        icon={isListening ? Mic : MicOff}
                        description={
                            transcript
                                ? `${transcript.trim().split(/\s+/).length} words · NLP ready`
                                : 'Acoustic Phenotype Stream'
                        }
                        active={isListening}
                        hpoTerms={hpoTerms.filter(t => t.source === 'speech')}
                    >
                        <div className="flex flex-col gap-2 h-full">
                            <div className="h-12 flex items-center justify-center border border-white/5 rounded-lg bg-white/3 px-3">
                                {isListening ? (
                                    <div className="flex items-end gap-px h-8">
                                        {Array.from({ length: 24 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-px bg-emerald-400 rounded-full"
                                                style={{
                                                    height: `${20 + Math.sin(i * 0.8) * 12}px`,
                                                    opacity: 0.4 + Math.cos(i * 0.5) * 0.4,
                                                    animationName: 'pulse',
                                                    animationDuration: `${0.5 + (i % 5) * 0.1}s`,
                                                    animationTimingFunction: 'ease-in-out',
                                                    animationIterationCount: 'infinite',
                                                }}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[9px] text-white/25 font-mono uppercase tracking-[0.2em]">
                                        acoustic stream · standby
                                    </p>
                                )}
                            </div>
                            {transcript && (
                                <div className="flex-1 min-h-0 bg-black/30 border border-white/5 rounded-lg p-2 overflow-y-auto custom-scrollbar">
                                    <p className="text-[10px] text-white/50 leading-relaxed font-mono">{transcript}</p>
                                </div>
                            )}
                        </div>
                    </BiometricInput>

                    {/* System Log */}
                    <Card className="flex-1 min-h-0 bg-black/40 border-white/8 p-3 font-mono overflow-y-auto custom-scrollbar">
                        <p className="text-[9px] text-white/25 uppercase tracking-[0.2em] mb-2 sticky top-0 bg-black/60 pb-1">
                            System Log
                        </p>
                        <div className="space-y-0.5">
                            {logEvents.map((ev, i) => (
                                <p key={i} className="text-[10px] leading-relaxed">
                                    <span className="text-white/20 mr-1 shrink-0">[{ev.time}]</span>
                                    <span className={LOG_COLORS[ev.level]}>{ev.msg}</span>
                                </p>
                            ))}
                            <div ref={logEndRef} />
                        </div>
                    </Card>
                </div>

                {/* ── CENTER: Avatar + HPO + Timeline + Diagnosis ──────── */}
                <div className="col-span-6 flex flex-col gap-3 min-h-0">

                    <GenomicAvatar
                        year={timelineYear}
                        isScanning={isScanning}
                        topDisease={diagnosisResults[0]?.disease}
                        epigeneticAge={epigeneticAge}
                    />

                    {/* HPO term panel — only visible after analysis */}
                    {hpoTerms.length > 0 && (
                        <div className="bg-black/40 border border-white/8 rounded-xl p-3 shrink-0">
                            <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/30 mb-2 flex items-center gap-1.5">
                                <Layers className="w-3 h-3" />
                                HPO Phenotype Terms &nbsp;·&nbsp;
                                <span className="text-emerald-400">{hpoTerms.filter(t => !t.negated).length} confirmed</span>
                                {hpoTerms.filter(t => t.negated).length > 0 && (
                                    <span className="text-white/30">&nbsp;· {hpoTerms.filter(t => t.negated).length} excluded</span>
                                )}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {hpoTerms.slice(0, 14).map((t, i) => (
                                    <span
                                        key={i}
                                        className={`text-[10px] px-2 py-0.5 rounded border font-mono ${t.negated
                                            ? 'border-white/10 text-white/25 line-through'
                                            : t.source === 'face'
                                                ? 'border-blue-500/25 text-blue-400 bg-blue-500/8'
                                                : 'border-emerald-500/25 text-emerald-400 bg-emerald-500/8'
                                            }`}
                                        title={`${t.hpo_id} · source: ${t.source} · confidence: ${(t.confidence * 100).toFixed(0)}%`}
                                    >
                                        {t.label}
                                        <span className="ml-1 opacity-40 text-[9px]">{(t.confidence * 100).toFixed(0)}%</span>
                                    </span>
                                ))}
                                {hpoTerms.length > 14 && (
                                    <span className="text-[10px] text-white/25 font-mono px-1">
                                        +{hpoTerms.length - 14} more
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="bg-black/40 border border-white/8 rounded-xl p-4 shrink-0 h-28">
                        <TimeTravelEngine year={timelineYear} setYear={setTimelineYear} />
                    </div>

                    {/* Diagnosis result — only after analysis */}
                    {diagnosisResults.length > 0 && (
                        <Card className="bg-black/40 border-blue-500/20 p-4 shrink-0">
                            <p className="text-[9px] font-mono uppercase tracking-[0.18em] text-blue-400/60 mb-2 flex items-center gap-1.5">
                                <Brain className="w-3 h-3" />
                                ML Diagnosis · Top Candidate
                            </p>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{diagnosisResults[0].disease}</p>
                                    <p className="text-[11px] text-white/40 mt-0.5">
                                        Candidate gene: <span className="text-blue-400 font-mono">{diagnosisResults[0].gene}</span>
                                        &nbsp;·&nbsp; Score: <span className="font-mono text-white/60">{diagnosisResults[0].score}</span>
                                    </p>
                                    <p className="text-[11px] text-white/35 mt-1 leading-relaxed line-clamp-2">
                                        {diagnosisResults[0].explanation}
                                    </p>
                                </div>
                                <div className="shrink-0 text-right">
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${CONFIDENCE_STYLE[diagnosisResults[0].confidence] || CONFIDENCE_STYLE.Low}`}>
                                        {diagnosisResults[0].confidence} confidence
                                    </span>
                                    {diagnosisResults.length > 1 && (
                                        <p className="text-[9px] text-white/25 mt-1 font-mono">
                                            +{diagnosisResults.length - 1} additional candidates
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* ── RIGHT: Epigenetic age + Gene expression ──────────── */}
                <div className="col-span-3 flex flex-col gap-3 min-h-0">

                    {/* Epigenetic Age */}
                    <Card className="shrink-0 bg-black/40 border-white/8 p-4">
                        <h3 className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 mb-3 uppercase tracking-wider">
                            <Dna className="w-3.5 h-3.5" />
                            Epigenetic Age Estimate
                        </h3>
                        {epigeneticAge ? (
                            <div className="space-y-3">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-light text-white tracking-tight">
                                        {epigeneticAge.estimated_age.toFixed(1)}
                                    </span>
                                    <span className="text-white/30 text-sm">y<sub>bio</sub></span>
                                    <span className="text-white/20 text-xs ml-auto font-mono">
                                        chronological: {epigeneticAge.chronological_age}y
                                    </span>
                                </div>

                                {/* Acceleration bar */}
                                <div>
                                    <div className="flex justify-between text-[9px] font-mono text-white/30 mb-1">
                                        <span>biological age acceleration</span>
                                        <span className="text-blue-400">+{epigeneticAge.acceleration.toFixed(1)}y</span>
                                    </div>
                                    <div className="w-full bg-white/8 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min(epigeneticAge.percentile, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-[9px] text-white/25 font-mono mt-1">
                                        {epigeneticAge.percentile}th percentile · Horvath clock: {epigeneticAge.horvath_score.toFixed(3)}
                                    </p>
                                </div>

                                <p className="text-[10px] text-white/35 leading-relaxed border-t border-white/5 pt-2">
                                    {epigeneticAge.mechanism}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="text-3xl font-light text-white/10 tracking-tight">—<span className="text-sm">y</span></div>
                                <p className="text-[10px] text-white/25 font-mono">Run biometric analysis to compute Horvath clock estimate.</p>
                            </div>
                        )}
                    </Card>

                    {/* Gene Expression — only real data after analysis */}
                    <Card className="flex-1 min-h-0 bg-black/40 border-white/8 p-4 overflow-y-auto custom-scrollbar">
                        <h3 className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-400 mb-3 uppercase tracking-wider">
                            <Activity className="w-3.5 h-3.5" />
                            Gene Expression Profile
                        </h3>

                        {geneExpression.length > 0 ? (
                            <div className="space-y-2.5">
                                {geneExpression.map((g, i) => (
                                    <div key={i} className="group">
                                        <div className="flex items-center justify-between mb-1">
                                            <div>
                                                <span className="text-xs font-mono font-semibold text-white/80 group-hover:text-blue-300 transition-colors">
                                                    {g.gene}
                                                </span>
                                                <span className={`ml-2 text-[9px] font-mono px-1.5 py-0.5 rounded border ${g.status === 'High' || g.status === 'Elevated'
                                                    ? 'border-blue-500/20 text-blue-400/70 bg-blue-500/8'
                                                    : g.status === 'Suppressed'
                                                        ? 'border-white/10 text-white/30'
                                                        : 'border-emerald-500/20 text-emerald-400/70 bg-emerald-500/8'
                                                    }`}>
                                                    {g.status}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[11px] font-mono text-white/50">{g.expression_level.toFixed(0)}%</span>
                                                <span className="ml-2 text-[9px] font-mono text-white/25">z={g.z_score > 0 ? '+' : ''}{g.z_score.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-white/6 h-1 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${EXPRESSION_BAR[g.status] || 'bg-white/30'}`}
                                                style={{ width: `${g.expression_level}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-2 py-6">
                                <FlaskConical className="w-6 h-6 text-white/10" />
                                <p className="text-[10px] text-white/20 font-mono text-center">
                                    Expression data unavailable.<br />Run biometric analysis to populate.
                                </p>
                            </div>
                        )}
                    </Card>

                    {/* NLP pipeline status card */}
                    <Card className="shrink-0 bg-black/40 border-white/8 p-3">
                        <h3 className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-400/80 mb-2 uppercase tracking-wider">
                            <AlignCenter className="w-3.5 h-3.5" />
                            Pipeline Summary
                        </h3>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] font-mono">
                            {[
                                { label: 'HPO Terms', value: hpoTerms.filter(t => !t.negated).length || '—' },
                                { label: 'Face Features', value: dysmorphyFeatures.length || '—' },
                                { label: 'Candidates', value: diagnosisResults.length || '—' },
                                { label: 'Top Score', value: diagnosisResults[0]?.score?.toFixed(1) || '—' },
                                { label: 'Bio Age', value: epigeneticAge ? `${epigeneticAge.estimated_age.toFixed(1)}y` : '—' },
                                { label: 'Phase', value: scanPhase.toUpperCase() },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex justify-between items-center border-b border-white/5 pb-1">
                                    <span className="text-white/30">{label}</span>
                                    <span className="text-white/60">{value}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </main>
        </div >
    );
}
