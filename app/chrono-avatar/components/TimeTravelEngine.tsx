import React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface TimeTravelEngineProps {
    year: number;
    setYear: (year: number) => void;
}

export const TimeTravelEngine: React.FC<TimeTravelEngineProps> = ({ year, setYear }) => {
    // Milestones could be dynamic based on patient data
    const milestones = [
        { year: 2005, label: 'Birth', type: 'major' },
        { year: 2009, label: 'Onset', type: 'critical' },
        { year: 2012, label: 'Diagnosis', type: 'minor' },
        { year: 2025, label: 'Present', type: 'current' },
        { year: 2030, label: 'Predicted', type: 'future' },
    ];

    const getPosition = (y: number) => {
        const start = 2000;
        const end = 2035;
        return ((y - start) / (end - start)) * 100;
    };

    return (
        <div className="relative h-full flex flex-col justify-end">
            <div className="absolute top-0 left-0 text-xs font-mono text-emerald-500 flex items-center gap-2">
                <Clock className="w-3 h-3" />
                TEMPORAL RECONSTRUCTION ENGINE
            </div>

            <div className="relative w-full h-12 mb-2">
                {/* Milestone Markers */}
                {milestones.map((m) => (
                    <div
                        key={m.year}
                        className="absolute top-0 -translate-x-1/2 flex flex-col items-center group cursor-pointer"
                        style={{ left: `${getPosition(m.year)}%` }}
                        onClick={() => setYear(m.year)}
                    >
                        <div className={cn(
                            "w-px h-4 mb-2 transition-all duration-300",
                            m.year === year ? "bg-emerald-400 h-6" : "bg-white/20 group-hover:bg-white/40"
                        )} />
                        <div className={cn(
                            "text-[10px] uppercase tracking-wider transition-colors",
                            m.year === year ? "text-emerald-400 font-bold" : "text-white/40 group-hover:text-white/70",
                            m.type === 'future' && "text-blue-400"
                        )}>
                            {m.label} ({m.year})
                        </div>
                    </div>
                ))}
            </div>

            <SliderPrimitive.Root
                className="relative flex items-center select-none touch-none w-full h-5"
                value={[year]}
                max={2035}
                min={2000}
                step={1}
                onValueChange={(val) => setYear(val[0])}
            >
                <SliderPrimitive.Track className="bg-white/10 relative grow rounded-full h-[2px]">
                    <SliderPrimitive.Range className="absolute bg-gradient-to-r from-emerald-600 to-blue-500 rounded-full h-full" />
                </SliderPrimitive.Track>
                <SliderPrimitive.Thumb
                    className="block w-5 h-5 bg-black border-2 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] rounded-full hover:scale-110 focus:outline-none transition-transform"
                    aria-label="Year"
                />
            </SliderPrimitive.Root>
        </div>
    );
};
