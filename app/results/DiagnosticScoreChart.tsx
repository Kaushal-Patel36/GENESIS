'use client';

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartProps {
    data: any[];
}

export function DiagnosticScoreChart({ data }: ChartProps) {
    // Transform data for the chart
    // We want to stack: Phenotype Score, Variant Score, Pathway/Other
    const chartData = data.map((d) => {
        const evidence = d.evidence || [];

        let phenotypeScore = 0;
        let variantScore = 0;
        let otherScore = 0;

        evidence.forEach((e: any) => {
            const src = e.source.toLowerCase();
            if (src.includes('hpo') || src.includes('omim')) {
                phenotypeScore += e.score_contribution;
            } else if (src.includes('clinvar') || src.includes('variant')) {
                variantScore += e.score_contribution;
            } else {
                otherScore += e.score_contribution;
            }
        });

        // If pure scores aren't available in evidence, fallback or normalize
        // For this chart we use the raw contributions
        return {
            name: d.gene.symbol, // X-axis
            'Phenotype Match': parseFloat(phenotypeScore.toFixed(2)),
            'Variant Impact': parseFloat(variantScore.toFixed(2)),
            'Pathway Evidence': parseFloat(otherScore.toFixed(2)),
            total: d.score
        };
    }).slice(0, 5); // Top 5 only

    return (
        <Card className="border-border">
            <CardHeader>
                <CardTitle>Diagnostic Score Breakdown</CardTitle>
                <CardDescription>
                    Relative contribution of clinical and genomic evidence to final ranking
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#333" opacity={0.2} />
                            <XAxis type="number" hide />
                            <YAxis
                                type="category"
                                dataKey="name"
                                tick={{ fill: 'currentColor', fontSize: 12, fontWeight: 600 }}
                                width={60}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                                itemStyle={{ fontSize: '12px' }}
                            />
                            <Legend
                                verticalAlign="top"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{ fontSize: '12px' }}
                            />
                            <Bar dataKey="Phenotype Match" stackId="a" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={32} />
                            <Bar dataKey="Variant Impact" stackId="a" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="Pathway Evidence" stackId="a" fill="#ec4899" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
