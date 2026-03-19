'use client';

interface TimerRingProps {
  time: number;
  maxTime: number;
  size?: number;
}

export default function TimerRing({ time, maxTime, size = 48 }: TimerRingProps) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = maxTime > 0 ? time / maxTime : 0;
  const offset = circumference * (1 - progress);
  const isLow = time <= 5;
  const strokeColor = isLow ? '#ef4444' : time <= 10 ? '#f59e0b' : '#d4a340';

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth="3" />
        {/* Progress arc */}
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={strokeColor} strokeWidth="3"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }} />
      </svg>
      {/* Number */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-mono font-black text-base ${isLow ? 'text-red-500' : 'text-gray-900'}`}>
          {time}
        </span>
      </div>
    </div>
  );
}
