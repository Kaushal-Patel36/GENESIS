'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Microscope, ArrowLeft, Brain, Shield, Activity, GitBranch,
  BookOpenText, Pill, Clock, Target, ChevronRight, AlertTriangle,
  CheckCircle2, HelpCircle, XCircle, ExternalLink, Sparkles,
  ListTree, FlaskConical, Dna, HeartPulse, ArrowRight, Cpu, Zap,
  BarChart3, Network, FileText, Clipboard, GitFork, TrendingUp
} from 'lucide-react';
import { DiagnosticScoreChart } from './DiagnosticScoreChart';
import { EvidenceRadarChart } from './EvidenceRadarChart';
import { ConfidenceGauge } from './ConfidenceGauge';
import { NeuralPipelineViz } from './NeuralPipelineViz';
import { CascadeView } from './CascadeView';

// Types
interface DiagnosisResult {
  rank: number;
  gene: { symbol: string; name: string; chromosome?: string; description?: string };
  disease: { id: string; name: string; associated_genes: string[] };
  score: number;
  confidence: string;
  matching_phenotypes: { id: string; label: string; description?: string }[];
  variants: { id: string; gene_symbol: string; clinvar_classification: string; weight: number }[];
  pathways: { id: string; name: string }[];
  evidence: { source: string; description: string; score_contribution: number }[];
  explanation: string;
  ml_scores?: {
    nlp_extractions: { hpo_id: string; label: string; confidence: number; source_text: string; method: string; negated: boolean }[];
    variant_predictions: { variant_id: string; pathogenicity_score: number; classification: string; confidence: number; feature_importances: Record<string, number> }[];
    phenotype_similarity: Record<string, number>;
    gnn_scores: Record<string, number>;
    gnn_similar_genes: { gene: string; similarity: number }[];
    pathway_perturbation_score?: number;
  };
}

interface NextStepsResult {
  suggested_phenotypes: { hpo_id: string; label: string }[];
  test_recommendations: string[];
  referral_specialties: string[];
  uncertainty_analysis: string;
  red_flags: string[];
  inheritance_logic?: string;
  summary_action: string;
}

interface AnalysisResponse {
  results: DiagnosisResult[];
  phenopacket?: any[];
  next_steps?: NextStepsResult;
  processing_time_ms?: number;
  analysis_metadata?: {
    engine_version: string;
    reasoning_method: string;
    candidate_genes_evaluated: number;
    hpo_terms_used: number;
    evidence_sources: string[];
    ml_models_active?: string[];
  };
}

interface DrugData {
  name: string;
  type: string;
  mechanism: string;
  status: string;
  evidence: string;
}

interface TimelineStage {
  age: string;
  symptoms: string[];
}

interface TimelineData {
  disease_name: string;
  onset_age: string;
  life_expectancy: string;
  progression: TimelineStage[];
}

interface LiteratureCitation {
  pmid: string;
  title: string;
  journal: string;
  year: number;
  relevance: number;
}

interface KGNode {
  id: string;
  label: string;
  type: string;
  metadata?: Record<string, any>;
}

interface KGEdge {
  source: string;
  target: string;
  relationship: string;
  weight: number;
}

type TabKey = 'overview' | 'phenopacket' | 'differential' | 'knowledge-graph' | 'pathways' | 'drugs' | 'timeline' | 'literature' | 'ai-models' | 'cascade';

const BACKEND_URL = 'http://localhost:8000';

export default function ResultsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [selectedResult, setSelectedResult] = useState<number>(0);

  // Side-panel data
  const [kgData, setKgData] = useState<{ nodes: KGNode[]; edges: KGEdge[] } | null>(null);
  const [drugData, setDrugData] = useState<{ recommendations: DrugData[] } | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [litData, setLitData] = useState<{ citations: LiteratureCitation[] } | null>(null);
  const [pathwayData, setPathwayData] = useState<any>(null);
  const [mlExplainData, setMlExplainData] = useState<any>(null);
  const [mlStatus, setMlStatus] = useState<any>(null);
  const [cascadeData, setCascadeData] = useState<any>(null);
  const [orphanetDiff, setOrphanetDiff] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('genesisResults');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setData(parsed);
      } catch {
        console.error('Failed to parse results');
      }
    }
    setLoading(false);
  }, []);

  // Fetch enrichment data when a result is selected
  const currentResult = data?.results?.[selectedResult];

  useEffect(() => {
    if (!currentResult) return;
    const gene = currentResult.gene.symbol;
    const diseaseId = currentResult.disease.id;

    // Knowledge graph
    fetch(`${BACKEND_URL}/knowledge-graph/${gene}`)
      .then(r => r.json()).then(setKgData).catch(console.error);

    // Drugs
    fetch(`${BACKEND_URL}/drugs/recommendations/${diseaseId}`)
      .then(r => r.json()).then(setDrugData).catch(console.error);

    // Timeline
    fetch(`${BACKEND_URL}/timeline/${diseaseId}`)
      .then(r => r.json()).then(setTimelineData).catch(() => setTimelineData(null));

    // Literature
    fetch(`${BACKEND_URL}/literature/${gene}`)
      .then(r => r.json()).then(setLitData).catch(console.error);

    // Pathways
    fetch(`${BACKEND_URL}/pathways/${gene}`)
      .then(r => r.json()).then(setPathwayData).catch(console.error);

    // ML Explain
    fetch(`${BACKEND_URL}/ml/explain/${gene}`)
      .then(r => r.json()).then(setMlExplainData).catch(console.error);

    // Cascade / Pathway Perturbation
    fetch(`${BACKEND_URL}/cascade/${gene}`)
      .then(r => r.json()).then(setCascadeData).catch(() => setCascadeData(null));

    // Orphanet Differential
    const observedHpo = data?.phenopacket?.filter((p: any) => !p.excluded).map((p: any) => p.hpo_id) || [];
    const hpoParam = observedHpo.join(',');
    fetch(`${BACKEND_URL}/pipeline/differential/${gene}?hpo_ids=${hpoParam}`)
      .then(r => r.json()).then(setOrphanetDiff).catch(() => setOrphanetDiff(null));

    // ML Status (once)
    if (!mlStatus) {
      fetch(`${BACKEND_URL}/ml/status`)
        .then(r => r.json()).then(setMlStatus).catch(console.error);
    }
  }, [currentResult]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="dna-loader mx-auto justify-center">
            <div className="dot" /><div className="dot" /><div className="dot" /><div className="dot" /><div className="dot" />
          </div>
          <p className="text-muted-foreground">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.results?.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 glass-card rounded-2xl p-12">
          <AlertTriangle className="w-16 h-16 text-chart-5 mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">No Results Found</h2>
          <p className="text-muted-foreground max-w-md">
            No diagnostic data available. Please upload patient data first.
          </p>
          <Link href="/upload">
            <Button className="bg-primary text-primary-foreground gap-2">
              <ArrowLeft className="w-4 h-4" /> Go to Upload
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: Activity },
    { key: 'phenopacket', label: 'Phenopacket', icon: Clipboard },
    { key: 'differential', label: 'Differential', icon: GitFork },
    { key: 'cascade', label: 'Biological Cascade', icon: Dna },
    { key: 'ai-models', label: 'AI Models', icon: Brain },
    { key: 'knowledge-graph', label: 'Knowledge Graph', icon: GitBranch },
    { key: 'pathways', label: 'Pathways', icon: ListTree },
    { key: 'drugs', label: 'Drug Repurposing', icon: Pill },
    { key: 'timeline', label: 'Disease Timeline', icon: Clock },
    { key: 'literature', label: 'Literature', icon: BookOpenText },
  ];

  const confidenceColors: Record<string, string> = {
    High: 'text-secondary border-secondary/30 bg-secondary/10',
    Medium: 'text-chart-4 border-chart-4/30 bg-chart-4/10',
    Low: 'text-muted-foreground border-border bg-muted/50',
  };

  const confidenceIcon: Record<string, any> = {
    High: CheckCircle2,
    Medium: HelpCircle,
    Low: XCircle,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Microscope className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gradient">GENESIS</span>
            </Link>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground">Diagnostic Results</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2 py-1 rounded bg-secondary/10 text-secondary font-medium">
              {data.analysis_metadata?.reasoning_method || 'Bayesian Multi-Modal Inference'}
            </span>
            <Link href="/upload">
              <Button size="sm" variant="outline" className="gap-1 text-xs">
                <ArrowLeft className="w-3 h-3" /> New Analysis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Metadata bar */}
        <div className="glass-card rounded-xl p-4 mb-6 flex items-center justify-between flex-wrap gap-4 animate-fade-in-down">
          <div className="flex items-center gap-6">
            {[
              { label: 'Candidates Evaluated', value: data.analysis_metadata?.candidate_genes_evaluated || '–' },
              { label: 'HPO Terms Used', value: data.analysis_metadata?.hpo_terms_used || '–' },
              { label: 'Evidence Sources', value: data.analysis_metadata?.evidence_sources?.length || '–' },
              { label: 'Top Diagnoses', value: data.results.length },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-lg font-bold text-gradient">{item.value}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-secondary" />
            <span className="text-xs text-muted-foreground">Engine v{data.analysis_metadata?.engine_version || '2.0'}</span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left sidebar - Ranked results */}
          <div className="col-span-12 lg:col-span-3 space-y-3 animate-fade-in-left">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Ranked Diagnoses
            </h3>
            {data.results.map((result, i) => {
              const ConfIcon = confidenceIcon[result.confidence] || HelpCircle;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedResult(i)}
                  className={`w-full text-left glass-card rounded-xl p-4 transition-all duration-200 ${selectedResult === i
                    ? 'border-primary/50 bg-primary/5 glow-primary'
                    : 'hover:border-border/50 hover:bg-muted/20'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-primary/20 text-primary' : 'bg-muted/50 text-muted-foreground'
                      }`}>
                      #{result.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground text-sm truncate">{result.disease.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono text-primary">{result.gene.symbol}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${confidenceColors[result.confidence]}`}>
                          {result.confidence}
                        </span>
                      </div>
                      {/* Score bar */}
                      <div className="mt-2 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                          style={{ width: `${Math.min((result.score / (data.results[0]?.score || 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">Score: {result.score}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Main content */}
          <div className="col-span-12 lg:col-span-9 animate-fade-in-up delay-100">
            {/* Tabs */}
            <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2 border-b border-border/30">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${activeTab === tab.key
                      ? 'text-primary bg-primary/5 tab-active'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            {currentResult && (
              <div className="animate-scale-in" key={`${selectedResult}-${activeTab}`}>
                {activeTab === 'overview' && <OverviewTab result={currentResult} data={data} />}
                {activeTab === 'phenopacket' && (
                  <div className="space-y-4">
                    <div className="glass-card rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Clipboard className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold text-foreground">Structured Phenopacket</h3>
                        <span className="ml-auto text-xs text-muted-foreground px-2 py-1 rounded bg-muted">
                          {data.phenopacket?.length || 0} features extracted
                        </span>
                      </div>
                      {data.phenopacket && data.phenopacket.length > 0 ? (
                        <div className="space-y-2">
                          {data.phenopacket.map((f: any, i: number) => (
                            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${f.excluded ? 'border-destructive/15 bg-destructive/5' : 'border-secondary/20 bg-secondary/5'}`}>
                              {f.excluded
                                ? <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                                : <CheckCircle2 className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                              }
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-sm font-semibold ${f.excluded ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                    {f.hpo_label}
                                  </span>
                                  <span className="text-[10px] font-mono text-muted-foreground">{f.hpo_id}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${f.excluded ? 'bg-destructive/10 text-destructive' : 'bg-secondary/10 text-secondary'}`}>
                                    {f.excluded ? 'absent' : 'present'}
                                  </span>
                                  {f.subject === 'family_member' && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent">family hx</span>
                                  )}
                                  {f.onset_age_years != null && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">onset ~{f.onset_age_years}y</span>
                                  )}
                                  {f.severity && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-chart-4/10 text-chart-4">{f.severity}</span>
                                  )}
                                </div>
                                <div className="mt-1.5 flex items-center gap-2">
                                  <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-primary" style={{ width: `${(f.link_confidence || 0) * 100}%` }} />
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">{((f.link_confidence || 0) * 100).toFixed(0)}% confidence</span>
                                </div>
                                {f.evidence_span?.text_snippet && (
                                  <p className="text-[10px] text-muted-foreground/60 italic mt-1 truncate">
                                    &ldquo;{f.evidence_span.text_snippet.trim()}&rdquo;
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          <Clipboard className="w-8 h-8 mx-auto mb-3 opacity-40" />
                          <p>No phenopacket data available. Run analysis with clinical notes to see structured features.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'differential' && (
                  <div className="space-y-4">
                    {/* Orphanet Differential */}
                    <div className="glass-card rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <GitFork className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold text-foreground">Orphanet Differential Diagnosis</h3>
                        <span className="text-xs text-muted-foreground ml-auto">log-likelihood ranked</span>
                      </div>
                      {orphanetDiff?.differential ? (
                        <div className="space-y-3">
                          {orphanetDiff.differential.map((d: any, i: number) => (
                            <div key={i} className={`p-4 rounded-xl border ${i === 0 ? 'border-primary/40 bg-primary/5' : 'border-border/30 bg-muted/10'}`}>
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-foreground">{d.disease_name}</span>
                                    <span className="text-[10px] font-mono text-muted-foreground">{d.disease_id}</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    Log-likelihood: {d.log_likelihood?.toFixed(3)}
                                  </div>
                                </div>
                                <div className={`text-xs px-2 py-1 rounded font-medium ${i === 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                  #{i + 1}
                                </div>
                              </div>
                              {/* Supporting features */}
                              {d.supporting_features?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {d.supporting_features.map((sf: any, j: number) => (
                                    <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                                      ✓ {sf.label}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {/* Contradicting features */}
                              {d.contradicting_features?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  {d.contradicting_features.map((cf: any, j: number) => (
                                    <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                                      ✗ {cf.label}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          <GitFork className="w-8 h-8 mx-auto mb-3 opacity-40 animate-pulse" />
                          <p>Loading Orphanet differential...</p>
                        </div>
                      )}
                    </div>
                    {/* Information Gain */}
                    {orphanetDiff?.info_gain_actions?.length > 0 && (
                      <div className="glass-card rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <TrendingUp className="w-5 h-5 text-chart-4" />
                          <h3 className="text-base font-bold text-foreground">Next Discriminating Questions</h3>
                          <span className="text-xs text-muted-foreground ml-2">ranked by information gain</span>
                        </div>
                        <div className="space-y-2">
                          {orphanetDiff.info_gain_actions.map((a: any, i: number) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/20">
                              <div className="w-7 h-7 rounded-full bg-chart-4/10 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-chart-4">{i + 1}</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-foreground">Does the patient have <span className="text-chart-4">{a.label}</span>?</span>
                                  <span className="text-[10px] font-mono text-muted-foreground">{a.hpo_id}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{a.reason}</p>
                                <div className="mt-1.5 flex items-center gap-2">
                                  <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-chart-4" style={{ width: `${Math.min(a.info_gain * 100, 100)}%` }} />
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">IG: {a.info_gain?.toFixed(3)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'cascade' && cascadeData && <CascadeView data={cascadeData} />}
                {activeTab === 'cascade' && !cascadeData && (
                  <div className="glass-card rounded-xl p-12 text-center">
                    <Dna className="w-8 h-8 mx-auto mb-3 text-muted-foreground animate-pulse" />
                    <p className="text-muted-foreground text-sm">Loading cascade analysis...</p>
                  </div>
                )}
                {activeTab === 'ai-models' && <AIModelsTab result={currentResult} mlExplainData={mlExplainData} mlStatus={mlStatus} />}
                {activeTab === 'knowledge-graph' && <KnowledgeGraphTab data={kgData} gene={currentResult.gene.symbol} />}
                {activeTab === 'pathways' && <PathwaysTab data={pathwayData} gene={currentResult.gene.symbol} />}
                {activeTab === 'drugs' && <DrugsTab data={drugData} disease={currentResult.disease} />}
                {activeTab === 'timeline' && <TimelineTab data={timelineData} disease={currentResult.disease} />}
                {activeTab === 'literature' && <LiteratureTab data={litData} gene={currentResult.gene.symbol} />}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TAB COMPONENTS
// ============================================================================

function OverviewTab({ result, data }: { result: DiagnosisResult; data: AnalysisResponse }) {
  return (
    <div className="space-y-6">
      {/* Diagnosis summary card — enhanced with gauge */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground">{result.disease.name}</h2>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="outline" className="font-mono text-primary border-primary/30 bg-primary/10">
                {result.gene.symbol}
              </Badge>
              <span className="text-sm text-muted-foreground">Chr {result.gene.chromosome || '–'}</span>
              <span className="text-xs text-muted-foreground">{result.disease.id}</span>
            </div>
            <p className="text-muted-foreground leading-relaxed mt-4">
              {result.explanation}
            </p>
            {result.gene.description && (
              <p className="text-sm text-muted-foreground/80 italic border-l-2 border-primary/30 pl-3 mt-3">
                {result.gene.description}
              </p>
            )}
          </div>
          {/* Animated Confidence Gauge */}
          <div className="flex-shrink-0 ml-4">
            <ConfidenceGauge
              score={result.score}
              maxScore={Math.max(result.score * 1.3, 30)}
              confidence={result.confidence}
            />
          </div>
        </div>
      </div>

      {/* Evidence breakdown + Radar + Score chart — 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evidence sources */}
        <Card className="glass-card border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Evidence Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.evidence.map((ev, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{ev.source}</span>
                    <span className="text-xs font-mono text-primary">+{ev.score_contribution}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{ev.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Evidence Radar Fingerprint */}
        <Card className="glass-card border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              Evidence Fingerprint
            </CardTitle>
            <CardDescription>7-dimensional diagnostic signature</CardDescription>
          </CardHeader>
          <CardContent>
            <EvidenceRadarChart evidence={result.evidence} />
          </CardContent>
        </Card>

        {/* Score Chart */}
        <DiagnosticScoreChart data={data.results} />
      </div>

      {/* Matching phenotypes + Variants */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Phenotypes */}
        <Card className="glass-card border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-secondary" />
              Matching Phenotypes ({result.matching_phenotypes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {result.matching_phenotypes.map((p, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-secondary/10 text-secondary text-xs font-medium border border-secondary/20">
                  {p.label}
                </span>
              ))}
              {result.matching_phenotypes.length === 0 && (
                <span className="text-sm text-muted-foreground">No phenotypes matched</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Variants */}
        <Card className="glass-card border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Dna className="w-4 h-4 text-accent" />
              Identified Variants ({result.variants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.variants.length > 0 ? (
              <div className="space-y-2">
                {result.variants.map((v, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <span className="text-xs font-mono text-foreground">{v.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.clinvar_classification === 'Pathogenic' ? 'bg-destructive/10 text-destructive' :
                      v.clinvar_classification === 'Likely Pathogenic' ? 'bg-chart-5/10 text-chart-5' :
                        v.clinvar_classification === 'VUS' ? 'bg-chart-4/10 text-chart-4' :
                          'bg-muted text-muted-foreground'
                      }`}>
                      {v.clinvar_classification}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">No variants identified in VCF</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Next steps */}
      {data.next_steps && (
        <Card className="glass-card border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-chart-4" />
              Suggested Next Steps
            </CardTitle>
            {data.next_steps.summary_action && (
              <p className="text-sm text-muted-foreground mt-1">{data.next_steps.summary_action}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Test Recommendations */}
            {data.next_steps.test_recommendations?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recommended Tests</p>
                <div className="grid md:grid-cols-2 gap-3">
                  {data.next_steps.test_recommendations.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/20">
                      <div className="w-6 h-6 rounded-full bg-chart-4/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-chart-4">{i + 1}</span>
                      </div>
                      <span className="text-sm text-foreground">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Red Flags */}
            {data.next_steps.red_flags?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-destructive/70 uppercase tracking-wider mb-2">⚠ Red Flags</p>
                <div className="flex flex-wrap gap-2">
                  {data.next_steps.red_flags.map((flag, i) => (
                    <span key={i} className="px-2.5 py-1 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20">{flag}</span>
                  ))}
                </div>
              </div>
            )}
            {/* Referral Specialties */}
            {data.next_steps.referral_specialties?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Referrals</p>
                <div className="flex flex-wrap gap-2">
                  {data.next_steps.referral_specialties.map((spec, i) => (
                    <span key={i} className="px-2.5 py-1 text-xs rounded-lg bg-primary/10 text-primary border border-primary/20">{spec}</span>
                  ))}
                </div>
              </div>
            )}
            {/* Uncertainty note */}
            {data.next_steps.uncertainty_analysis && (
              <p className="text-xs text-muted-foreground italic border-l-2 border-muted pl-3">{data.next_steps.uncertainty_analysis}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KnowledgeGraphTab({ data, gene }: { data: { nodes: KGNode[]; edges: KGEdge[] } | null; gene: string }) {
  if (!data) return <LoadingState />;

  const nodesByType = {
    gene: data.nodes.filter(n => n.type === 'gene'),
    disease: data.nodes.filter(n => n.type === 'disease'),
    phenotype: data.nodes.filter(n => n.type === 'phenotype'),
    pathway: data.nodes.filter(n => n.type === 'pathway'),
    drug: data.nodes.filter(n => n.type === 'drug'),
  };

  // Layout nodes in concentric circles
  const centerX = 350, centerY = 280;
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    // Center gene
    const mainGene = data.nodes.find(n => n.id === `gene_${gene}`);
    if (mainGene) positions[mainGene.id] = { x: centerX, y: centerY };

    // Inner ring: diseases + related genes
    const innerNodes = [...nodesByType.disease, ...nodesByType.gene.filter(n => n.id !== `gene_${gene}`)];
    innerNodes.forEach((n, i) => {
      const angle = (i / innerNodes.length) * Math.PI * 2 - Math.PI / 2;
      positions[n.id] = { x: centerX + Math.cos(angle) * 120, y: centerY + Math.sin(angle) * 100 };
    });

    // Middle ring: phenotypes
    nodesByType.phenotype.forEach((n, i) => {
      const angle = (i / nodesByType.phenotype.length) * Math.PI * 2;
      positions[n.id] = { x: centerX + Math.cos(angle) * 210, y: centerY + Math.sin(angle) * 180 };
    });

    // Outer ring: pathways + drugs
    const outerNodes = [...nodesByType.pathway, ...nodesByType.drug];
    outerNodes.forEach((n, i) => {
      const angle = (i / outerNodes.length) * Math.PI * 2 + Math.PI / 4;
      positions[n.id] = { x: centerX + Math.cos(angle) * 250, y: centerY + Math.sin(angle) * 220 };
    });

    return positions;
  }, [data]);

  const typeColors: Record<string, string> = {
    gene: '#3b82f6',
    disease: '#ef4444',
    phenotype: '#10b981',
    pathway: '#a855f7',
    drug: '#f59e0b',
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">Knowledge Graph: {gene}</h3>
            <p className="text-sm text-muted-foreground">Interactive gene-disease-phenotype network</p>
          </div>
          <div className="flex items-center gap-4">
            {Object.entries(nodesByType).map(([type, nodes]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: typeColors[type] }} />
                <span className="text-xs text-muted-foreground capitalize">{type} ({nodes.length})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-muted/20 rounded-xl p-2 border border-border/20">
          <svg viewBox="0 50 700 460" className="w-full h-[500px]">
            <defs>
              {Object.entries(typeColors).map(([type, color]) => (
                <radialGradient key={type} id={`glow-${type}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={color} stopOpacity="0" />
                </radialGradient>
              ))}
            </defs>

            {/* Edges */}
            {data.edges.map((edge, i) => {
              const from = nodePositions[edge.source];
              const to = nodePositions[edge.target];
              if (!from || !to) return null;
              return (
                <g key={i}>
                  <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke="#555" strokeWidth="1" opacity="0.3" />
                </g>
              );
            })}

            {/* Nodes */}
            {data.nodes.map((node, i) => {
              const pos = nodePositions[node.id];
              if (!pos) return null;
              const isCenter = node.id === `gene_${gene}`;
              const r = isCenter ? 28 : node.type === 'gene' ? 18 : 14;
              const color = typeColors[node.type] || '#888';

              return (
                <g key={node.id}>
                  <circle cx={pos.x} cy={pos.y} r={r + 8} fill={`url(#glow-${node.type})`}>
                    {isCenter && <animate attributeName="r" values={`${r + 6};${r + 14};${r + 6}`} dur="3s" repeatCount="indefinite" />}
                  </circle>
                  <circle cx={pos.x} cy={pos.y} r={r} fill={color} opacity={isCenter ? 0.9 : 0.7}
                    stroke={color} strokeWidth={isCenter ? 2 : 1} strokeOpacity={0.5} />
                  <text x={pos.x} y={pos.y + (isCenter ? 4 : 3)} textAnchor="middle"
                    fill="white" fontSize={isCenter ? '10' : '7'} fontWeight={isCenter ? 'bold' : '500'}>
                    {node.label.length > 12 ? node.label.slice(0, 12) + '…' : node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Node summary cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="glass-card border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Connected Diseases</CardTitle>
          </CardHeader>
          <CardContent>
            {nodesByType.disease.map((n, i) => (
              <div key={i} className="text-sm text-foreground py-1">{n.label}</div>
            ))}
          </CardContent>
        </Card>
        <Card className="glass-card border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Shared Phenotypes</CardTitle>
          </CardHeader>
          <CardContent>
            {nodesByType.phenotype.slice(0, 6).map((n, i) => (
              <div key={i} className="text-sm text-foreground py-1">{n.label}</div>
            ))}
            {nodesByType.phenotype.length > 6 && (
              <div className="text-xs text-muted-foreground pt-1">+{nodesByType.phenotype.length - 6} more</div>
            )}
          </CardContent>
        </Card>
        <Card className="glass-card border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Related Genes</CardTitle>
          </CardHeader>
          <CardContent>
            {nodesByType.gene.filter(n => n.id !== `gene_${gene}`).map((n, i) => (
              <div key={i} className="text-sm text-foreground py-1 font-mono">{n.label}</div>
            ))}
            {nodesByType.gene.length <= 1 && (
              <div className="text-sm text-muted-foreground">No cross-gene connections found</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PathwaysTab({ data, gene }: { data: any; gene: string }) {
  if (!data) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-2">Pathway Enrichment: {gene}</h3>
        <p className="text-sm text-muted-foreground mb-6">Reactome/KEGG biological pathway analysis</p>

        <div className="space-y-4">
          {data.pathways?.map((pathway: any, i: number) => (
            <div key={i} className="glass-card rounded-xl p-5 glass-card-hover">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono text-accent px-2 py-0.5 rounded bg-accent/10">{pathway.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pathway.significance === 'High' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                      }`}>
                      {pathway.significance}
                    </span>
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">{pathway.name}</h4>
                  {pathway.shared_genes?.length > 0 && (
                    <div className="mt-3">
                      <span className="text-xs text-muted-foreground">Shared with: </span>
                      {pathway.shared_genes.map((g: string, j: number) => (
                        <span key={j} className="text-xs font-mono text-primary ml-1">{g}</span>
                      ))}
                    </div>
                  )}
                </div>
                <FlaskConical className="w-8 h-8 text-accent/30" />
              </div>
            </div>
          ))}
          {(!data.pathways || data.pathways.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">No pathway data available for this gene</div>
          )}
        </div>
      </div>
    </div>
  );
}

function DrugsTab({ data, disease }: { data: { recommendations: DrugData[] } | null; disease: any }) {
  if (!data) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-foreground">Drug Repurposing: {disease.name}</h3>
            <p className="text-sm text-muted-foreground">{data.recommendations?.length || 0} therapeutic options identified</p>
          </div>
          <Pill className="w-8 h-8 text-chart-4/30" />
        </div>

        <div className="space-y-4">
          {data.recommendations?.map((drug, i) => (
            <div key={i} className="glass-card rounded-xl p-5 glass-card-hover">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-bold text-foreground text-lg">{drug.name}</h4>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${drug.status.includes('FDA Approved') ? 'bg-secondary/10 text-secondary border border-secondary/20' :
                  drug.status.includes('EU') ? 'bg-primary/10 text-primary border border-primary/20' :
                    'bg-muted text-muted-foreground'
                  }`}>
                  {drug.status}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground w-20 flex-shrink-0">Type:</span>
                  <span className="text-foreground">{drug.type}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground w-20 flex-shrink-0">Mechanism:</span>
                  <span className="text-foreground">{drug.mechanism}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground w-20 flex-shrink-0">Evidence:</span>
                  <span className="text-foreground">{drug.evidence}</span>
                </div>
              </div>
            </div>
          ))}
          {(!data.recommendations || data.recommendations.length === 0) && (
            <div className="text-center py-8">
              <Pill className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground">No drug recommendations available for this condition</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineTab({ data, disease }: { data: TimelineData | null; disease: any }) {
  if (!data || (data as any).detail) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <Clock className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Timeline Data</h3>
        <p className="text-sm text-muted-foreground">Temporal progression data is not available for {disease.name}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-foreground">Disease Progression: {data.disease_name}</h3>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>Onset: <strong className="text-foreground">{data.onset_age}</strong></span>
              <span>Life Expectancy: <strong className="text-foreground">{data.life_expectancy}</strong></span>
            </div>
          </div>
          <Clock className="w-8 h-8 text-chart-5/30" />
        </div>

        {/* Timeline visualization */}
        <div className="relative pl-8 space-y-0">
          {data.progression.map((stage, i) => (
            <div key={i} className="relative pb-8 last:pb-0">
              {/* Vertical line */}
              {i < data.progression.length - 1 && (
                <div className="absolute left-[-20px] top-6 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 to-primary/10" />
              )}
              {/* Dot */}
              <div className="absolute left-[-24px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />

              <div className="glass-card rounded-xl p-4 glass-card-hover">
                <div className="text-sm font-bold text-primary mb-2">{stage.age}</div>
                <div className="flex flex-wrap gap-2">
                  {stage.symptoms.map((symptom, j) => (
                    <span key={j} className="text-xs px-2.5 py-1 rounded-lg bg-muted/50 text-foreground border border-border/20">
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LiteratureTab({ data, gene }: { data: { citations: LiteratureCitation[] } | null; gene: string }) {
  if (!data) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-foreground">Literature: {gene}</h3>
            <p className="text-sm text-muted-foreground">{data.citations?.length || 0} relevant citations found</p>
          </div>
          <BookOpenText className="w-8 h-8 text-primary/30" />
        </div>

        <div className="space-y-4">
          {data.citations?.map((citation, i) => (
            <div key={i} className="glass-card rounded-xl p-5 glass-card-hover">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground text-sm leading-relaxed mb-2">
                    {citation.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-medium text-accent">{citation.journal}</span>
                    <span>{citation.year}</span>
                    <span className="font-mono">PMID: {citation.pmid}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-gradient">{(citation.relevance * 100).toFixed(0)}%</div>
                  <div className="text-[10px] text-muted-foreground">Relevance</div>
                </div>
              </div>
              {/* Relevance bar */}
              <div className="mt-3 h-1 bg-muted/30 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  style={{ width: `${citation.relevance * 100}%` }} />
              </div>
            </div>
          ))}
          {(!data.citations || data.citations.length === 0) && (
            <div className="text-center py-8">
              <BookOpenText className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground">No literature citations available for {gene}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AIModelsTab({ result, mlExplainData, mlStatus }: { result: DiagnosisResult; mlExplainData: any; mlStatus: any }) {
  const mlScores = result.ml_scores;
  const methodColors: Record<string, string> = {
    'exact_match': 'text-secondary bg-secondary/10 border-secondary/30',
    'synonym_match': 'text-primary bg-primary/10 border-primary/30',
    'semantic_similarity': 'text-chart-4 bg-chart-4/10 border-chart-4/30',
    'tfidf_similarity': 'text-chart-5 bg-chart-5/10 border-chart-5/30',
  };

  const classColors: Record<string, string> = {
    'Pathogenic': 'text-red-400 bg-red-500/10',
    'Likely Pathogenic': 'text-orange-400 bg-orange-500/10',
    'VUS': 'text-yellow-400 bg-yellow-500/10',
    'Likely Benign': 'text-blue-400 bg-blue-500/10',
    'Benign': 'text-green-400 bg-green-500/10',
  };

  // Extract metrics for the pipeline viz
  const nlpCount = mlScores?.nlp_extractions?.length || 0;
  const topVariant = mlExplainData?.variant_analysis?.predictions?.[0];
  const topPhenoSim = mlScores?.phenotype_similarity
    ? Math.max(...Object.values(mlScores.phenotype_similarity).map(v => Number(v) || 0), 0)
    : 0;
  const topGnn = mlScores?.gnn_scores
    ? Math.max(...Object.values(mlScores.gnn_scores).map(v => Number(v) || 0), 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Animated Neural Pipeline */}
      <NeuralPipelineViz
        modelsActive={[]}
        nlpCount={nlpCount}
        variantScore={topVariant?.pathogenicity_score || 0}
        phenoSim={topPhenoSim}
        gnnScore={topGnn}
      />

      {/* Model Status Cards */}
      {mlStatus?.models && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mlStatus.models.map((model: any, i: number) => (
            <div key={i} className="glass-card rounded-xl p-4 border border-border/30 hover:border-primary/40 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                {i === 0 && <FileText className="w-4 h-4 text-secondary" />}
                {i === 1 && <Dna className="w-4 h-4 text-primary" />}
                {i === 2 && <Network className="w-4 h-4 text-chart-4" />}
                {i === 3 && <Brain className="w-4 h-4 text-chart-5" />}
                <span className="text-xs font-semibold text-foreground">{model.name}</span>
              </div>
              <div className="text-[10px] font-mono text-muted-foreground mb-2">{model.model_type}</div>
              <div className="flex flex-wrap gap-1">
                {(model.capabilities || []).slice(0, 2).map((cap: string, j: number) => (
                  <span key={j} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">{cap}</span>
                ))}
              </div>
              {model.training_accuracy && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-muted/30 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: `${model.training_accuracy * 100}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-primary">{(model.training_accuracy * 100).toFixed(1)}%</span>
                </div>
              )}
              {model.parameters && (
                <div className="mt-1 text-[10px] text-muted-foreground">{model.parameters.toLocaleString()} params</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* NLP Extraction */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-secondary" />
          <h3 className="text-base font-bold text-foreground">Clinical NLP Extraction</h3>
          <span className="text-xs text-muted-foreground ml-auto">sentence-transformers + TF-IDF</span>
        </div>
        {mlScores?.nlp_extractions && mlScores.nlp_extractions.length > 0 ? (
          <div className="space-y-3">
            {mlScores.nlp_extractions.map((ext, i) => (
              <div key={i} className={`rounded-lg p-3 border ${ext.negated ? 'bg-red-500/5 border-red-500/20' : 'bg-muted/10 border-border/30'}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{ext.label}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{ext.hpo_id}</span>
                    {ext.negated && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">NEGATED</span>}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${methodColors[ext.method] || 'text-muted-foreground bg-muted/50'}`}>
                    {ext.method.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="text-xs text-muted-foreground italic flex-1">&ldquo;{ext.source_text}&rdquo;</div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-16 bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-secondary to-primary rounded-full" style={{ width: `${ext.confidence * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-secondary">{(ext.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No clinical notes were provided for NLP extraction.</p>
        )}
      </div>

      {/* Variant Pathogenicity Predictions */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Dna className="w-5 h-5 text-primary" />
          <h3 className="text-base font-bold text-foreground">DL Variant Pathogenicity Predictor</h3>
          <span className="text-xs text-muted-foreground ml-auto">PyTorch MLP • BLOSUM62 + Conservation</span>
        </div>
        {mlExplainData?.variant_analysis?.predictions && mlExplainData.variant_analysis.predictions.length > 0 ? (
          <div className="space-y-4">
            {mlExplainData.variant_analysis.predictions.map((pred: any, i: number) => (
              <div key={i} className="rounded-lg bg-muted/10 p-4 border border-border/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-semibold text-primary">{pred.variant_id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${classColors[pred.classification] || ''}`}>
                      {pred.classification}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-foreground">{(pred.pathogenicity_score * 100).toFixed(0)}%</span>
                  </div>
                </div>
                {/* Pathogenicity bar */}
                <div className="h-3 bg-muted/30 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pred.pathogenicity_score * 100}%`,
                      background: pred.pathogenicity_score > 0.65
                        ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                        : pred.pathogenicity_score > 0.35
                          ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                          : 'linear-gradient(90deg, #22c55e, #16a34a)'
                    }} />
                </div>
                {/* Feature importances */}
                {pred.top_features && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Feature Importance</div>
                    {Object.entries(pred.top_features).map(([feature, importance]: [string, any]) => (
                      <div key={feature} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-36 truncate">{feature.replace(/_/g, ' ')}</span>
                        <div className="h-1.5 flex-1 bg-muted/20 rounded-full overflow-hidden">
                          <div className="h-full bg-primary/60 rounded-full" style={{ width: `${Math.min(importance * 300, 100)}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground w-10 text-right">{(importance * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {mlScores?.variant_predictions && mlScores.variant_predictions.length > 0 ? (
              <div className="space-y-3 w-full">
                {mlScores.variant_predictions.map((pred, i) => (
                  <div key={i} className="rounded-lg bg-muted/10 p-3 border border-border/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono text-primary">{pred.variant_id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${classColors[pred.classification] || ''}`}>
                        {pred.classification} — {(pred.pathogenicity_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span>No variants found in VCF data for this gene.</span>
            )}
          </div>
        )}
      </div>

      {/* GNN & Phenotype Similarity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GNN Similar Genes */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-chart-5" />
            <h3 className="text-base font-bold text-foreground">GNN Gene Network</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Graph Convolutional Network computes node embeddings from gene-disease-phenotype-pathway graph. Link prediction scores for gene-disease associations.
          </p>
          {mlExplainData?.gnn_analysis?.similar_genes && (
            <div className="space-y-2">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Most Similar Genes to {result.gene.symbol}</div>
              {mlExplainData.gnn_analysis.similar_genes.map((g: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-mono font-semibold text-foreground w-16">{g.gene}</span>
                  <div className="h-2 flex-1 bg-muted/20 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-chart-5 to-primary rounded-full"
                      style={{ width: `${Math.max(g.similarity * 100, 5)}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground w-12 text-right">{(g.similarity * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}
          {mlExplainData?.gnn_analysis?.disease_associations && (
            <div className="mt-4 space-y-2">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Disease Association Scores</div>
              {Object.entries(mlExplainData.gnn_analysis.disease_associations).slice(0, 5).map(([diseaseId, data]: [string, any]) => (
                <div key={diseaseId} className="flex items-center gap-3">
                  <span className="text-xs text-foreground w-40 truncate">{data.disease_name}</span>
                  <div className="h-2 flex-1 bg-muted/20 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                      style={{ width: `${data.gnn_score * 100}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-primary w-12 text-right">{(data.gnn_score * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Phenotype Similarity */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Network className="w-5 h-5 text-chart-4" />
            <h3 className="text-base font-bold text-foreground">Phenotype Embeddings</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            128-dim embeddings learned via contrastive learning with IC-weighted loss. Cosine similarity between patient phenotype set and disease profiles.
          </p>
          {mlScores?.phenotype_similarity && Object.keys(mlScores.phenotype_similarity).length > 0 ? (
            <div className="space-y-2">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Disease Profile Similarity</div>
              {Object.entries(mlScores.phenotype_similarity)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 8)
                .map(([diseaseId, similarity]) => (
                  <div key={diseaseId} className="flex items-center gap-3">
                    <span className="text-xs text-foreground w-40 truncate">{diseaseId.replace('OMIM:', '')}</span>
                    <div className="h-2 flex-1 bg-muted/20 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-chart-4 to-accent rounded-full"
                        style={{ width: `${(similarity as number) * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-chart-4 w-12 text-right">{((similarity as number) * 100).toFixed(1)}%</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No phenotype similarity data available.</p>
          )}
          {/* IC Scores from ML Explain */}
          {mlExplainData?.phenotype_analysis?.hpo_terms && (
            <div className="mt-4 space-y-2">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Information Content Scores</div>
              {Object.entries(mlExplainData.phenotype_analysis.hpo_terms).slice(0, 6).map(([hpo, data]: [string, any]) => (
                <div key={hpo} className="flex items-center gap-2">
                  <span className="text-xs text-foreground w-32 truncate">{data.label}</span>
                  <div className="h-1.5 flex-1 bg-muted/20 rounded-full overflow-hidden">
                    <div className="h-full bg-chart-4/60 rounded-full" style={{ width: `${data.ic_score * 100}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground w-10 text-right">{(data.ic_score * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="glass-card rounded-xl p-12 text-center">
      <div className="dna-loader mx-auto justify-center mb-4">
        <div className="dot" /><div className="dot" /><div className="dot" /><div className="dot" /><div className="dot" />
      </div>
      <p className="text-sm text-muted-foreground">Loading data...</p>
    </div>
  );
}
