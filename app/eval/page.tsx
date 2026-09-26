'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Activity, Play, CheckCircle2, AlertTriangle, ArrowLeft,
    BarChart3, Brain, Shield, TrendingUp, Clock, Zap, FlaskConical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = 'http://localhost:8000';

// ── Demo vignettes ─────────────────────────────────────────────────────────

const DEMO_VIGNETTES = [
    {
        id: 'marfan',
        label: 'Marfan Syndrome',
        gene: 'FBN1',
        difficulty: 'Easy',
        color: 'text-secondary',
        text: 'Patient is a 16-year-old male with tall stature and long, slender fingers (arachnodactyly). Ophthalmology confirms bilateral ectopia lentis. Echocardiogram shows aortic root dilation at 4.5 cm. Spine X-ray reveals mild scoliosis. Maternal uncle had aortic dissection at age 42.',
    },
    {
        id: 'dravet',
        label: 'Dravet Syndrome',
        gene: 'SCN1A',
        difficulty: 'Medium',
        color: 'text-chart-4',
        text: 'Eight-month-old female with first prolonged febrile seizure lasting 25 minutes. Subsequent seizures occurring without fever, multiple types noted. EEG shows generalized spike-wave discharges. Global developmental delay apparent by 12 months. Parents report regression in social interaction and language by 18 months.',
    },
    {
        id: 'dmd',
        label: 'DMD (Reanalysis)',
        gene: 'DMD',
        difficulty: 'Hard',
        color: 'text-destructive',
        text: '5-year-old boy with difficulty climbing stairs. Gower\'s sign positive. Proximal muscle weakness bilaterally. CK markedly elevated at 12,000 U/L. Prior panel negative WES from 2021 with a variant of uncertain significance in DMD. Echocardiogram shows early dilated cardiomyopathy.',
    },
];

// ── Metric card ────────────────────────────────────────────────────────────

function MetricCard({
    label, value, sub, color, icon: Icon
}: { label: string; value: string | number; sub?: string; color: string; icon: any }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-5"
        >
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{label}</span>
            </div>
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
        </motion.div>
    );
}

// ── Bar chart (simple SVG) ─────────────────────────────────────────────────

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    const pct = (value / max) * 100;
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-28 flex-shrink-0">{label}</span>
            <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${color}`}
                />
            </div>
            <span className="text-xs font-mono text-muted-foreground w-10 text-right">{(value * 100).toFixed(0)}%</span>
        </div>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function EvalPage() {
    const [benchmarkResults, setBenchmarkResults] = useState<any>(null);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeVignette, setActiveVignette] = useState<string | null>(null);
    const [vignetteResult, setVignetteResult] = useState<any>(null);
    const [vignetteRunning, setVignetteRunning] = useState(false);

    const runBenchmark = async () => {
        setRunning(true);
        setError(null);
        setBenchmarkResults(null);
        try {
            const res = await fetch(`${BACKEND_URL}/eval/benchmark`, { method: 'POST' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setBenchmarkResults(data);
        } catch (e: any) {
            setError(e.message || 'Benchmark failed');
        } finally {
            setRunning(false);
        }
    };

    const runVignette = async (vignette: typeof DEMO_VIGNETTES[0]) => {
        setActiveVignette(vignette.id);
        setVignetteRunning(true);
        setVignetteResult(null);
        try {
            const res = await fetch(`${BACKEND_URL}/pipeline/full`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: vignette.text,
                    prior_test: vignette.id === 'dmd'
                        ? { type: 'WES', date: '2021-01-01', result: 'negative' }
                        : null,
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setVignetteResult(data);
        } catch (e: any) {
            setVignetteResult({ error: e.message });
        } finally {
            setVignetteRunning(false);
        }
    };

    const overall = benchmarkResults?.overall_metrics;
    const stepwise = benchmarkResults?.stepwise_replay;
    const robustness = benchmarkResults?.robustness;
    const difficulty = benchmarkResults?.progressive_difficulty;
    const equity = benchmarkResults?.equity_audit;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm font-medium">Back to Home</span>
                        </Link>
                        <span className="text-muted-foreground/40">|</span>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold text-foreground">Pipeline Evaluation Dashboard</span>
                        </div>
                    </div>
                    <Button onClick={runBenchmark} disabled={running} className="gap-2 bg-primary hover:bg-primary/90">
                        {running ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        {running ? 'Running Benchmark...' : 'Run Full Benchmark'}
                    </Button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">

                {/* Description */}
                <div className="glass-card rounded-xl p-6">
                    <div className="flex items-start gap-4">
                        <Brain className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                        <div>
                            <h1 className="text-2xl font-bold text-foreground mb-2">GenDx 3-Module Evaluation Harness</h1>
                            <p className="text-muted-foreground leading-relaxed">
                                Validates the full rare disease diagnostic pipeline across 10 gold-standard clinical vignettes
                                spanning 3 difficulty tiers. Metrics include phenotype extraction F1, steps-to-correct-diagnosis,
                                40% phenotype drop robustness, progressive difficulty stratification, and equity audit.
                            </p>
                            <div className="flex flex-wrap gap-2 mt-4">
                                {['Module 1: NLP Extraction', 'Module 2: Reanalysis Trigger', 'Module 3: Next-Best-Step Copilot'].map((m, i) => (
                                    <span key={i} className="text-xs px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary">{m}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* Benchmark Results */}
                <AnimatePresence>
                    {benchmarkResults && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-secondary" /> Benchmark Results
                            </h2>

                            {/* Key metrics */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <MetricCard
                                    label="Mean F1" icon={BarChart3}
                                    value={overall?.mean_f1 != null ? `${(overall.mean_f1 * 100).toFixed(1)}%` : '–'}
                                    sub="Phenotype extraction" color="text-secondary"
                                />
                                <MetricCard
                                    label="Steps to Diagnosis" icon={TrendingUp}
                                    value={stepwise?.mean_steps_to_diagnosis?.toFixed(1) ?? '–'}
                                    sub="Mean steps needed" color="text-primary"
                                />
                                <MetricCard
                                    label="Robustness" icon={Shield}
                                    value={robustness?.robustness_coefficient != null ? `${(robustness.robustness_coefficient * 100).toFixed(0)}%` : '–'}
                                    sub="At 40% phenotype drop" color="text-chart-4"
                                />
                                <MetricCard
                                    label="Equity Audit" icon={CheckCircle2}
                                    value={equity?.status ?? '–'}
                                    sub={`${((equity?.performance_gap_simulated ?? 0) * 100).toFixed(1)}% gap (threshold: 15%)`}
                                    color={equity?.status === 'PASS' ? 'text-secondary' : 'text-destructive'}
                                />
                            </div>

                            {/* Progressive Difficulty */}
                            {difficulty && (
                                <div className="glass-card rounded-xl p-6">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Progressive Difficulty Recall</h3>
                                    <div className="space-y-3">
                                        <MiniBar label="Easy (Level 1)" value={difficulty.difficulty_level_1 ?? 0} max={1} color="bg-secondary" />
                                        <MiniBar label="Medium (Level 2)" value={difficulty.difficulty_level_2 ?? 0} max={1} color="bg-chart-4" />
                                        <MiniBar label="Hard (Level 3)" value={difficulty.difficulty_level_3 ?? 0} max={1} color="bg-destructive" />
                                    </div>
                                </div>
                            )}

                            {/* Robustness detail */}
                            {robustness && (
                                <div className="glass-card rounded-xl p-6">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Robustness Analysis (40% Phenotype Drop Test)</h3>
                                    <div className="space-y-3">
                                        <MiniBar label="Baseline F1" value={robustness.baseline_f1 ?? 0} max={1} color="bg-secondary" />
                                        <MiniBar label="Degraded F1" value={robustness.degraded_f1 ?? 0} max={1} color="bg-chart-4" />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-3">
                                        Robustness coefficient: {((robustness.robustness_coefficient ?? 0) * 100).toFixed(1)}% — measures how well the engine performs when 40% of phenotypes are randomly dropped (simulating sparse records).
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Live Demo Vignettes */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <FlaskConical className="w-5 h-5 text-chart-4" /> Live Demo Vignettes
                    </h2>
                    <p className="text-sm text-muted-foreground">Click any vignette to run it live through the full 3-module pipeline.</p>

                    <div className="grid md:grid-cols-3 gap-4">
                        {DEMO_VIGNETTES.map((v) => (
                            <Card key={v.id} className={`border-border cursor-pointer hover:border-primary/30 transition-all ${activeVignette === v.id ? 'border-primary/50 bg-primary/5' : ''}`}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm">{v.label}</CardTitle>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${v.color} border-current bg-current/10`}>{v.difficulty}</span>
                                    </div>
                                    <div className="text-xs font-mono text-muted-foreground">{v.gene}</div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">{v.text}</p>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full gap-2 text-xs"
                                        onClick={() => runVignette(v)}
                                        disabled={vignetteRunning}
                                    >
                                        {vignetteRunning && activeVignette === v.id
                                            ? <><Activity className="w-3.5 h-3.5 animate-spin" /> Running...</>
                                            : <><Zap className="w-3.5 h-3.5" /> Run Pipeline</>
                                        }
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Vignette Result */}
                    <AnimatePresence>
                        {vignetteResult && !vignetteResult.error && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 space-y-4">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                                    <h3 className="text-base font-bold text-foreground">Pipeline Result</h3>
                                    <span className="ml-auto text-xs text-muted-foreground">{vignetteResult.processing_time_ms?.toFixed(0)}ms</span>
                                </div>

                                {/* Extracted phenotypes */}
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                        Extracted Phenotypes ({vignetteResult.phenopacket?.filter((p: any) => !p.excluded).length ?? 0} present, {vignetteResult.phenopacket?.filter((p: any) => p.excluded).length ?? 0} excluded)
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {vignetteResult.phenopacket?.map((f: any, i: number) => (
                                            <span key={i} className={`text-[10px] px-2 py-1 rounded-full border ${f.excluded ? 'border-destructive/20 bg-destructive/5 text-destructive line-through' : 'border-secondary/20 bg-secondary/5 text-secondary'}`}>
                                                {f.hpo_label}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Top diagnosis */}
                                {vignetteResult.diagnosis_results?.[0] && (
                                    <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Top Diagnosis</div>
                                        <div className="font-bold text-foreground">{vignetteResult.diagnosis_results[0].disease?.name}</div>
                                        <div className="text-xs text-muted-foreground">{vignetteResult.diagnosis_results[0].gene?.symbol} · Score: {vignetteResult.diagnosis_results[0].score?.toFixed(2)}</div>
                                    </div>
                                )}

                                {/* Reanalysis trigger */}
                                {vignetteResult.reanalysis && (
                                    <div className="p-3 rounded-lg border border-chart-4/20 bg-chart-4/5">
                                        <div className="text-xs font-mono text-chart-4 uppercase tracking-widest mb-1">Reanalysis Trigger</div>
                                        <div className="text-sm font-semibold text-foreground">{vignetteResult.reanalysis.recommendation}</div>
                                        <div className="text-xs text-muted-foreground">Score: {vignetteResult.reanalysis.score}/100</div>
                                    </div>
                                )}

                                {/* Summary action */}
                                {vignetteResult.next_steps?.summary_action && (
                                    <div className="flex items-start gap-2 text-sm text-foreground">
                                        <TrendingUp className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                        <span>{vignetteResult.next_steps.summary_action}</span>
                                    </div>
                                )}
                            </motion.div>
                        )}
                        {vignetteResult?.error && (
                            <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm">
                                Pipeline error: {vignetteResult.error}
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Architecture note */}
                <div className="glass-card rounded-xl p-6 border-dashed">
                    <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Evaluation Architecture</span>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6 text-xs text-muted-foreground">
                        <div>
                            <p className="font-semibold text-foreground mb-1">Gold Standard</p>
                            <p>10 synthesized vignettes (3 easy, 4 medium, 3 hard) with manually annotated HPO sets and gold gene labels.</p>
                        </div>
                        <div>
                            <p className="font-semibold text-foreground mb-1">Robustness Test</p>
                            <p>40% of extracted HPO terms randomly dropped per case. Robustness coefficient = degraded F1 / baseline F1.</p>
                        </div>
                        <div>
                            <p className="font-semibold text-foreground mb-1">Equity Audit</p>
                            <p>Simulates sparse underrepresented records. Performance gap flagged if &gt;15% vs. typical presentation recall.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
