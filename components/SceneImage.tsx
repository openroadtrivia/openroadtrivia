'use client';

import { useState } from 'react';

const SCENE_GRADIENTS: Record<string, [string, string]> = {
  city: ['#1a1a2e', '#0f3460'],
  town: ['#1e1e2e', '#3a3a5a'],
  forest: ['#0a1a0a', '#1a3a1a'],
  desert: ['#2a1a0a', '#5a3a1a'],
  mountain: ['#0a1a2a', '#1a3a5a'],
  industrial: ['#1a1a1a', '#3a3a3a'],
  coastal: ['#0a1a2a', '#1a4a6a'],
  rural: ['#1a2e1a', '#2e4a1e'],
};

interface SceneImageProps {
  scene?: string;
  height?: number;
  imageSrc?: string | string[];
  alt?: string;
}

// Tries each image path in order, falls back to gradient if none load
function MultiImage({ srcs, alt, className }: { srcs: string[]; alt: string; className?: string }) {
  const [idx, setIdx] = useState(0);
  const [allFailed, setAllFailed] = useState(false);

  if (allFailed || srcs.length === 0) return null;

  return (
    <img
      src={srcs[idx]}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        if (idx + 1 < srcs.length) {
          setIdx(idx + 1);
        } else {
          setAllFailed(true);
        }
      }}
    />
  );
}

export default function SceneImage({ scene = 'desert', height = 120, imageSrc, alt = '' }: SceneImageProps) {
  const [c1, c2] = SCENE_GRADIENTS[scene] || SCENE_GRADIENTS.desert;
  const srcs = Array.isArray(imageSrc) ? imageSrc : imageSrc ? [imageSrc] : [];

  return (
    <div className="relative overflow-hidden" style={{ height, background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` }}>
      {srcs.length > 0 && (
        <MultiImage srcs={srcs} alt={alt} className="absolute inset-0 w-full h-full object-cover" />
      )}
    </div>
  );
}
