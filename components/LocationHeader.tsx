'use client';

import { useState } from 'react';
import DecoHeader from './DecoHeader';
import SceneImage from './SceneImage';

interface LocationHeaderProps {
  size?: 'full' | 'medium' | 'compact' | 'mini';
  label: string;
  title: string;
  subtitle?: string;
  detail?: string;
  meta?: string;
  scene?: string;
  imageSrc?: string | string[];
  accent?: string;
  light?: string;
}

export default function LocationHeader({
  size = 'full', label, title, subtitle, detail, meta,
  scene = 'desert', imageSrc, accent, light,
}: LocationHeaderProps) {
  const srcs = Array.isArray(imageSrc) ? imageSrc : imageSrc ? [imageSrc] : [];
  const [probeIdx, setProbeIdx] = useState(0);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [allFailed, setAllFailed] = useState(false);

  // Images are 1024x572 (roughly 16:9). Use aspect ratio to fill width.
  // On a ~640px wide card, 16:9 = ~360px tall. Cap at reasonable heights per size.
  const imgHeight = size === 'full' ? 360 : size === 'medium' ? 280 : size === 'compact' ? 200 : 0;

  // Image loaded successfully — show it, no text overlay (text is in the image)
  if (loadedSrc) {
    return (
      <div className="relative overflow-hidden" style={{ height: imgHeight }}>
        <img src={loadedSrc} alt={title} className="absolute inset-0 w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div>
      <DecoHeader size={size} label={label} title={title} subtitle={subtitle} detail={detail} meta={meta} accent={accent} light={light} />
      {size !== 'mini' && <SceneImage scene={scene} height={size === 'full' ? 100 : size === 'medium' ? 60 : 40} />}
      {/* Hidden probe — tries each format until one loads */}
      {srcs.length > 0 && !allFailed && probeIdx < srcs.length && (
        <img
          src={srcs[probeIdx]}
          alt=""
          className="hidden"
          onLoad={() => setLoadedSrc(srcs[probeIdx])}
          onError={() => {
            if (probeIdx + 1 < srcs.length) {
              setProbeIdx(probeIdx + 1);
            } else {
              setAllFailed(true);
            }
          }}
        />
      )}
    </div>
  );
}
