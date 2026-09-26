'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Maximize, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CohortNode {
    id: string;
    x: number;
    y: number;
    cluster: number;
    is_current: boolean;
}

export function CohortDeepZoom({ nodes, onClose }: { nodes: CohortNode[], onClose: () => void }) {
    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });

    const handleWheel = (e: React.WheelEvent) => {
        setScale(s => Math.min(4, Math.max(0.5, s - e.deltaY * 0.001)));
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center"
        >
            <div className="absolute top-6 right-6 z-50 flex gap-2">
                <div className="bg-black/40 backdrop-blur-md rounded-lg p-1 border border-white/10 flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.min(4, s + 0.2))} className="h-8 w-8 text-white"><ZoomIn className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="h-8 w-8 text-white"><ZoomOut className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }} className="h-8 w-8 text-white"><Maximize className="w-4 h-4" /></Button>
                </div>
                <Button variant="outline" size="icon" onClick={onClose} className="h-10 w-10 border-white/20 bg-black/40 text-white hover:text-white hover:bg-white/10">
                    <X className="w-5 h-5" />
                </Button>
            </div>

            <div className="absolute top-6 left-6 z-50">
                <Badge className="bg-violet-600/20 text-violet-300 border-violet-500/30 text-xs px-3 py-1.5 flex gap-2 items-center">
                    <Users className="w-3.5 h-3.5" />
                    DEEP COHORT EXPLORER
                </Badge>
            </div>

            <div
                className="w-full h-full cursor-move overflow-hidden relative"
                onWheel={handleWheel}
            >
                <div
                    className="absolute inset-0 flex items-center justify-center transition-transform duration-75"
                    style={{ transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)` }}
                >
                    {/* Simplified Large Graph Render */}
                    <svg viewBox="0 0 800 600" className="w-[80vw] h-[80vh] overflow-visible">
                        {/* Background Grid */}
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />

                        {/* Clusters Hulls (Simulated) */}
                        <circle cx="200" cy="200" r="150" fill="rgba(6,182,212,0.03)" stroke="rgba(6,182,212,0.1)" strokeDasharray="4 4" />
                        <text x="200" y="40" fill="rgba(6,182,212,0.5)" fontSize="10" textAnchor="middle">CLUSTER C0 (MILD)</text>

                        <circle cx="600" cy="400" r="180" fill="rgba(244,63,94,0.03)" stroke="rgba(244,63,94,0.1)" strokeDasharray="4 4" />
                        <text x="600" y="210" fill="rgba(244,63,94,0.5)" fontSize="10" textAnchor="middle">CLUSTER C1 (SEVERE)</text>

                        {/* Nodes */}
                        {nodes.map((node, i) => (
                            <motion.g key={node.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.005 }}>
                                <circle
                                    cx={node.x} cy={node.y}
                                    r={node.is_current ? 8 : (node.cluster === 1 ? 4 : 3)}
                                    fill={node.is_current ? "#06b6d4" : (node.cluster === 0 ? "#3b82f6" : node.cluster === 1 ? "#f43f5e" : "#10b981")}
                                    opacity={node.is_current ? 1 : 0.6}
                                    className="transition-all duration-300 hover:opacity-100 hover:r-6"
                                />
                                {node.is_current && (
                                    <>
                                        <circle cx={node.x} cy={node.y} r={12} fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.5">
                                            <animateTransform attributeName="transform" type="rotate" from={`0 ${node.x} ${node.y}`} to={`360 ${node.x} ${node.y}`} dur="3s" repeatCount="indefinite" />
                                        </circle>
                                        <text x={node.x} y={node.y - 15} fill="#06b6d4" fontSize="12" fontWeight="bold" textAnchor="middle">YOU</text>
                                    </>
                                )}
                            </motion.g>
                        ))}
                    </svg>
                </div>
            </div>

            {/* Minimap / Legend */}
            <Card className="absolute bottom-6 left-6 w-64 bg-black/60 border-white/10 p-4 backdrop-blur-md">
                <h4 className="text-xs font-bold text-white mb-2">Spectral Clusters</h4>
                <div className="space-y-2">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-cyan-500" /> <span className="text-[10px] text-slate-400">C0: Mild FBN1 Variants</span></div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500" /> <span className="text-[10px] text-slate-400">C1: Severe Aortic Risk</span></div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> <span className="text-[10px] text-slate-400">C2: Pharmacologically Responsive</span></div>
                </div>
            </Card>
        </motion.div>
    );
}
