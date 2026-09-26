'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Zap, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dna } from 'lucide-react'

export default function EvidenceGraphPage() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  const nodes = [
    { id: 'gene', label: 'FBN1 Gene', type: 'gene', x: 100, y: 200 },
    { id: 'protein', label: 'Fibrillin-1', type: 'protein', x: 300, y: 100 },
    { id: 'pathway', label: 'ECM Organization', type: 'pathway', x: 300, y: 300 },
    { id: 'phenotype1', label: 'Skeletal', type: 'phenotype', x: 500, y: 50 },
    { id: 'phenotype2', label: 'Ocular', type: 'phenotype', x: 500, y: 200 },
    { id: 'phenotype3', label: 'Cardiovascular', type: 'phenotype', x: 500, y: 350 },
    { id: 'disease', label: 'Marfan Syndrome', type: 'disease', x: 650, y: 200 },
  ]

  const edges = [
    { from: 'gene', to: 'protein' },
    { from: 'gene', to: 'pathway' },
    { from: 'protein', to: 'phenotype1' },
    { from: 'protein', to: 'phenotype2' },
    { from: 'pathway', to: 'phenotype3' },
    { from: 'phenotype1', to: 'disease' },
    { from: 'phenotype2', to: 'disease' },
    { from: 'phenotype3', to: 'disease' },
  ]

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'gene':
        return 'from-primary to-primary/80'
      case 'protein':
        return 'from-secondary to-secondary/80'
      case 'pathway':
        return 'from-secondary to-primary'
      case 'phenotype':
        return 'from-accent to-accent/80'
      case 'disease':
        return 'from-primary to-secondary'
      default:
        return 'from-muted to-muted'
    }
  }

  const getNodeInfo = (id: string) => {
    const infoMap: Record<string, { title: string; desc: string }> = {
      gene: {
        title: 'FBN1 Gene',
        desc: 'Fibrillin-1 encoding gene; pathogenic variant c.1234C>T identified',
      },
      protein: {
        title: 'Fibrillin-1 Protein',
        desc: 'Critical structural protein in extracellular matrix; impaired function',
      },
      pathway: {
        title: 'ECM Organization',
        desc: 'Extracellular matrix assembly and TGF-β signaling pathway',
      },
      phenotype1: {
        title: 'Skeletal Manifestations',
        desc: 'Arachnodactyly, tall stature, scoliosis (95% match)',
      },
      phenotype2: {
        title: 'Ocular Features',
        desc: 'Lens subluxation, myopia, astigmatism (88% match)',
      },
      phenotype3: {
        title: 'Cardiovascular Abnormalities',
        desc: 'Aortic root dilatation, mitral valve prolapse (82% match)',
      },
      disease: {
        title: 'Marfan Syndrome',
        desc: 'Systemic connective tissue disorder with 92% confidence',
      },
    }
    return infoMap[id]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 right-1/3 w-80 h-80 rounded-full bg-secondary/10 blur-3xl opacity-40" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl opacity-30" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Link href="/diagnosis/1" className="flex items-center gap-2 group">
              <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-secondary transition-colors" />
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Dna className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-foreground">GENESIS</span>
              </div>
            </Link>
            <h1 className="text-xl font-semibold text-foreground">Evidence Graph</h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Graph Visualization */}
            <div className="lg:col-span-3">
              <Card className="border border-border shadow-sm bg-card/95 backdrop-blur-sm h-full overflow-hidden">
                <CardHeader>
                  <CardTitle>Gene-Phenotype-Disease Network</CardTitle>
                  <CardDescription>Interactive graph showing biological relationships</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <svg
                    width="100%"
                    height="500"
                    viewBox="0 0 750 400"
                    className="bg-gradient-to-b from-muted/20 to-background"
                  >
                    {/* Edges */}
                    <defs>
                      <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.2" />
                      </linearGradient>
                    </defs>
                    {edges.map((edge, i) => {
                      const fromNode = nodes.find((n) => n.id === edge.from)
                      const toNode = nodes.find((n) => n.id === edge.to)
                      if (!fromNode || !toNode) return null
                      return (
                        <line
                          key={i}
                          x1={fromNode.x + 50}
                          y1={fromNode.y + 20}
                          x2={toNode.x + 50}
                          y2={toNode.y + 20}
                          stroke="url(#edgeGradient)"
                          strokeWidth="2"
                          className="opacity-50"
                        />
                      )
                    })}

                    {/* Nodes */}
                    {nodes.map((node) => (
                      <g
                        key={node.id}
                        onMouseEnter={() => setHoveredNode(node.id)}
                        onMouseLeave={() => setHoveredNode(null)}
                        className="cursor-pointer"
                      >
                        {/* Node circle */}
                        <circle
                          cx={node.x + 50}
                          cy={node.y + 20}
                          r={hoveredNode === node.id ? 35 : 30}
                          className={`bg-gradient-to-br ${getNodeColor(node.type)} transition-all`}
                          fill={hoveredNode === node.id ? 'url(#nodeGlow)' : 'none'}
                          stroke={
                            hoveredNode === node.id
                              ? 'var(--color-secondary)'
                              : 'var(--color-primary)'
                          }
                          strokeWidth={hoveredNode === node.id ? 2.5 : 2}
                        />

                        {/* Icon/Type indicator */}
                        <text
                          x={node.x + 50}
                          y={node.y + 28}
                          textAnchor="middle"
                          className="text-xs font-bold fill-foreground pointer-events-none"
                          opacity={hoveredNode === node.id ? 1 : 0.6}
                        >
                          {node.type === 'gene'
                            ? '🧬'
                            : node.type === 'protein'
                              ? '🔗'
                              : node.type === 'pathway'
                                ? '🛤️'
                                : node.type === 'phenotype'
                                  ? '👁️'
                                  : '🎯'}
                        </text>
                      </g>
                    ))}

                    {/* Labels (only show on hover for cleanliness) */}
                    {hoveredNode &&
                      nodes.map((node) => (
                        <text
                          key={`label-${node.id}`}
                          x={node.x + 50}
                          y={node.y - 45}
                          textAnchor="middle"
                          className="text-xs font-semibold fill-foreground pointer-events-none"
                        >
                          {node.label}
                        </text>
                      ))}
                  </svg>
                </CardContent>
              </Card>
            </div>

            {/* Information Panel */}
            <div className="lg:col-span-1">
              <Card className="border border-border shadow-sm bg-card/95 backdrop-blur-sm sticky top-24 h-fit">
                <CardHeader>
                  <CardTitle className="text-lg">Node Information</CardTitle>
                  <CardDescription>Hover over graph nodes</CardDescription>
                </CardHeader>
                <CardContent>
                  {hoveredNode ? (
                    <div className="space-y-4">
                      <div className="p-3 rounded-lg bg-muted/40 border border-border">
                        <h3 className="font-semibold text-foreground mb-2">
                          {getNodeInfo(hoveredNode)?.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {getNodeInfo(hoveredNode)?.desc}
                        </p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Info className="w-4 h-4" />
                          <span>Hover over other nodes to explore</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 text-center py-4">
                      <div className="text-3xl">🧬</div>
                      <p className="text-sm text-muted-foreground">
                        Hover over nodes in the graph to view detailed information and evidence
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                        <div className="p-2 rounded bg-primary/10 text-primary font-medium">Gene</div>
                        <div className="p-2 rounded bg-secondary/10 text-secondary font-medium">Protein</div>
                        <div className="p-2 rounded bg-accent/10 text-accent font-medium">Phenotype</div>
                        <div className="p-2 rounded bg-muted/30 text-foreground font-medium">Disease</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Plain Language Explanation */}
          <Card className="border border-border shadow-sm bg-card/95 backdrop-blur-sm mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-secondary" />
                How This Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">
                This graph illustrates how a genetic variant causes disease through biological pathways.
                The <strong>FBN1 gene</strong> mutation produces faulty <strong>fibrillin-1 protein</strong>,
                which disrupts <strong>extracellular matrix organization</strong>. This leads to multiple
                <strong> phenotypic manifestations</strong> (skeletal, ocular, cardiovascular) that together
                characterize <strong>Marfan Syndrome</strong>. The network shows how genetic changes propagate
                through biological systems to produce observable clinical features.
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <Button
              size="lg"
              className="flex-1 bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/20"
            >
              Recommend Next Clinical Action
            </Button>
            <Link href="/results" className="flex-1">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-secondary text-secondary hover:bg-secondary/10 bg-transparent"
              >
                Back to Results
              </Button>
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
