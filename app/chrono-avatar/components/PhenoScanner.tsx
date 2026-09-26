'use client';

import React, { useRef } from 'react';
import Webcam from 'react-webcam';
import { ScanFace } from 'lucide-react';

interface DysmorphyFeature {
    name: string;
    key: string;
    confidence: number;
    severity: string;
}

interface PhenoScannerProps {
    isScanning: boolean;
    webcamRef?: React.RefObject<any>;
    dysmorphyFeatures?: DysmorphyFeature[];
}

// Corner bracket SVG for scan framing
const ScanCorner: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M0 10 L0 0 L10 0" />
    </svg>
);

export const PhenoScanner: React.FC<PhenoScannerProps> = ({
    isScanning,
    webcamRef,
    dysmorphyFeatures = [],
}) => {
    const internalRef = useRef<any>(null);
    const ref = webcamRef || internalRef;

    const confidenceColor = (c: number) => {
        if (c >= 0.85) return 'text-red-400 border-red-500/40 bg-red-500/10';
        if (c >= 0.70) return 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10';
        return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    };

    return (
        <div className="relative w-full h-full flex items-center justify-center group">
            {/* Live webcam feed */}
            <Webcam
                ref={ref}
                audio={false}
                mirrored={true}
                screenshotFormat="image/jpeg"
                screenshotQuality={0.8}
                className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-500"
            />

            {/* Grid overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                    <pattern id="phenoGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(16,185,129,0.3)" strokeWidth="0.5" />
                    </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#phenoGrid)" />
            </svg>

            {/* Scan corner brackets */}
            <div className="absolute inset-3 pointer-events-none">
                <ScanCorner className="absolute top-0 left-0 w-6 h-6 text-emerald-400/60" />
                <ScanCorner className="absolute top-0 right-0 w-6 h-6 text-emerald-400/60 rotate-90" />
                <ScanCorner className="absolute bottom-0 left-0 w-6 h-6 text-emerald-400/60 -rotate-90" />
                <ScanCorner className="absolute bottom-0 right-0 w-6 h-6 text-emerald-400/60 rotate-180" />
            </div>

            {/* Standby state */}
            {!isScanning && dysmorphyFeatures.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
                    <div className="text-center">
                        <ScanFace className="w-8 h-8 text-white/20 mx-auto mb-2" />
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">Camera Standby</p>
                        <p className="text-[9px] text-white/20 mt-1">Click CAPTURE BIOMETRICS</p>
                    </div>
                </div>
            )}

            {/* Active scanning overlay */}
            {isScanning && (
                <div className="absolute inset-0 pointer-events-none">
                    {/* Horizontal scan line */}
                    <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-scan-vertical" />
                    {/* Pulsing ring */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-28 h-36 border border-emerald-500/40 rounded-full animate-ping opacity-20" />
                        <div className="absolute w-20 h-28 border border-emerald-500/30 rounded-full animate-pulse" />
                    </div>
                    {/* Corner highlights */}
                    <div className="absolute inset-3 border-2 border-emerald-500/20 rounded" />
                </div>
            )}

            {/* Real dysmorphology feature labels */}
            {dysmorphyFeatures.length > 0 && !isScanning && (
                <div className="absolute inset-0 pointer-events-none">
                    {dysmorphyFeatures.slice(0, 4).map((feat, idx) => {
                        const positions = [
                            'top-3 right-3',
                            'top-3 left-3',
                            'bottom-12 right-3',
                            'bottom-12 left-3',
                        ];
                        return (
                            <div
                                key={idx}
                                className={`absolute ${positions[idx]} flex flex-col items-${idx % 2 === 0 ? 'end' : 'start'}`}
                                style={{ animation: `fadeIn 0.4s ease-out ${idx * 150}ms both` }}
                            >
                                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono whitespace-nowrap ${confidenceColor(feat.confidence)}`}>
                                    {feat.name}
                                </span>
                                <span className="text-[8px] text-white/40 mt-0.5 px-1">
                                    {(feat.confidence * 100).toFixed(0)}% · {feat.severity}
                                </span>
                            </div>
                        );
                    })}
                    {/* Landmark dot simulation */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        {Array.from({ length: 18 }).map((_, i) => {
                            const angle = (i / 18) * Math.PI * 2;
                            const rx = 28 + (i % 3) * 8;
                            const ry = 36 + (i % 4) * 6;
                            const x = 50 + rx * Math.cos(angle);
                            const y = 44 + ry * Math.sin(angle);
                            return (
                                <div
                                    key={i}
                                    className="absolute w-0.5 h-0.5 rounded-full bg-emerald-400/70"
                                    style={{ left: `${x}%`, top: `${y}%` }}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
