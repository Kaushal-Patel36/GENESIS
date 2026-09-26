import React from 'react';
import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface HPOTermPreview {
    hpo_id: string;
    label: string;
    confidence: number;
    source: string;
}

interface BiometricInputProps {
    type: 'face' | 'voice';
    title: string;
    icon: LucideIcon;
    description: string;
    active: boolean;
    children: React.ReactNode;
    hpoTerms?: HPOTermPreview[];
    statusText?: string;
}

export const BiometricInput: React.FC<BiometricInputProps> = ({
    type,
    title,
    icon: Icon,
    description,
    active,
    children,
    hpoTerms = [],
    statusText,
}) => {
    const confirmedCount = hpoTerms.filter(t => true).length;

    return (
        <Card className={`relative overflow-hidden border-white/10 bg-black/40 transition-all duration-500 ${active ? 'border-emerald-500/50 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]' : ''}`}>
            <div className="p-3">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/60'}`}>
                            <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                            <h3 className={`text-xs font-semibold transition-colors ${active ? 'text-emerald-400' : 'text-white/80'}`}>{title}</h3>
                            <p className="text-[9px] text-white/40">{statusText || description}</p>
                        </div>
                    </div>
                    {active && (
                        <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="text-[9px] font-mono text-emerald-500 tracking-wider">LIVE</span>
                        </div>
                    )}
                </div>

                {/* Webcam / Voice Visualization */}
                <div className="relative rounded-lg overflow-hidden bg-black/50 aspect-video border border-white/5">
                    {children}

                    {/* Scan Overlay Lines */}
                    {active && (
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-0 border border-emerald-500/20 rounded-lg" />
                            <div className="absolute top-2 right-2 flex flex-col gap-0.5">
                                <div className="w-12 h-px bg-emerald-500/30" />
                                <div className="w-8 h-px bg-emerald-500/20" />
                            </div>
                        </div>
                    )}
                </div>

                {/* HPO Micro-pills (only when terms extracted) */}
                {confirmedCount > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {hpoTerms.slice(0, 3).map((t, i) => (
                            <span
                                key={i}
                                className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${type === 'face'
                                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                    }`}
                                title={t.hpo_id}
                            >
                                {t.label.length > 18 ? t.label.slice(0, 17) + '…' : t.label}
                            </span>
                        ))}
                        {confirmedCount > 3 && (
                            <span className="text-[9px] text-white/30 px-1">+{confirmedCount - 3}</span>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};
