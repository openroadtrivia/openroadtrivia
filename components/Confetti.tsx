'use client';
import { useEffect, useState } from 'react';

const COLORS = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316'];
const SHAPES = ['square', 'circle', 'triangle'];

interface Piece {
  id: number;
  left: number;
  color: string;
  shape: string;
  delay: number;
  size: number;
  duration: number;
}

export default function Confetti({ count = 40 }: { count?: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    const p: Piece[] = [];
    for (let i = 0; i < count; i++) {
      p.push({
        id: i,
        left: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        delay: Math.random() * 0.8,
        size: Math.random() * 8 + 6,
        duration: Math.random() * 1.5 + 1.5,
      });
    }
    setPieces(p);
  }, [count]);

  return (
    <div className="confetti-container">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'triangle' ? '0' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            clipPath: p.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none',
          }}
        />
      ))}
    </div>
  );
}
