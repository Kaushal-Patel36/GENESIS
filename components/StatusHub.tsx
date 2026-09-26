'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Activity, Zap, Server, Network } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function StatusHub() {
    const [metrics, setMetrics] = useState({
        cpu: 24,
        entropy: 0.85,
        latency: 12,
        activeNodes: 842
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setMetrics(prev => ({
                cpu: Math.min(100, Math.max(10, prev.cpu + (Math.random() - 0.5) * 10)),
                entropy: Math.min(1.0, Math.max(0.5, prev.entropy + (Math.random() - 0.5) * 0.05)),
                latency: Math.min(50, Math.max(5, prev.latency + (Math.random() - 0.5) * 2)),
                activeNodes: prev.activeNodes + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0)
            }));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="hidden xl:flex items-center gap-4 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-md">

            {/* System Status Pulse */}
            <div className="flex items-center gap-2 border-r border-white/10 pr-4">
                <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <span className="text-[9px] font-mono text-emerald-400 tracking-wider">SYSTEM ONLINE</span>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-4">

                {/* Neural Load */}
                <div className="flex items-center gap-1.5" title="Neural Processing Load">
                    <Cpu className="w-3 h-3 text-violet-400" />
                    <span className="text-[9px] font-mono text-slate-400">LOAD</span>
                    <span className="text-[9px] font-mono text-violet-300 w-6 text-right">{metrics.cpu.toFixed(0)}%</span>
                </div>

                {/* Entropy Flux */}
                <div className="flex items-center gap-1.5" title="Shannon Entropy Flux">
                    <Activity className="w-3 h-3 text-cyan-400" />
                    <span className="text-[9px] font-mono text-slate-400">FLUX</span>
                    <span className="text-[9px] font-mono text-cyan-300 w-8 text-right">{metrics.entropy.toFixed(2)}</span>
                </div>

                {/* Network Latency */}
                <div className="flex items-center gap-1.5" title="Inference Latency">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span className="text-[9px] font-mono text-slate-400">LAT</span>
                    <span className="text-[9px] font-mono text-amber-300 w-6 text-right">{metrics.latency.toFixed(0)}ms</span>
                </div>

                {/* Active Graph Nodes */}
                <div className="flex items-center gap-1.5" title="Active Knowledge Graph Nodes">
                    <Network className="w-3 h-3 text-rose-400" />
                    <span className="text-[9px] font-mono text-slate-400">NODES</span>
                    <span className="text-[9px] font-mono text-rose-300 w-8 text-right">{metrics.activeNodes}</span>
                </div>

            </div>
        </div>
    );
}
