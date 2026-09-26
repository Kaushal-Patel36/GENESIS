'use client';

import React, { useEffect, useState } from 'react';

interface ConfidenceGaugeProps {
    score: number;
    maxScore: number;
    confidence: string;
    label?: string;
}

export function ConfidenceGauge({ score, maxScore, confidence, label = 'Composite Score' }: ConfidenceGaugeProps) {
    const [animVal, setAnimVal] = useState(0);

    const percentage = Math.min((score / maxScore) * 100, 100);

    useEffect(() => {
        let frame: number;
        let start: number | null = null;
        const duration = 1800;
        const animate = (ts: number) => {
            if (!start) start = ts;
            const elapsed = ts - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            setAnimVal(eased * percentage);
            if (progress < 1) frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [percentage]);

    const size = 200;
    const strokeWidth = 14;
    const cx = size / 2;
    const cy = size / 2;
    const r = (size - strokeWidth * 2) / 2;

    // Arc from -210° to +30° (240° sweep)
    const startAngle = -210;
    const totalSweep = 240;
    const currentSweep = (animVal / 100) * totalSweep;

    const polarToCartesian = (angle: number) => {
        const rad = (angle * Math.PI) / 180;
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    };

    const describeArc = (startA: number, endA: number) => {
        const start = polarToCartesian(endA);
        const end = polarToCartesian(startA);
        const largeArc = endA - startA > 180 ? 1 : 0;
        return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
    };

    // Color based on percentage
    const getColor = (pct: number) => {
        if (pct >= 75) return { main: '#22d3ee', glow: '#22d3ee' };
        if (pct >= 50) return { main: '#34d399', glow: '#34d399' };
        if (pct >= 25) return { main: '#fbbf24', glow: '#fbbf24' };
        return { main: '#f87171', glow: '#f87171' };
    };

    const color = getColor(animVal);

    // Needle tip position
    const needleAngle = startAngle + currentSweep;
    const needleTip = polarToCartesian(needleAngle);

    // Tick marks
    const ticks = [0, 25, 50, 75, 100];

    const confidenceMap: Record<string, { text: string; color: string }> = {
        High: { text: 'HIGH CONFIDENCE', color: '#34d399' },
        Medium: { text: 'MEDIUM CONFIDENCE', color: '#fbbf24' },
        Low: { text: 'LOW CONFIDENCE', color: '#94a3b8' },
    };

    const conf = confidenceMap[confidence] || confidenceMap.Medium;

    return (
        <div className="flex flex-col items-center">
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[220px]">
                <defs>
                    <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#f87171" />
                        <stop offset="33%" stopColor="#fbbf24" />
                        <stop offset="66%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                    <filter id="gaugeGlow">
                        <feGaussianBlur stdDeviation="5" result="blur">
                            <animate attributeName="stdDeviation" values="3;6;3" dur="3s" repeatCount="indefinite" />
                        </feGaussianBlur>
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="needleGlow">
                        <feGaussianBlur stdDeviation="4" result="blur">
                            <animate attributeName="stdDeviation" values="2;5;2" dur="2s" repeatCount="indefinite" />
                        </feGaussianBlur>
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Background arc */}
                <path
                    d={describeArc(startAngle, startAngle + totalSweep)}
                    fill="none"
                    stroke="rgba(148,163,184,0.1)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />

                {/* Colored arc */}
                {currentSweep > 0.5 && (
                    <path
                        d={describeArc(startAngle, startAngle + currentSweep)}
                        fill="none"
                        stroke="url(#gaugeGrad)"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        filter="url(#gaugeGlow)"
                    />
                )}

                {/* Tick marks */}
                {ticks.map((t, i) => {
                    const tickAngle = startAngle + (t / 100) * totalSweep;
                    const inner = polarToCartesian(tickAngle);
                    const outer = (() => {
                        const rad = (tickAngle * Math.PI) / 180;
                        return {
                            x: cx + (r + 12) * Math.cos(rad),
                            y: cy + (r + 12) * Math.sin(rad),
                        };
                    })();
                    return (
                        <g key={i}>
                            <line
                                x1={inner.x} y1={inner.y}
                                x2={cx + (r - 8) * Math.cos((tickAngle * Math.PI) / 180)}
                                y2={cy + (r - 8) * Math.sin((tickAngle * Math.PI) / 180)}
                                stroke="rgba(148,163,184,0.3)"
                                strokeWidth="1"
                            />
                            <text
                                x={outer.x} y={outer.y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-[8px] font-mono"
                                fill="rgba(148,163,184,0.4)"
                            >
                                {t}
                            </text>
                        </g>
                    );
                })}

                {/* Needle dot */}
                <circle
                    cx={needleTip.x} cy={needleTip.y} r="6"
                    fill={color.main}
                    filter="url(#needleGlow)"
                />
                <circle cx={needleTip.x} cy={needleTip.y} r="2.5" fill="white" />

                {/* Center score */}
                <text x={cx} y={cy - 8} textAnchor="middle" className="text-[28px] font-bold" fill={color.main}>
                    {score.toFixed(1)}
                </text>
                <text x={cx} y={cy + 10} textAnchor="middle" className="text-[9px] font-medium" fill="rgba(148,163,184,0.6)">
                    {label}
                </text>

                {/* Confidence text */}
                <text x={cx} y={cy + 30} textAnchor="middle" className="text-[8px] font-bold tracking-widest" fill={conf.color}>
                    {conf.text}
                </text>
            </svg>
        </div>
    );
}
