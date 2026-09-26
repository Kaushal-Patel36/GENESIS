import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface GenomicAvatarProps {
    year: number;
    isScanning: boolean;
    topDisease?: string;
    epigeneticAge?: { estimated_age: number; acceleration: number } | null;
}

export const GenomicAvatar: React.FC<GenomicAvatarProps> = ({ year, isScanning, topDisease, epigeneticAge }) => {
    // We use a simple SVG visualization instead of full 3D for robustness in this demo
    // But animate it based on the "year"

    const isFuture = year > 2025;
    const isPast = year < 2010;

    return (
        <div className="relative flex-1 bg-gradient-to-b from-black/60 to-emerald-900/10 border border-white/10 rounded-xl overflow-hidden flex items-center justify-center p-8">

            {/* Background Grid */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.1) 0%, transparent 70%)'
                }}
            />

            {/* Data Layers */}
            <div className="relative z-10 w-full max-w-sm aspect-[1/2]">
                {/* Simple Silhouette */}
                <svg viewBox="0 0 200 400" className="w-full h-full drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <defs>
                        <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={isFuture ? "#3b82f6" : "#10b981"} stopOpacity="0.8" />
                            <stop offset="100%" stopColor={isFuture ? "#1d4ed8" : "#047857"} stopOpacity="0.2" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Body Outline */}
                    <path
                        d="M100,50 C120,50 135,65 135,85 C135,100 125,110 115,115 L140,140 L130,250 L140,380 L110,380 L105,260 L95,260 L90,380 L60,380 L70,250 L60,140 L85,115 C75,110 65,100 65,85 C65,65 80,50 100,50 Z"
                        fill="url(#bodyGrad)"
                        stroke={isFuture ? "#60a5fa" : "#34d399"}
                        strokeWidth="0.5"
                        className="transition-all duration-1000"
                    />

                    {/* Internal Organs / Systems Highlight */}
                    {/* Cardiac / Chest marker */}
                    <circle cx="100" cy="130" r={isPast ? "4" : "7"} fill="#3b82f6" opacity="0.5">
                        <animate attributeName="opacity" values="0.5;0.8;0.5" dur="1.2s" repeatCount="indefinite" />
                        <animate attributeName="r" values={isPast ? "4;5;4" : "7;8;7"} dur="1.2s" repeatCount="indefinite" />
                    </circle>

                    {/* Brain */}
                    <path d="M90,65 Q100,55 110,65 T100,80 T90,65" fill="none" stroke="white" strokeWidth="0.5" opacity="0.5" />

                    {/* Scanning Effect */}
                    {isScanning && (
                        <line x1="0" y1="0" x2="200" y2="0" stroke="white" strokeWidth="2" opacity="0.5">
                            <animate attributeName="y1" values="0;400;0" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="y2" values="0;400;0" dur="2s" repeatCount="indefinite" />
                        </line>
                    )}
                </svg>

                {/* Floating Labels */}
                <div className="absolute top-20 -right-10 flex flex-col gap-2">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-black/80 border border-white/10 px-3 py-1 rounded text-[10px] text-white/80 backdrop-blur-sm"
                    >
                        {topDisease ? (
                            <>Top Dx: <span className="text-emerald-400">{topDisease.length > 18 ? topDisease.slice(0, 17) + '…' : topDisease}</span></>
                        ) : (
                            <>Cranial Structure: <span className="text-emerald-400">Normal</span></>
                        )}
                    </motion.div>
                    {epigeneticAge && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-black/80 border border-blue-500/20 px-3 py-1 rounded text-[10px] text-white/80 backdrop-blur-sm"
                        >
                            Bio-Age: <span className="text-blue-300">{epigeneticAge.estimated_age.toFixed(1)}y</span>
                            <span className="text-white/30 ml-1">(+{epigeneticAge.acceleration.toFixed(1)})</span>
                        </motion.div>
                    )}
                    {!epigeneticAge && year > 2020 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-black/80 border border-yellow-500/20 px-3 py-1 rounded text-[10px] text-white/80 backdrop-blur-sm absolute top-[32.5%]"
                        >
                            <div className="flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-yellow-400 animate-pulse" />
                                <span>Aortic Root: <span className="text-yellow-400">Dilating</span></span>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Decorative overlaid info */}
            <div className="absolute bottom-4 left-4 text-[10px] text-white/30 font-mono">
                RENDER_MODE: VOLUMETRIC<br />
                SCALE: 1:1<br />
                YEAR: {year}
            </div>
        </div>
    );
};
