'use client'

import Link from 'next/link'
import { ArrowLeft, AlertCircle, CheckCircle2, BookOpen, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dna } from 'lucide-react'

export default function DiagnosisDetailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 right-1/3 w-80 h-80 rounded-full bg-secondary/10 blur-3xl opacity-40" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl opacity-30" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Link href="/results" className="flex items-center gap-2 group">
              <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-secondary transition-colors" />
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Dna className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-foreground">GENESIS</span>
              </div>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Title Section */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-6 mb-4">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">Marfan Syndrome</h1>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent text-sm font-medium">
                    <AlertCircle className="w-4 h-4" />
                    Likely Pathogenic
                  </span>
                  <span className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary">
                    92% Confidence
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Variant Information */}
            <Card className="border border-border shadow-sm bg-card/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🧬</span>
                  Genetic Variant
                </CardTitle>
                <CardDescription>Primary pathogenic variant identified</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Gene</p>
                    <p className="text-xl font-bold text-foreground">FBN1</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Variant</p>
                    <p className="text-lg font-mono font-semibold text-foreground">c.1234C&gt;T (p.Arg412Cys)</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">ACMG Classification</p>
                    <p className="text-lg font-semibold text-accent">Pathogenic</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Inheritance Pattern</p>
                    <p className="text-lg font-semibold text-foreground">Autosomal Dominant</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Phenotype Matches */}
            <Card className="border border-border shadow-sm bg-card/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-secondary" />
                  Phenotype Matches
                </CardTitle>
                <CardDescription>Patient symptoms align with diagnosis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { phenotype: 'Arachnodactyly', match: 95, icon: '🖐️' },
                    { phenotype: 'Lens subluxation', match: 88, icon: '👁️' },
                    { phenotype: 'Cardiovascular abnormalities', match: 82, icon: '❤️' },
                    { phenotype: 'Skeletal manifestations', match: 78, icon: '🦴' },
                    { phenotype: 'Skin striae', match: 72, icon: '✨' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 rounded-lg border border-border bg-muted/30">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{item.phenotype}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-semibold text-secondary">{item.match}%</span>
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                            <div
                              className="h-full bg-gradient-to-r from-secondary to-primary"
                              style={{ width: `${item.match}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Biological Pathway */}
            <Card className="border border-border shadow-sm bg-card/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-secondary" />
                  Biological Pathway
                </CardTitle>
                <CardDescription>Gene function and disease mechanism</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Pathway Flow */}
                  <div className="relative">
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-2">
                      {[
                        { label: 'FBN1 Gene', detail: 'Fibrillin-1 encoding' },
                        { label: 'ECM Protein', detail: 'Extracellular matrix component' },
                        { label: 'TGF-β Pathway', detail: 'Signaling cascade dysregulation' },
                        { label: 'Connective Tissue', detail: 'Structural abnormalities' },
                      ].map((step, i) => (
                        <div key={i} className="flex items-center gap-3 flex-1">
                          <div className="flex-1 p-3 rounded-lg border border-border bg-muted/40 text-center">
                            <p className="font-semibold text-sm text-foreground">{step.label}</p>
                            <p className="text-xs text-muted-foreground mt-1">{step.detail}</p>
                          </div>
                          {i < 3 && (
                            <div className="hidden md:block text-secondary text-xl">→</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pathway Description */}
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-sm text-foreground leading-relaxed">
                      The FBN1 variant impairs fibrillin-1, a critical structural protein in the extracellular matrix.
                      This leads to dysregulation of TGF-β signaling, causing widespread connective tissue abnormalities
                      characteristic of Marfan Syndrome, including skeletal, ocular, and cardiovascular manifestations.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Evidence Sources */}
            <Card className="border border-border shadow-sm bg-card/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-secondary" />
                  Evidence Sources
                </CardTitle>
                <CardDescription>Supporting clinical and research evidence</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { source: 'ClinVar', id: 'VAR0123456', status: 'Pathogenic' },
                    { source: 'OMIM', id: '#154700', status: 'Marfan Syndrome' },
                    { source: 'Gene Ontology', id: 'GO:0007155', status: 'Cell adhesion' },
                    { source: 'PubMed', id: '18+ citations', status: 'FBN1 pathogenic variants' },
                  ].map((evidence, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg border border-border bg-muted/30 flex items-center justify-between hover:border-secondary/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-foreground">{evidence.source}</p>
                        <p className="text-sm text-muted-foreground">{evidence.id}</p>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-medium">
                        {evidence.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/evidence-graph/1" className="flex-1">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-secondary text-secondary hover:bg-secondary/10 bg-transparent"
                >
                  View Evidence Graph
                </Button>
              </Link>
              <Button
                size="lg"
                className="flex-1 bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/20"
              >
                Recommend Clinical Action
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
