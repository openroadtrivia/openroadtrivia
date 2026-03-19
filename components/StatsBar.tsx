'use client';

interface StatsBarProps {
  points: number;
  miles: number;
  accuracy: number;
  streak: number;
}

export default function StatsBar({ points, miles, accuracy, streak }: StatsBarProps) {
  const stats = [
    { l: 'POINTS', v: points.toLocaleString(), c: points >= 0 ? 'text-green-600' : 'text-red-500' },
    { l: 'MILES', v: `${miles}`, c: 'text-gray-900' },
    { l: 'ACCURACY', v: `${accuracy}%`, c: 'text-gray-900' },
    { l: 'STREAK', v: `${streak}`, c: streak >= 5 ? 'text-amber-500' : 'text-gray-900' },
  ];

  return (
    <div className="grid grid-cols-4 gap-1.5 px-3 py-1.5">
      {stats.map((s, i) => (
        <div key={i} className="bg-white rounded-md p-1.5 border border-gray-200 text-center">
          <div className="text-gray-500 font-mono text-[7px] tracking-wider">{s.l}</div>
          <div className={`${s.c} text-sm font-bold`}>{s.v}</div>
        </div>
      ))}
    </div>
  );
}
