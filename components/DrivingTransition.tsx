'use client';

import { useState, useEffect } from 'react';

interface DrivingTransitionProps {
  fromCity: string;
  toCity: string;
  route: string;
  miles: number;
  avgSpeed: number;
  region: string;
  onComplete: () => void;
}

export default function DrivingTransition({ fromCity, toCity, route, miles, avgSpeed, region, onComplete }: DrivingTransitionProps) {
  const [progress, setProgress] = useState(0);
  const [milesShown, setMilesShown] = useState(0);

  useEffect(() => {
    const duration = 2500;
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(elapsed / duration, 1);
      const eased = pct < 0.5 ? 2 * pct * pct : 1 - Math.pow(-2 * pct + 2, 2) / 2;
      setProgress(eased);
      setMilesShown(Math.round(eased * miles));
      if (pct >= 1) {
        clearInterval(interval);
        setTimeout(onComplete, 300);
      }
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const dashCount = 14;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center overflow-hidden" style={{
      background: 'linear-gradient(180deg, #1a1a3e 0%, #2d1f4d 25%, #4a3060 45%, #d4855a 75%, #f5c478 100%)'
    }}>
      {/* Stars */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white" style={{
            width: Math.random() * 2 + 1,
            height: Math.random() * 2 + 1,
            left: `${(i * 37 + 13) % 100}%`,
            top: `${(i * 23 + 7) % 35}%`,
            opacity: 0.3 + (i % 3) * 0.2,
          }} />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Route label */}
        <div className="text-center mb-6">
          <div className="text-amber-400/70 font-mono text-[8px] tracking-[5px]">{region.toUpperCase()}</div>
          <div className="text-white/90 text-sm font-semibold mt-1">{route}</div>
        </div>

        {/* Road animation */}
        <div className="relative h-52 mb-6 overflow-hidden">
          {/* Landscape silhouette */}
          <svg className="absolute bottom-0 w-full" height="60" viewBox="0 0 400 60" preserveAspectRatio="none">
            <path d="M0,60 L0,40 Q50,20 100,35 Q150,50 200,30 Q250,10 300,25 Q350,40 400,20 L400,60 Z" fill="#1a1a2e" opacity="0.4" />
          </svg>

          {/* Road */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-16 h-full" style={{
            background: 'linear-gradient(0deg, #444 0%, #333 50%, #2a2a2a 100%)',
          }}>
            {/* Shoulder lines */}
            <div className="absolute left-0 top-0 w-0.5 h-full bg-white/20" />
            <div className="absolute right-0 top-0 w-0.5 h-full bg-white/20" />

            {/* Moving center dashes */}
            {Array.from({ length: dashCount }).map((_, i) => {
              const baseY = i / dashCount;
              const animY = (baseY + progress * 4) % 1.3 - 0.15;
              return (
                <div key={i} className="absolute left-1/2 -translate-x-1/2" style={{
                  width: 2,
                  height: 14,
                  backgroundColor: '#f5d778',
                  top: `${animY * 100}%`,
                  opacity: animY > 0 && animY < 1 ? 0.7 : 0,
                }} />
              );
            })}
          </div>

          {/* Car */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2" style={{
            transform: `translateX(-50%) translateY(${Math.sin(progress * 20) * 1.5}px)`,
          }}>
            <svg width="20" height="32" viewBox="0 0 20 32">
              <rect x="3" y="6" width="14" height="22" rx="4" fill="#d4a340" />
              <rect x="5" y="8" width="10" height="7" rx="2" fill="#1a1a2e" opacity="0.8" />
              <circle cx="5" cy="26" r="2" fill="#333" />
              <circle cx="15" cy="26" r="2" fill="#333" />
              <rect x="2" y="22" width="3" height="2" rx="0.5" fill="#f5d778" opacity="0.9" />
              <rect x="15" y="22" width="3" height="2" rx="0.5" fill="#f5d778" opacity="0.9" />
              <rect x="7" y="27" width="2.5" height="1.5" rx="0.5" fill="#ef4444" opacity="0.6" />
              <rect x="10.5" y="27" width="2.5" height="1.5" rx="0.5" fill="#ef4444" opacity="0.6" />
            </svg>
          </div>
        </div>

        {/* City names and progress */}
        <div className="text-center">
          <div className="flex justify-between items-end mb-2 px-1">
            <div className="text-left">
              <div className="text-gray-500 text-[8px] font-mono">FROM</div>
              <div className="text-white/60 text-xs">{fromCity}</div>
            </div>
            <div className="text-right">
              <div className="text-amber-400 text-[8px] font-mono">TO</div>
              <div className="text-white text-xs font-bold">{toCity}</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-700/50 rounded-full h-2 mb-4">
            <div className="bg-gradient-to-r from-amber-500 to-amber-400 rounded-full h-2" style={{ width: `${progress * 100}%`, transition: 'none' }} />
          </div>

          {/* Miles counter */}
          <div className="text-amber-400 text-3xl font-black font-mono">{milesShown}</div>
          <div className="text-gray-400 text-[10px] font-mono mt-0.5">miles at {avgSpeed} mph</div>
        </div>
      </div>
    </div>
  );
}
