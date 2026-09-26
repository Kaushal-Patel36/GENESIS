'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Users, Zap, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface Winner {
    year: number;
    team: string;
    project: string;
    description: string;
    category: string;
    prize: string;
    prize_amount: string;
    tech_stack: string[];
    impact: string;
    team_size: number;
    disease_focus: string;
    color: string;
}

interface HackRareWinnersProps {
    className?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
    'AI/ML': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    'Graph ML': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    'Deep Learning': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    'NLP/Speech': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    'Federated ML': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    'Computer Vision': 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    'Systems Biology': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    'Clinical NLP': 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    'Digital Twin': 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    'Knowledge Graph': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
};

const PRIZE_COLORS: Record<string, string> = {
    '🥇': 'text-yellow-400',
    '🥈': 'text-slate-300',
    '🥉': 'text-amber-600',
};

export const HackRareWinners: React.FC<HackRareWinnersProps> = ({ className }) => {
    const [winners, setWinners] = useState<Winner[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
    const [filter, setFilter] = useState<'all' | 'first'>('all');
    const [visibleCount, setVisibleCount] = useState(4);

    useEffect(() => {
        const fetchWinners = async () => {
            try {
                const res = await fetch(
                    `http://localhost:8000/avatar/hackrare-winners${filter === 'first' ? '?top_only=true' : ''}`
                );
                if (!res.ok) throw new Error('Network error');
                const data = await res.json();
                setWinners(data.winners || []);
            } catch {
                // Fallback static data for offline demo
                setWinners(FALLBACK_WINNERS);
            } finally {
                setLoading(false);
            }
        };
        setLoading(true);
        fetchWinners();
    }, [filter]);

    const displayWinners = winners.slice(0, visibleCount);

    return (
        <div className={`flex flex-col bg-black/40 border border-white/10 rounded-xl overflow-hidden ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-yellow-500/5 to-transparent">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-yellow-400 tracking-wide">HackRare Winners</h3>
                        <p className="text-[10px] text-white/40">2019 – 2024</p>
                    </div>
                </div>
                <div className="flex gap-1">
                    {(['all', 'first'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => { setFilter(f); setVisibleCount(4); }}
                            className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-wider transition-all ${filter === f
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    : 'text-white/30 hover:text-white/60 border border-transparent'
                                }`}
                        >
                            {f === 'all' ? 'All' : '🥇 Only'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Winner Cards */}
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/5">
                {loading ? (
                    <div className="p-4 space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        {displayWinners.map((winner, idx) => {
                            const isExpanded = expandedIdx === idx;
                            const catColor = CATEGORY_COLORS[winner.category] || 'text-white/60 bg-white/5 border-white/10';
                            const prizeEmoji = winner.prize.split(' ')[0];
                            const prizeColor = PRIZE_COLORS[prizeEmoji] || 'text-white/60';

                            return (
                                <div
                                    key={idx}
                                    className="group cursor-pointer hover:bg-white/3 transition-colors"
                                    onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                                    style={{ animationDelay: `${idx * 80}ms` }}
                                >
                                    <div className="px-4 py-3">
                                        {/* Top row */}
                                        <div className="flex items-start justify-between gap-2 mb-1.5">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className={`text-sm font-bold ${prizeColor}`}>{winner.prize.split(' ')[0]}</span>
                                                    <span className="text-[10px] font-mono text-white/30">{winner.year}</span>
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono uppercase tracking-wider ${catColor}`}>
                                                        {winner.category}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-semibold text-white/90 leading-tight truncate">{winner.project}</p>
                                                <p className="text-[10px] text-white/40 mt-0.5">
                                                    <span className="text-white/60 font-medium">{winner.team}</span>
                                                    {' · '}
                                                    <Users className="w-2.5 h-2.5 inline" /> {winner.team_size}
                                                    {' · '}
                                                    <span className="text-yellow-400/70">{winner.prize_amount}</span>
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-white/20 group-hover:text-white/50 mt-1">
                                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                            </div>
                                        </div>

                                        {/* Expanded details */}
                                        {isExpanded && (
                                            <div className="mt-2 space-y-2 text-[11px] border-t border-white/5 pt-2">
                                                <p className="text-white/60 leading-relaxed">{winner.description}</p>
                                                <div className="flex items-start gap-1.5">
                                                    <Zap className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                                                    <span className="text-emerald-400/80">{winner.impact}</span>
                                                </div>
                                                <div>
                                                    <p className="text-white/30 mb-1">Disease Focus: <span className="text-white/60">{winner.disease_focus}</span></p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {winner.tech_stack.map((tech, ti) => (
                                                            <span
                                                                key={ti}
                                                                className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400/80 rounded font-mono"
                                                            >
                                                                {tech}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {visibleCount < winners.length && (
                            <button
                                onClick={() => setVisibleCount(v => v + 4)}
                                className="w-full py-2 text-[10px] text-white/30 hover:text-white/60 font-mono uppercase tracking-widest transition-colors"
                            >
                                + {winners.length - visibleCount} more
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// Fallback static data for offline/demo mode
const FALLBACK_WINNERS: Winner[] = [
    {
        year: 2024, team: "PhenoForge", project: "Real-Time Phenotype-to-Variant AI Mapper",
        description: "GPT-4 + HPO ontology instant mapping with explainable AI overlays.",
        category: "AI/ML", prize: "🥇 1st Place", prize_amount: "$15,000",
        tech_stack: ["Python", "GPT-4", "React", "HPO"], impact: "Reduced diagnosis time by 68%.",
        team_size: 4, disease_focus: "Lysosomal Storage Disorders", color: "emerald",
    },
    {
        year: 2023, team: "GenoBridge", project: "Multi-Omic Rare Disease Variant Interpreter",
        description: "Transformer model integrating WES, RNA-seq, and proteomics.",
        category: "Deep Learning", prize: "🥇 1st Place", prize_amount: "$12,000",
        tech_stack: ["PyTorch", "Hugging Face", "React"], impact: "Used by 3 hospitals in pilot.",
        team_size: 5, disease_focus: "Connective Tissue Disorders", color: "emerald",
    },
    {
        year: 2022, team: "DysmorPhAI", project: "Facial Dysmorphology Detection via CV",
        description: "CNN detecting dysmorphic features across 38 rare conditions.",
        category: "Computer Vision", prize: "🥈 2nd Place", prize_amount: "$7,000",
        tech_stack: ["TensorFlow", "ResNet-50", "OpenCV"], impact: "91% sensitivity on test sets.",
        team_size: 3, disease_focus: "Syndromic Conditions", color: "blue",
    },
    {
        year: 2021, team: "PathwayPilot", project: "Rare Disease Pathway Disruption Simulator",
        description: "Network diffusion showing variant cascade through KEGG/Reactome.",
        category: "Systems Biology", prize: "🥇 1st Place", prize_amount: "$10,000",
        tech_stack: ["Python", "NetworkX", "D3.js"], impact: "Featured in Nature Reviews Genetics.",
        team_size: 3, disease_focus: "Mitochondrial Diseases", color: "emerald",
    },
];
