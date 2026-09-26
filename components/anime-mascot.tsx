'use client';

import { useEffect, useState } from 'react';

interface MascotProps {
  emotion?: 'happy' | 'thinking' | 'excited' | 'warning' | 'success';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

function AnimeMascot({ emotion = 'happy', size = 'md', animated = true }: MascotProps) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (!animated) return;
    const interval = setInterval(() => {
      setBlink((prev) => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, [animated]);

  const sizeMap = {
    sm: { width: 100, height: 120 },
    md: { width: 150, height: 180 },
    lg: { width: 200, height: 240 },
  };

  const dims = sizeMap[size];

  const emotionStyles = {
    happy: {
      eyeOffset: 0,
      mouthHeight: 20,
      mouthD: 'M 30 20 Q 35 25 40 20',
      color: 'from-pink-300 to-purple-300',
    },
    thinking: {
      eyeOffset: -3,
      mouthHeight: 10,
      mouthD: 'M 30 20 L 40 20',
      color: 'from-cyan-300 to-blue-300',
    },
    excited: {
      eyeOffset: -5,
      mouthHeight: 25,
      mouthD: 'M 25 18 Q 35 28 45 18',
      color: 'from-yellow-300 to-orange-300',
    },
    warning: {
      eyeOffset: 2,
      mouthHeight: 5,
      mouthD: 'M 30 20 L 40 20',
      color: 'from-red-300 to-amber-300',
    },
    success: {
      eyeOffset: -2,
      mouthHeight: 22,
      mouthD: 'M 25 20 Q 35 27 45 20',
      color: 'from-green-300 to-emerald-300',
    },
  };

  const style = emotionStyles[emotion];

  return (
    <div className={`flex items-center justify-center animate-${animated ? 'float-bounce' : ''}`}>
      <svg width={dims.width} height={dims.height} viewBox="0 0 100 120" className="drop-shadow-lg">
        {/* Head */}
        <defs>
          <radialGradient id="head-gradient" cx="35%" cy="35%">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="100%" stopColor="#fb7185" />
          </radialGradient>
        </defs>

        {/* Head Circle */}
        <circle cx="50" cy="50" r="35" fill="url(#head-gradient)" />

        {/* Hair */}
        <path
          d="M 15 50 Q 15 25 50 15 Q 85 25 85 50"
          fill="#a78bfa"
          className="drop-shadow-md"
        />

        {/* Left Eye White */}
        <ellipse
          cx={35 + style.eyeOffset}
          cy="45"
          rx="8"
          ry="12"
          fill="white"
          className={blink && animated ? 'opacity-0' : 'transition-opacity duration-100'}
        />

        {/* Right Eye White */}
        <ellipse
          cx={65 + style.eyeOffset}
          cy="45"
          rx="8"
          ry="12"
          fill="white"
          className={blink && animated ? 'opacity-0' : 'transition-opacity duration-100'}
        />

        {/* Left Iris */}
        <circle cx={37 + style.eyeOffset} cy="47" r="5" fill="#6366f1" />

        {/* Right Iris */}
        <circle cx={63 + style.eyeOffset} cy="47" r="5" fill="#6366f1" />

        {/* Left Pupil */}
        <circle cx={37 + style.eyeOffset} cy="47" r="3" fill="black" />

        {/* Right Pupil */}
        <circle cx={63 + style.eyeOffset} cy="47" r="3" fill="black" />

        {/* Left Shine */}
        <circle cx={36 + style.eyeOffset} cy="45" r="2" fill="white" />

        {/* Right Shine */}
        <circle cx={62 + style.eyeOffset} cy="45" r="2" fill="white" />

        {/* Mouth */}
        <path d={style.mouthD} stroke="#8b5cf6" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Rosy Cheeks */}
        <ellipse cx="20" cy="60" rx="6" ry="5" fill="#fb7185" opacity="0.4" />
        <ellipse cx="80" cy="60" rx="6" ry="5" fill="#fb7185" opacity="0.4" />
      </svg>
    </div>
  );
}

export default AnimeMascot;
