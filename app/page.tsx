'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Microscope, Brain, Target, Zap, ArrowRight, Activity, Database,
  GitBranch, BookOpenText, Pill, Clock, Shield, Sparkles, Atom,
  Gauge, Radiation, Orbit, Network, ScanFace
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background particle-bg">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center animate-glow">
              <Microscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gradient">GENESIS</span>
              <span className="text-[10px] ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium uppercase tracking-wider">v2.0</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#architecture" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Architecture
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pipeline
            </a>
            <Link href="/upload">
              <Button size="sm" className="bg-primary/90 hover:bg-primary text-primary-foreground">
                Launch Platform
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative px-6 py-20 md:py-28 max-w-7xl mx-auto overflow-hidden">
          {/* Animated background orbs */}
          <div className="absolute top-10 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-secondary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

          <div className="relative grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium text-primary">Multi-Modal AI Reasoning Engine</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-5 leading-[1.1] tracking-tight">
                  Explainable<br />
                  <span className="text-gradient">Rare Disease</span><br />
                  Diagnostics
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                  GENESIS combines <strong className="text-foreground">Bayesian inference</strong>, <strong className="text-foreground">knowledge graphs</strong>, and <strong className="text-foreground">multi-modal evidence fusion</strong> to deliver transparent, research-grade diagnostics for rare genetic conditions.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 animate-fade-in-up delay-200">
                <Link href="/upload">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 glow-primary">
                    Start Analysis
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="#architecture">
                  <Button size="lg" variant="outline" className="border-border/50 hover:border-primary/50 hover:bg-primary/5">
                    View Architecture
                  </Button>
                </Link>
                <Link href="/epistalink">
                  <Button size="lg" variant="outline" className="border-violet-500/40 hover:border-violet-400/60 hover:bg-violet-500/10 text-violet-300 gap-2">
                    <Atom className="w-4 h-4" />
                    EpistaLink
                  </Button>
                </Link>
                <Link href="/anthropicx">
                  <Button size="lg" variant="outline" className="border-blue-500/40 hover:border-blue-400/60 hover:bg-blue-500/10 text-blue-300 gap-2 font-mono tracking-wider">
                    <Orbit className="w-4 h-4" />
                    AnthropicX
                  </Button>
                </Link>
                <Link href="/mira">
                  <Button size="lg" variant="outline" className="border-rose-500/40 hover:border-rose-400/60 hover:bg-rose-500/10 text-rose-300 gap-2 font-mono tracking-wider">
                    <ScanFace className="w-4 h-4" />
                    MIRA
                  </Button>
                </Link>
                <Link href="/heteronet">
                  <Button size="lg" variant="outline" className="border-amber-500/40 hover:border-amber-400/60 hover:bg-amber-500/10 text-amber-300 gap-2 font-mono tracking-wider">
                    <Network className="w-4 h-4" />
                    HeteroNet
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 pt-8 border-t border-border/50 animate-fade-in-up delay-400">
                {[
                  { value: '35+', label: 'Rare Diseases' },
                  { value: '31', label: 'Genes Indexed' },
                  { value: '50+', label: 'HPO Terms' },
                  { value: '8', label: 'Evidence Sources' },
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="text-2xl font-bold text-gradient">{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Visual - DNA/Network Animation */}
            <div className="hidden md:block animate-fade-in-right delay-300">
              <div className="relative glass-card rounded-2xl p-8 overflow-hidden">
                {/* Animated network visualization */}
                <svg viewBox="0 0 400 400" className="w-full h-auto">
                  {/* Background grid */}
                  <defs>
                    <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="oklch(0.72 0.15 220)" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="oklch(0.72 0.15 220)" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="oklch(0.72 0.15 220)" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="oklch(0.65 0.20 290)" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>

                  {/* Connection lines */}
                  {[
                    [200, 200, 100, 100], [200, 200, 300, 80], [200, 200, 320, 250],
                    [200, 200, 80, 300], [200, 200, 280, 340], [100, 100, 300, 80],
                    [300, 80, 320, 250], [320, 250, 280, 340], [80, 300, 280, 340],
                    [100, 100, 80, 300], [200, 200, 150, 180], [200, 200, 250, 150],
                  ].map(([x1, y1, x2, y2], i) => (
                    <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke="url(#lineGrad)" strokeWidth="1" opacity="0.5">
                      <animate attributeName="opacity" values="0.2;0.6;0.2" dur={`${3 + i * 0.5}s`} repeatCount="indefinite" />
                    </line>
                  ))}

                  {/* Central Gene node */}
                  <circle cx="200" cy="200" r="30" fill="oklch(0.72 0.15 220)" opacity="0.2">
                    <animate attributeName="r" values="28;32;28" dur="3s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="200" cy="200" r="18" fill="oklch(0.72 0.15 220)" opacity="0.8">
                    <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <text x="200" y="205" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">FBN1</text>

                  {/* Disease nodes */}
                  {[
                    { x: 100, y: 100, label: 'Marfan', color: 'oklch(0.60 0.20 25)' },
                    { x: 300, y: 80, label: 'Loeys-Dietz', color: 'oklch(0.60 0.20 25)' },
                  ].map((node, i) => (
                    <g key={`disease-${i}`}>
                      <circle cx={node.x} cy={node.y} r="22" fill={node.color} opacity="0.2">
                        <animate attributeName="r" values="20;24;20" dur={`${3 + i}s`} repeatCount="indefinite" />
                      </circle>
                      <circle cx={node.x} cy={node.y} r="14" fill={node.color} opacity="0.7" />
                      <text x={node.x} y={node.y + 4} textAnchor="middle" fill="white" fontSize="7" fontWeight="600">{node.label}</text>
                    </g>
                  ))}

                  {/* Phenotype nodes */}
                  {[
                    { x: 320, y: 250, label: 'Scoliosis' },
                    { x: 80, y: 300, label: 'Tall stature' },
                    { x: 280, y: 340, label: 'Ectopia lentis' },
                  ].map((node, i) => (
                    <g key={`pheno-${i}`}>
                      <circle cx={node.x} cy={node.y} r="18" fill="oklch(0.70 0.18 155)" opacity="0.2">
                        <animate attributeName="r" values="16;20;16" dur={`${4 + i}s`} repeatCount="indefinite" />
                      </circle>
                      <circle cx={node.x} cy={node.y} r="12" fill="oklch(0.70 0.18 155)" opacity="0.6" />
                      <text x={node.x} y={node.y + 3} textAnchor="middle" fill="white" fontSize="6">{node.label}</text>
                    </g>
                  ))}

                  {/* Pathway nodes */}
                  {[
                    { x: 150, y: 180, label: 'ECM' },
                    { x: 250, y: 150, label: 'TGF-β' },
                  ].map((node, i) => (
                    <g key={`path-${i}`}>
                      <circle cx={node.x} cy={node.y} r="14" fill="oklch(0.65 0.20 290)" opacity="0.2" />
                      <circle cx={node.x} cy={node.y} r="10" fill="oklch(0.65 0.20 290)" opacity="0.5" />
                      <text x={node.x} y={node.y + 3} textAnchor="middle" fill="white" fontSize="7">{node.label}</text>
                    </g>
                  ))}

                  {/* Legend */}
                  <g transform="translate(10, 370)">
                    {[
                      { color: 'oklch(0.72 0.15 220)', label: 'Gene' },
                      { color: 'oklch(0.60 0.20 25)', label: 'Disease' },
                      { color: 'oklch(0.70 0.18 155)', label: 'Phenotype' },
                      { color: 'oklch(0.65 0.20 290)', label: 'Pathway' },
                    ].map((item, i) => (
                      <g key={i} transform={`translate(${i * 95}, 0)`}>
                        <circle cx="6" cy="0" r="4" fill={item.color} opacity="0.8" />
                        <text x="14" y="4" fill="oklch(0.60 0.02 240)" fontSize="8">{item.label}</text>
                      </g>
                    ))}
                  </g>
                </svg>

                <div className="absolute top-4 right-4">
                  <span className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                    Live Knowledge Graph
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Research-Grade <span className="text-gradient">Capabilities</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Six integrated evidence sources powering transparent, explainable diagnostics
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Brain,
                  title: 'Bayesian Inference Engine',
                  description: 'Probabilistic reasoning with posterior probability updates across multiple evidence modalities',
                  gradient: 'from-primary/20 to-primary/5',
                  iconColor: 'text-primary',
                },
                {
                  icon: GitBranch,
                  title: 'Knowledge Graph Explorer',
                  description: 'Interactive gene-disease-phenotype network with pathway traversal and cross-gene connections',
                  gradient: 'from-secondary/20 to-secondary/5',
                  iconColor: 'text-secondary',
                },
                {
                  icon: Activity,
                  title: 'Phenotype Specificity Scoring',
                  description: 'HPO-weighted phenotype matching using information content and specificity metrics',
                  gradient: 'from-accent/20 to-accent/5',
                  iconColor: 'text-accent',
                },
                {
                  icon: Pill,
                  title: 'Drug Repurposing Engine',
                  description: 'FDA-approved treatment recommendations based on molecular pathway similarities',
                  gradient: 'from-chart-4/20 to-chart-4/5',
                  iconColor: 'text-chart-4',
                },
                {
                  icon: Clock,
                  title: 'Temporal Progression Model',
                  description: 'Disease timeline prediction with age-dependent symptom modeling and treatment windows',
                  gradient: 'from-chart-5/20 to-chart-5/5',
                  iconColor: 'text-chart-5',
                },
                {
                  icon: BookOpenText,
                  title: 'Literature Mining',
                  description: 'PubMed citation extraction with relevance scoring for evidence-based recommendations',
                  gradient: 'from-primary/20 to-accent/5',
                  iconColor: 'text-primary',
                },
                {
                  icon: Atom,
                  title: 'EpistaLink — Epistasis Detection',
                  description: 'Detects variant–variant interactions using sparse autoencoders and hyperbolic scoring. Reveals loss/gain of function missed by single-variant analysis.',
                  gradient: 'from-violet-500/20 to-cyan-500/5',
                  iconColor: 'text-violet-400',
                },
                {
                  icon: Gauge,
                  title: 'AnthropicX — Latent Attractor System',
                  description: 'Aligns genomes and phenotypes into a shared Stiefel Manifold. Uses Shannon Entropy to weight rare clinical biomarkers and Laplacian diffusion for risk prediction.',
                  gradient: 'from-cyan-500/20 to-blue-500/5',
                  iconColor: 'text-cyan-400',
                },
                {
                  icon: Network,
                  title: 'HeteroNet — Cardiac Heterotaxy Cascade',
                  description: 'Genotype–Phenotype cascade modeling for cardiac heterotaxy. Solves ICD misclassification, rare disease under-identification, and care fragmentation through 8-phase ML pipeline.',
                  gradient: 'from-amber-500/20 to-orange-500/5',
                  iconColor: 'text-amber-400',
                },
              ].map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <Card key={i} className={`glass-card glass-card-hover border-border/30 animate-fade-in-up delay-${(i + 1) * 100}`}>
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3`}>
                        <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Architecture Section */}
        <section id="architecture" className="px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4">
                System <span className="text-gradient-purple">Architecture</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Multi-modal evidence fusion pipeline with explainable AI reasoning
              </p>
            </div>

            <div className="glass-card rounded-2xl p-8 md:p-12">
              <div className="grid md:grid-cols-5 gap-4 items-center">
                {[
                  { step: '01', title: 'Input', desc: 'VCF + Clinical Notes', icon: Database, color: 'bg-primary/20 text-primary' },
                  { step: '02', title: 'Extract', desc: 'HPO + Variants', icon: Target, color: 'bg-secondary/20 text-secondary' },
                  { step: '03', title: 'Reason', desc: 'Bayesian Engine', icon: Brain, color: 'bg-accent/20 text-accent' },
                  { step: '04', title: 'Fuse', desc: '8 Evidence Sources', icon: GitBranch, color: 'bg-chart-4/20 text-chart-4' },
                  { step: '05', title: 'Explain', desc: 'Ranked Diagnoses', icon: Zap, color: 'bg-chart-5/20 text-chart-5' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <React.Fragment key={i}>
                      <div className="text-center">
                        <div className={`w-16 h-16 rounded-2xl ${item.color} flex items-center justify-center mx-auto mb-3`}>
                          <Icon className="w-7 h-7" />
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mb-1">STEP {item.step}</div>
                        <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      {i < 4 && (
                        <div className="hidden md:flex items-center justify-center">
                          <ArrowRight className="w-5 h-5 text-muted-foreground/30" />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Core Neural Architectures */}
              <div className="grid md:grid-cols-2 gap-6 mt-12">
                <div className="glass-card bg-violet-500/5 border-violet-500/20 p-6 rounded-xl relative overflow-hidden group hover:bg-violet-500/10 transition-colors">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Atom className="w-24 h-24 text-violet-500" /></div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-violet-500/20 rounded-lg"><Atom className="w-5 h-5 text-violet-300" /></div>
                    <h4 className="text-lg font-bold text-white">EpistaLink Architecture</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-400">
                    <li className="flex gap-2"><span className="text-violet-400">►</span> <span><strong>Sparse Autoencoder:</strong> Compresses 50k variants into R^512 latent space.</span></li>
                    <li className="flex gap-2"><span className="text-violet-400">►</span> <span><strong>Hyperbolic Interaction:</strong> Models non-linear epistasis in negative curvature space.</span></li>
                    <li className="flex gap-2"><span className="text-violet-400">►</span> <span><strong>Output:</strong> Pairwise interaction scores (β-weights) for variant combinations.</span></li>
                  </ul>
                </div>

                <div className="glass-card bg-rose-500/5 border-rose-500/20 p-6 rounded-xl relative overflow-hidden group hover:bg-rose-500/10 transition-colors">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Orbit className="w-24 h-24 text-rose-500" /></div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-rose-500/20 rounded-lg"><Gauge className="w-5 h-5 text-rose-300" /></div>
                    <h4 className="text-lg font-bold text-white">AnthropicX Architecture</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-400">
                    <li className="flex gap-2"><span className="text-rose-400">►</span> <span><strong>Spectral Manifold:</strong> Fiedler vector embedding for gene-phenotype alignment.</span></li>
                    <li className="flex gap-2"><span className="text-rose-400">►</span> <span><strong>Attractor Dynamics:</strong> Gravity-based classification of patient trajectory.</span></li>
                    <li className="flex gap-2"><span className="text-rose-400">►</span> <span><strong>Shadow Phenotypes:</strong> Latent variable prediction for future symptom onset.</span></li>
                  </ul>
                </div>

              </div>

              <div className="mt-10 pt-8 border-t border-border/30">
                <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Evidence Sources</h4>
                <div className="flex flex-wrap gap-3">
                  {[
                    'HPO Phenotype Ontology',
                    'ClinVar Variant Database',
                    'Reactome Pathways',
                    'PubMed Literature',
                    'Temporal Disease Models',
                    'ACMG/AMP Guidelines',
                    'EpistaLink Epistasis',
                  ].map((source, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-muted/50 text-xs text-muted-foreground border border-border/30">
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Novel <span className="text-gradient">Research Contributions</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                What makes GENESIS unique compared to existing diagnostic tools
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  title: 'Multi-Modal Evidence Fusion',
                  description: 'Unlike single-modality tools, GENESIS integrates genomic variants, clinical phenotypes, biological pathways, temporal patterns, and literature evidence into a unified Bayesian framework.',
                  highlight: 'Most diagnostic tools only use 1-2 evidence sources',
                },
                {
                  title: 'Temporal Disease Progression',
                  description: 'Unique temporal reasoning that models disease progression over time, matching patient symptom onset patterns against known disease timelines for improved diagnostic accuracy.',
                  highlight: 'No existing tool models temporal symptom progression',
                },
                {
                  title: 'Complete Evidence Provenance',
                  description: 'Every diagnostic recommendation comes with a full evidence chain showing exactly how each evidence source contributed to the final score, enabling clinical trust.',
                  highlight: 'Full transparency in AI reasoning',
                },
                {
                  title: 'Drug Repurposing Intelligence',
                  description: 'Integrated treatment recommendations based on molecular pathway analysis, including FDA-approved drugs, gene therapies, and clinical trial information.',
                  highlight: 'From diagnosis to treatment in one platform',
                },
              ].map((item, i) => (
                <div key={i} className="glass-card glass-card-hover rounded-xl p-8">
                  <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">{item.description}</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-medium text-primary">{item.highlight}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="glass-card rounded-2xl p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
              <div className="relative space-y-8">
                <div>
                  <h2 className="text-4xl font-bold text-foreground mb-4">Ready to Diagnose?</h2>
                  <p className="text-lg text-muted-foreground">
                    Upload patient genomic data and clinical observations to receive evidence-based diagnostic insights
                  </p>
                </div>
                <Link href="/upload">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 px-8 glow-primary">
                    Access Platform
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Microscope className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-gradient">GENESIS v2.0</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <span>Multi-Modal AI Diagnostic Engine</span>
              <span>•</span>
              <span>Hackrare 2025</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" /> HIPAA Compliant
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
