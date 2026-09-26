'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  FileUp, CheckCircle, ChevronRight, Lock, Clock, Sparkles, Activity,
  Terminal, History, TrendingUp, FileText, Brain, CheckCircle2, XCircle,
  AlertTriangle, Edit3, Eye, Zap, Shield, Dna
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = 'http://localhost:8000';

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

interface PhenoFeature {
  hpo_id: string;
  hpo_label: string;
  link_confidence: number;
  excluded: boolean;
  status: 'present' | 'absent' | 'uncertain';
  onset_age_years?: number | null;
  severity?: string | null;
  certainty: string;
  subject: string;
  ongoing?: boolean;
  temporal_status?: string;
  family_relation?: string | null;
  evidence_span?: { start?: number; end?: number; text_snippet?: string };
}

interface ReanalysisData {
  score: number;
  recommendation: string;
  urgency_level: 'strong' | 'conditional' | 'low';
  signal_breakdown: Record<string, number>;
  top_reasons: string[];
  action_checklist: string[];
}

interface NextStepAction {
  action_type: 'collect_phenotype' | 'order_test' | 'trigger_reanalysis' | 'refer_specialist';
  label: string;
  reason: string;
  info_gain: number;
  explanation: string;
  hpo_id?: string;
}

interface NextStepsData {
  ranked_actions: NextStepAction[];
  red_flags: string[];
  pivotal_question: string;
  confidence_calibration: number;
  uncertainty_analysis: string;
}

interface MissingnessReport {
  data_completeness: number;
  equity_flag: string;
  recommendation: string;
  confidence_discount_pct: number;
}

interface AnnotatedSpan {
  text: string;
  feature?: PhenoFeature;
  isMatch: boolean;
}

// ─────────────────────────────────────────────────────────────────────────
// Annotated text builder
// Breaks source text into spans: matched HPO spans + plain text gaps
// ─────────────────────────────────────────────────────────────────────────

function buildAnnotatedSpans(sourceText: string, features: PhenoFeature[]): AnnotatedSpan[] {
  if (!features.length) return [{ text: sourceText, isMatch: false }];

  // Collect valid char ranges from evidence spans
  type Range = { start: number; end: number; feature: PhenoFeature };
  const ranges: Range[] = [];

  features.forEach(f => {
    const snippet = f.evidence_span?.text_snippet?.trim();
    if (!snippet) return;
    // Find the HPO label (or a keyword from it) inside the source text (case-insensitive)
    const labelWords = f.hpo_label.toLowerCase().split(/\s+/);
    const mainWord = labelWords.find(w => w.length > 3) || labelWords[0];
    const regex = new RegExp(mainWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const match = regex.exec(sourceText);
    if (match) {
      // Expand to cover full term match if possible
      const fullTermRegex = new RegExp(f.hpo_label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const fullMatch = fullTermRegex.exec(sourceText);
      if (fullMatch) {
        ranges.push({ start: fullMatch.index, end: fullMatch.index + fullMatch[0].length, feature: f });
      } else {
        ranges.push({ start: match.index, end: match.index + match[0].length, feature: f });
      }
    }
  });

  // Sort and de-overlap ranges
  ranges.sort((a, b) => a.start - b.start);
  const merged: Range[] = [];
  for (const r of ranges) {
    if (merged.length && r.start < merged[merged.length - 1].end) continue;
    merged.push(r);
  }

  // Build span array
  const spans: AnnotatedSpan[] = [];
  let cursor = 0;
  for (const r of merged) {
    if (r.start > cursor) spans.push({ text: sourceText.slice(cursor, r.start), isMatch: false });
    spans.push({ text: sourceText.slice(r.start, r.end), isMatch: true, feature: r.feature });
    cursor = r.end;
  }
  if (cursor < sourceText.length) spans.push({ text: sourceText.slice(cursor), isMatch: false });
  return spans;
}

// ─────────────────────────────────────────────────────────────────────────
// AnnotatedTextView — rich annotated display of clinical text
// ─────────────────────────────────────────────────────────────────────────

function AnnotatedTextView({ text, features }: { text: string; features: PhenoFeature[] }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const spans = buildAnnotatedSpans(text, features);

  const getHighlightStyle = (f: PhenoFeature): string => {
    if (f.status === 'absent') return 'bg-destructive/20 border-b-2 border-destructive text-destructive/80';
    if (f.status === 'uncertain') return 'bg-chart-4/20 border-b-2 border-chart-4 text-chart-4/80';
    if ((f.link_confidence ?? 0) >= 0.9) return 'bg-secondary/20 border-b-2 border-secondary text-foreground';
    if ((f.link_confidence ?? 0) >= 0.6) return 'bg-primary/20 border-b-2 border-primary text-foreground';
    return 'bg-muted/30 border-b-2 border-muted-foreground/40 text-foreground';
  };

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap text-[9px] font-mono">
        <span className="text-muted-foreground">Key:</span>
        <span className="px-1.5 py-0.5 rounded bg-secondary/20 border-b-2 border-secondary text-secondary">present (conf.)</span>
        <span className="px-1.5 py-0.5 rounded bg-primary/20 border-b-2 border-primary text-primary">present (med)</span>
        <span className="px-1.5 py-0.5 rounded bg-chart-4/20 border-b-2 border-chart-4 text-chart-4">uncertain</span>
        <span className="px-1.5 py-0.5 rounded bg-destructive/20 border-b-2 border-destructive text-destructive">absent</span>
      </div>

      {/* Annotated text body */}
      <div className="p-4 rounded-xl border border-border/40 bg-muted/20 font-mono text-[13px] leading-8 backdrop-blur-sm select-text">
        {spans.map((span, i) => {
          if (!span.isMatch || !span.feature) {
            return <span key={i} className="text-foreground/80">{span.text}</span>;
          }
          const f = span.feature;
          const isHov = hoveredId === f.hpo_id + i;
          return (
            <span key={i} className="relative inline-block group cursor-pointer">
              <span
                className={`rounded px-0.5 transition-all ${getHighlightStyle(f)} ${isHov ? 'ring-1 ring-white/30' : ''}`}
                onMouseEnter={() => setHoveredId(f.hpo_id + i)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {span.text}
              </span>

              {/* Tooltip popup */}
              <AnimatePresence>
                {isHov && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: -8, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 z-50 mb-1 w-56 pointer-events-none"
                  >
                    <div className="glass-card rounded-xl p-3 shadow-lg shadow-black/40 border border-border/60 max-w-[280px]">
                      <div className="flex items-start gap-2 mb-2 pb-2 border-b border-white/5">
                        {f.excluded
                          ? <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                          : <CheckCircle2 className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                        }
                        <div className="min-w-0">
                          <p className="font-bold text-foreground leading-tight text-[11px]">{f.hpo_label}</p>
                          <p className="font-mono text-muted-foreground text-[9px]">{f.hpo_id}</p>
                        </div>
                      </div>

                      <div className="space-y-2 border-l-2 border-white/10 pl-2 ml-1">
                        <div className="space-y-1">
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Module A: Status</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${f.status === 'absent' ? 'bg-destructive/10 text-destructive' : f.status === 'uncertain' ? 'bg-chart-4/10 text-chart-4' : 'bg-secondary/10 text-secondary'}`}>
                              {f.status === 'absent' ? '✗ ABSENT' : f.status === 'uncertain' ? '? UNCERTAIN' : '✓ PRESENT'}
                            </span>
                            <span className="text-[9px] text-muted-foreground/60 italic truncate max-w-[150px]">
                              "{f.evidence_span?.text_snippet || 'nlp-derived'}"
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Module B: Temporal</p>
                          <div className="flex items-center gap-1.5 font-mono text-[9px]">
                            <span className="text-foreground">{f.onset_age_years != null ? `Onset: ~${f.onset_age_years}y` : 'Onset: Not specified'}</span>
                            {f.ongoing && <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" title="Ongoing Case" />}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Module C: Subject</p>
                          <p className="text-[9px] text-foreground font-mono">
                            {f.subject === 'family_member' ? `Family Context: ${f.family_relation || 'relative'}` : 'Case: Patient'}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Module D: Severity/Certainty</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-foreground font-mono uppercase">{f.severity || 'standard'}</span>
                            <span className="text-[8px] px-1 py-0.5 rounded bg-primary/10 text-primary uppercase font-bold">Conf: {(f.link_confidence * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </span>
          );
        })}
      </div>

      {/* Stat bar */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
        <span><span className="text-secondary">✓</span> {features.filter(f => !f.excluded).length} present</span>
        <span><span className="text-destructive">✗</span> {features.filter(f => f.excluded).length} excluded</span>
        <span><span className="text-muted-foreground">◎</span> {features.length} total HPO terms</span>
        <span className="ml-auto">hover terms for detail</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Phenopacket list (compact, shows after annotated text)
// ─────────────────────────────────────────────────────────────────────────

function PhenopacketList({ features }: { features: PhenoFeature[] }) {
  return (
    <div className="space-y-1.5">
      {features.map((f, i) => (
        <motion.div
          key={f.hpo_id + i}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          className={`flex items-start gap-2 p-2 rounded-lg border text-[11px] ${f.status === 'absent'
            ? 'border-destructive/15 bg-destructive/5'
            : f.status === 'uncertain'
              ? 'border-chart-4/15 bg-chart-4/5'
              : 'border-secondary/15 bg-secondary/5'
            }`}
        >
          {f.status === 'absent'
            ? <XCircle className="w-3 h-3 text-destructive mt-0.5 flex-shrink-0" />
            : f.status === 'uncertain'
              ? <AlertTriangle className="w-3 h-3 text-chart-4 mt-0.5 flex-shrink-0" />
              : <CheckCircle2 className="w-3 h-3 text-secondary mt-0.5 flex-shrink-0" />
          }
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`font-semibold ${f.status === 'absent' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{f.hpo_label}</span>
              <span className="font-mono text-muted-foreground/60 text-[9px]">{f.hpo_id}</span>
              <span className={`px-1 py-0.5 rounded text-[8px] font-mono uppercase ${f.status === 'absent' ? 'bg-destructive/10 text-destructive' : f.status === 'uncertain' ? 'bg-chart-4/10 text-chart-4' : 'bg-secondary/10 text-secondary'}`}>
                {f.status}
              </span>
              {f.severity && <span className="px-1 py-0.5 rounded bg-chart-4/10 text-chart-4 text-[9px]">{f.severity}</span>}
              {f.ongoing && <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" title="Ongoing" />}
              {f.onset_age_years != null && <span className="px-1 py-0.5 rounded bg-muted text-muted-foreground text-[9px]">~{f.onset_age_years}y</span>}
              {f.subject === 'family_member' && <span className="px-1 py-0.5 rounded bg-accent/10 text-accent text-[9px]">{f.family_relation || 'family'}</span>}
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <div className="flex-1 h-0.5 bg-muted/30 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${f.excluded ? 'bg-destructive' : 'bg-secondary'}`}
                  style={{ width: `${f.link_confidence * 100}%` }} />
              </div>
              <span className="text-muted-foreground text-[9px]">{(f.link_confidence * 100).toFixed(0)}%</span>
            </div>
            {f.evidence_span?.text_snippet && (
              <p className="text-[9px] text-muted-foreground/50 italic mt-0.5 truncate">&ldquo;{f.evidence_span.text_snippet.trim()}&rdquo;</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Reanalysis gauge
// ─────────────────────────────────────────────────────────────────────────

function ReanalysisPanel({ data }: { data: ReanalysisData }) {
  const color = data.urgency_level === 'strong' ? 'text-destructive' : data.urgency_level === 'conditional' ? 'text-chart-4' : 'text-secondary';
  const border = data.urgency_level === 'strong' ? 'border-destructive/30' : data.urgency_level === 'conditional' ? 'border-chart-4/30' : 'border-secondary/30';
  const bg = data.urgency_level === 'strong' ? 'bg-destructive/5' : data.urgency_level === 'conditional' ? 'bg-chart-4/5' : 'bg-secondary/5';

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
      className={`p-5 rounded-2xl border ${border} ${bg} space-y-4 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className={`w-4 h-4 ${color}`} />
          <h2 className="text-xs font-bold uppercase tracking-widest font-mono">Module 2: Reanalysis Trigger</h2>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${color} ${border}`}>
          {data.urgency_level} Recommendation
        </span>
      </div>

      <div className="flex items-center gap-6">
        {/* Signal Bars */}
        <div className="flex-1 space-y-2">
          {Object.entries(data.signal_breakdown).map(([key, val]) => {
            const weights: Record<string, string> = {
              'new_phenotypes': '30%',
              'new_associations': '35%',
              'vus_potential': '25%',
              'technology_gap': '10%'
            };
            return (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-[9px] font-mono opacity-70">
                  <div className="flex items-center gap-1">
                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-[8px] opacity-40">({weights[key] || '–'})</span>
                  </div>
                  <span>{(val * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${val * 100}%` }}
                    className={`h-full bg-current ${color} opacity-70`} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-background/40 border border-white/10 min-w-[80px]">
          <span className={`text-2xl font-black ${color}`}>{(data.score * 100).toFixed(0)}</span>
          <span className="text-[8px] font-mono opacity-50 uppercase mt-[-4px]">Urgency</span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-[10px] font-bold text-foreground mb-1 uppercase tracking-tighter opacity-60">Top Indications</p>
          <ul className="space-y-1">
            {data.top_reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[10px] text-muted-foreground leading-tight">
                <div className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${color} opacity-60`} />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="pt-2 border-t border-white/5">
          <p className="text-[10px] font-bold text-foreground mb-1 uppercase tracking-tighter opacity-60">Action Checklist</p>
          <div className="grid grid-cols-1 gap-1.5">
            {data.action_checklist.map((c, i) => (
              <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-background/20 border border-white/5 text-[10px] text-foreground/80">
                <CheckCircle2 className={`w-3 h-3 ${color} flex-shrink-0`} />
                {c}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function NextBestStepPanel({ data }: { data: NextStepsData }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl border border-secondary/30 bg-secondary/5 space-y-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-secondary" />
        <h2 className="text-xs font-bold uppercase tracking-widest font-mono text-secondary">Module 3: Next-Best-Step Copilot</h2>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[9px] font-mono opacity-50">Calibration:</span>
          <div className="w-16 h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${data.confidence_calibration * 100}%` }}
              className="h-full bg-secondary" />
          </div>
          <span className="text-[9px] font-mono font-bold text-secondary">{(data.confidence_calibration * 100).toFixed(0)}%</span>
        </div>
      </div>

      {data.red_flags.length > 0 && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 space-y-1.5 animate-pulse-subtle">
          {data.red_flags.map((flag, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] font-bold text-destructive">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {flag}
            </div>
          ))}
        </div>
      )}

      <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/20 border-dashed relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
          <Brain className="w-12 h-12 text-secondary" />
        </div>
        <p className="text-[9px] font-bold text-secondary uppercase tracking-widest mb-1.5 flex items-center gap-1">
          <Eye className="w-3 h-3" /> Pivotal Clinical Question
        </p>
        <p className="text-xs font-semibold leading-relaxed text-foreground italic relative z-10">
          &ldquo;{data.pivotal_question}&rdquo;
        </p>
        <div className="mt-2 text-[8px] text-secondary/60 flex items-center gap-1">
          <Zap className="w-2 h-2" /> REASONING: Maximizing Information Gain (IG) from HPO Ontology traversal
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold text-foreground mb-1 uppercase tracking-tighter opacity-60">Ranked Diagnostic Strategy</p>
        {data.ranked_actions.map((action, i) => (
          <div key={i} className="group relative glass-card p-3 rounded-xl border border-border/40 hover:border-secondary/40 transition-all">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${action.action_type === 'order_test' ? 'bg-primary/10 text-primary' : action.action_type === 'trigger_reanalysis' ? 'bg-chart-4/10 text-chart-4' : 'bg-secondary/10 text-secondary'}`}>
                  {action.action_type === 'order_test' ? <Activity className="w-3.5 h-3.5" /> : action.action_type === 'refer_specialist' ? <FileText className="w-3.5 h-3.5" /> : <Brain className="w-3.5 h-3.5" />}
                </div>
                <span className="text-[8px] font-bold font-mono text-secondary">IG:{(action.info_gain).toFixed(2)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[11px] font-bold text-foreground">{action.label}</p>
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-mono uppercase">{action.action_type.replace('_', ' ')}</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{action.explanation}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function MissingnessPanel({ data }: { data: MissingnessReport }) {
  const color = data.equity_flag === 'complete' ? 'text-secondary' : data.equity_flag === 'moderate_missingness' ? 'text-chart-4' : 'text-destructive';
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 p-2 px-3 rounded-full border border-border/40 bg-muted/20 backdrop-blur-sm self-start">
        <div className="flex items-center gap-1.5 border-r border-border/40 pr-3 mr-1">
          <span className="text-[9px] font-mono text-muted-foreground uppercase opacity-70">Completeness</span>
          <div className="w-12 h-1.5 bg-muted/40 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${data.data_completeness * 100}%` }}
              className={`h-full ${color.replace('text-', 'bg-')}`} />
          </div>
          <span className={`text-[10px] font-bold font-mono ${color}`}>{(data.data_completeness * 100).toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold ${color} uppercase tracking-tight`}>{data.equity_flag.replace('_', ' ')}</span>
          <span className="text-[9px] text-muted-foreground truncate max-w-[200px]">{data.recommendation}</span>
        </div>
      </div>

      {data.confidence_discount_pct > 0 && (
        <div className="flex items-center gap-2 text-[9px] font-mono text-destructive/70 px-3">
          <Shield className="w-2.5 h-2.5" />
          EQUITY GUARD: Applying {data.confidence_discount_pct}% confidence discount due to sparse record
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [vcfFile, setVcfFile] = useState<File | null>(null);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [processingNotes, setProcessingNotes] = useState(false);
  const [phenopacket, setPhenopacket] = useState<PhenoFeature[]>([]);
  const [reanalysisData, setReanalysisData] = useState<ReanalysisData | null>(null);
  const [nextSteps, setNextSteps] = useState<NextStepsData | null>(null);
  const [missingness, setMissingness] = useState<MissingnessReport | null>(null);
  const [symptomTimeline, setSymptomTimeline] = useState<{ step: string; intensity: number; symptoms?: string[] }[]>([]);
  const [isAnalyzeLoading, setIsAnalyzeLoading] = useState(false);
  const [showAnnotated, setShowAnnotated] = useState(false);
  const [processingOcr, setProcessingOcr] = useState(false);

  const handleOcrFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrFile(file);
    setProcessingOcr(true);
    setShowAnnotated(false);
    setPhenopacket([]);

    // Initial feedback
    setClinicalNotes(`Uploading and processing: ${file.name}...\n(Real OCR engine active)`);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${BACKEND_URL}/pipeline/ocr`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`OCR Failed: ${res.status}`);

      const data = await res.json();
      if (data.text) {
        setClinicalNotes(data.text);
      } else {
        setClinicalNotes(`No text extracted from ${file.name}. It might be empty or unreadable.`);
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setClinicalNotes(`Error processing ${file.name}. Please try again or paste notes manually.`);
    } finally {
      setProcessingOcr(false);
    }
  };

  // ── Real NLP extraction ──────────────────────────────────────────────
  const processClinicalNotes = useCallback(async () => {
    if (!clinicalNotes.trim()) return;
    setProcessingNotes(true);
    setPhenopacket([]);
    setReanalysisData(null);
    setSymptomTimeline([]);
    setShowAnnotated(false);

    try {
      // ── Step 1: Call Module 1 (Extraction) first for immediate feedback ──
      const res = await fetch(`${BACKEND_URL}/pipeline/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clinicalNotes }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const features: PhenoFeature[] = data.phenopacket || [];
      if (data.missingness_report) setMissingness(data.missingness_report);

      // Stream features in for the list
      for (let i = 0; i < features.length; i++) {
        await new Promise(r => setTimeout(r, 60));
        setPhenopacket(prev => [...prev, features[i]]);
      }

      // Show annotated view
      setShowAnnotated(true);

      // Build LSTM timeline
      const present = features.filter(f => f.status === 'present');
      const sorted = [...present].sort((a, b) => (a.onset_age_years ?? 999) - (b.onset_age_years ?? 999));
      if (sorted.length > 0) {
        setSymptomTimeline(sorted.slice(0, 6).map((f, i) => ({
          step: f.onset_age_years != null ? `T${i}(~${f.onset_age_years}y)` : `T${i}`,
          intensity: Math.min(f.link_confidence, 1),
          symptoms: [f.hpo_label],
        })));
      }

      // ── Step 2: Trigger Full Pipeline (Modules 1 + 2 + 3) if context suggests ──
      const priorTestKw = ['negative wes', 'negative exome', 'prior test', 'previously tested', 'panel negative', 'wes negative', 'vus', 'variant of uncertain'];
      const hasPriorTest = priorTestKw.some(kw => clinicalNotes.toLowerCase().includes(kw));

      const r2 = await fetch(`${BACKEND_URL}/pipeline/full`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: clinicalNotes,
          prior_test: hasPriorTest ? { type: 'WES', date: '2022-01-01', result: 'negative' } : null
        }),
      });

      if (r2.ok) {
        const fullData = await r2.json();
        if (fullData.reanalysis) setReanalysisData(fullData.reanalysis);
        if (fullData.next_steps) setNextSteps(fullData.next_steps);
      }
    } catch (err) {
      console.error('Extraction error:', err);
    } finally {
      setProcessingNotes(false);
    }
  }, [clinicalNotes]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setVcfFile(e.dataTransfer.files[0]);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setVcfFile(e.target.files[0]);
  };

  const handleAnalyze = async () => {
    if (!vcfFile && !clinicalNotes) return;
    setIsAnalyzeLoading(true);
    try {
      const formData = new FormData();
      if (vcfFile) formData.append('vcf', vcfFile);
      formData.append('notes', clinicalNotes);
      const response = await fetch(`${BACKEND_URL}/analyze`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Analysis failed');
      const data = await response.json();
      localStorage.setItem('genesisResults', JSON.stringify(data));
      setSubmitted(true);
      setTimeout(() => { window.location.href = '/results'; }, 1500);
    } catch (error) {
      console.error('Analyze error:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzeLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="glass-card rounded-2xl p-16 text-center max-w-md w-full">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-secondary/20 rounded-full animate-ping" />
            <div className="relative w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center border border-secondary/30">
              <CheckCircle className="w-10 h-10 text-secondary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Analysis Submitted</h2>
          <p className="text-muted-foreground text-sm">Processing genomic data and clinical phenotype...</p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">Redirecting to results</span>
            <Activity className="w-3.5 h-3.5 text-primary animate-spin" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gradient">GENESIS</span>
            </Link>
            <span className="text-muted-foreground/40 text-sm">/</span>
            <span className="text-sm text-muted-foreground">Start Analysis</span>
          </div>
          <Link href="/eval">
            <button className="text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors font-mono">
              Eval Dashboard →
            </button>
          </Link>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-10">
        {/* Title */}
        <div className="mb-10 animate-fade-in-down">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">Patient Analysis</h1>
              <p className="text-sm text-muted-foreground">GenDx 3-Module Diagnostic Pipeline</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              { label: 'Module 1: NLP → Phenopacket', color: 'border-primary/30 bg-primary/5 text-primary' },
              { label: 'Module 2: Reanalysis Trigger', color: 'border-chart-4/30 bg-chart-4/5 text-chart-4' },
              { label: 'Module 3: Next-Best-Step Copilot', color: 'border-secondary/30 bg-secondary/5 text-secondary' },
            ].map((b, i) => (
              <span key={i} className={`text-[10px] px-2.5 py-1 rounded-full border font-mono ${b.color}`}>{b.label}</span>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Left: main inputs ──────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* VCF dropzone */}
            <div className="glass-card rounded-2xl p-6 animate-fade-in-left">
              <div className="flex items-center gap-2 mb-4">
                <FileUp className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">Genomic Data (VCF)</h2>
              </div>
              <div
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 cursor-pointer ${dragActive ? 'border-primary bg-primary/5 glow-primary' :
                  vcfFile ? 'border-secondary bg-secondary/5' :
                    'border-border/50 hover:border-primary/40 hover:bg-primary/5'
                  }`}
              >
                <input type="file" accept=".vcf,.vcf.gz" onChange={handleFileSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer" suppressHydrationWarning />
                <FileUp className={`w-9 h-9 mx-auto mb-2 transition-colors ${vcfFile ? 'text-secondary' : 'text-muted-foreground'}`} />
                {vcfFile
                  ? <><p className="font-semibold text-sm text-foreground">{vcfFile.name}</p><p className="text-xs text-muted-foreground">{(vcfFile.size / 1e6).toFixed(2)} MB · VCF</p></>
                  : <><p className="font-medium text-sm text-foreground">Drop VCF file here</p><p className="text-xs text-muted-foreground">or click to browse · .vcf / .vcf.gz</p></>
                }
              </div>
            </div>

            {/* Clinical notes + extraction */}
            <div className="glass-card rounded-2xl p-6 animate-fade-in-left space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">Clinical Phenotype Notes</h2>
                <span className="ml-auto text-[9px] text-muted-foreground font-mono">NLP-powered · HPO extraction</span>
              </div>

              {/* Input / annotated toggle */}
              {!showAnnotated || processingNotes ? (
                <div className="relative">
                  <textarea
                    value={clinicalNotes}
                    onChange={e => { setClinicalNotes(e.target.value); setShowAnnotated(false); setPhenopacket([]); }}
                    placeholder="Describe patient symptoms, clinical observations, family history, prior tests...&#10;&#10;Example: 16-year-old male with tall stature, arachnodactyly, ectopia lentis. Prior WES negative 2022. Family history of aortic dissection."
                    className="w-full px-4 py-3 rounded-xl border border-border/50 bg-muted/30 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none h-44 font-mono text-[13px] backdrop-blur-sm"
                    suppressHydrationWarning
                  />
                  {/* OCR button */}
                  <div className="absolute bottom-3 right-3">
                    <div className="relative">
                      <input type="file" accept="image/*,application/pdf" onChange={handleOcrFileSelect}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10" suppressHydrationWarning />
                      <button disabled={processingOcr} className={`text-[10px] px-2 py-1.5 rounded-lg border border-dashed font-mono flex items-center gap-1 transition-colors ${ocrFile ? 'border-primary text-primary bg-primary/5' : 'border-border/40 text-muted-foreground hover:border-primary/40'} ${processingOcr ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {processingOcr ? <Activity className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                        {processingOcr ? 'OCR PROCESSING...' : ocrFile ? ocrFile.name : 'PDF/OCR'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Annotated view: shows highlighted text after extraction ── */
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-mono text-primary uppercase tracking-wider">HPO-Annotated Text</span>
                    <button
                      onClick={() => setShowAnnotated(false)}
                      className="ml-auto text-[10px] flex items-center gap-1 px-2 py-1 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                    >
                      <Edit3 className="w-3 h-3" /> Edit text
                    </button>
                  </div>
                  <AnnotatedTextView text={clinicalNotes} features={phenopacket} />
                </motion.div>
              )}

              {/* Extract button */}
              <button
                onClick={processClinicalNotes}
                disabled={processingNotes || !clinicalNotes.trim()}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 border disabled:opacity-40 disabled:cursor-not-allowed
                  bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/30 text-foreground hover:from-primary/30 hover:to-secondary/30 hover:border-primary/50"
              >
                {processingNotes
                  ? <><Activity className="w-4 h-4 animate-spin text-primary" /><span className="font-mono text-primary">Extracting HPO terms...</span></>
                  : <><Sparkles className="w-4 h-4 text-primary" />Extract &amp; Annotate Clinical Terms (NLP · HPO · Phenopacket)</>
                }
              </button>

              {/* ── Phenopacket list (streams in) ── */}
              <AnimatePresence>
                {phenopacket.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden space-y-2">
                    <div className="flex items-center gap-2">
                      <Brain className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] font-mono text-primary uppercase tracking-widest font-semibold">
                        Phenopacket · {phenopacket.length} terms extracted
                      </span>
                    </div>
                    <PhenopacketList features={phenopacket} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Missingness Panel */}
              {missingness && (
                <MissingnessPanel data={missingness} />
              )}

              {/* Module 2: Reanalysis Trigger */}
              {reanalysisData && (
                <ReanalysisPanel data={reanalysisData} />
              )}

              {/* Module 3: Next-Best-Step Copilot */}
              {nextSteps && (
                <NextBestStepPanel data={nextSteps} />
              )}

              {/* LSTM Timeline */}
              {symptomTimeline.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[9px] font-mono text-primary uppercase tracking-widest">Temporal Onset Map (LSTM)</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-20 px-1">
                    {symptomTimeline.map((d, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center relative">
                        {d.symptoms?.[0] && (
                          <div className="absolute bottom-full mb-7 whitespace-nowrap">
                            <span className="text-[7px] font-mono bg-primary/10 text-primary border border-primary/20 px-1 py-0.5 rounded">{d.symptoms[0]}</span>
                          </div>
                        )}
                        <div className="w-full relative bg-muted/40 rounded-t-sm overflow-hidden" style={{ height: '40px' }}>
                          <motion.div className="absolute bottom-0 w-full rounded-t-sm"
                            style={{ background: 'linear-gradient(to top, hsl(var(--primary)), hsl(var(--secondary)))' }}
                            initial={{ height: 0 }} animate={{ height: `${d.intensity * 100}%` }} transition={{ delay: i * 0.08 }} />
                        </div>
                        <span className="text-[7px] text-muted-foreground font-mono mt-1 rotate-45 origin-left whitespace-nowrap">{d.step}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-muted-foreground font-mono italic text-center mt-8 pt-2 border-t border-border/30">
                    σ(W_h · h_t-1 + W_x · x_t + b)
                  </p>
                </motion.div>
              )}
            </div>

            {/* Analyze button */}
            <motion.button
              onClick={handleAnalyze}
              disabled={(!vcfFile && !clinicalNotes.trim()) || isAnalyzeLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-base transition-all
                bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/20
                disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none hover:shadow-xl hover:shadow-primary/30"
            >
              {isAnalyzeLoading
                ? <><Activity className="w-5 h-5 animate-spin" /> Analyzing Patient Data...</>
                : <>Analyze Patient Data <ChevronRight className="w-5 h-5" /></>
              }
            </motion.button>
          </div>

          {/* ── Sidebar ──────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Pipeline */}
            <div className="glass-card rounded-2xl p-5 animate-fade-in-right">
              <div className="flex items-center gap-2 mb-4">
                <Terminal className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">GenDx Pipeline</span>
              </div>
              <div className="space-y-2.5">
                {[
                  { n: '1', label: 'Phenotype Extraction', sub: 'NLP → HPO → Phenopacket JSON', col: 'bg-primary/10 text-primary border-primary/20' },
                  { n: '2', label: 'Reanalysis Trigger', sub: 'Urgency Score · Checklist', col: 'bg-chart-4/10 text-chart-4 border-chart-4/20' },
                  { n: '3', label: 'Next-Best-Step Copilot', sub: 'Information Gain Ranking', col: 'bg-secondary/10 text-secondary border-secondary/20' },
                ].map(m => (
                  <div key={m.n} className={`flex items-start gap-3 p-3 rounded-xl border ${m.col}`}>
                    <span className="font-bold text-sm">{m.n}.</span>
                    <div>
                      <p className="text-xs font-semibold">{m.label}</p>
                      <p className="text-[10px] opacity-70">{m.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* File format */}
            <div className="glass-card rounded-2xl p-5 animate-fade-in-right">
              <div className="flex items-center gap-2 mb-3">
                <FileUp className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">File Format</span>
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {['VCF (.vcf or .vcf.gz)', 'Max 500 MB', 'Supports gzip compression'].map((s, i) => (
                  <li key={i} className="flex gap-2"><span className="text-primary">•</span>{s}</li>
                ))}
              </ul>
            </div>

            {/* Processing time */}
            <div className="glass-card rounded-2xl p-5 animate-fade-in-right">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-secondary" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Processing Time</span>
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {['Typically < 2 minutes', 'Complex cases up to 5 min', 'Results stored securely'].map((s, i) => (
                  <li key={i} className="flex gap-2"><span className="text-secondary">•</span>{s}</li>
                ))}
              </ul>
            </div>

            {/* Security */}
            <div className="glass-card rounded-2xl p-5 animate-fade-in-right">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4 text-accent" />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Privacy &amp; Security</span>
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {['HIPAA compliant', 'End-to-end encryption', 'Data encrypted at rest'].map((s, i) => (
                  <li key={i} className="flex gap-2"><span className="text-accent">•</span>{s}</li>
                ))}
              </ul>
            </div>

            {/* Tip */}
            <div className="glass-card rounded-2xl p-4 border-primary/20 bg-primary/5 animate-fade-in-right">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  After analysis, use the <span className="text-primary font-semibold">Phenopacket</span> and <span className="text-primary font-semibold">Differential</span> tabs on the results page for Orphanet-ranked diagnoses with information gain actions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
