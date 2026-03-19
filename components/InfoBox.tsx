'use client';

import { useState } from 'react';

interface InfoBoxProps {
  type: 'bonus' | 'story';
  text: string;
  imageSrc?: string;
  imageAlt?: string;
}

export default function InfoBox({ type, text, imageSrc, imageAlt = '' }: InfoBoxProps) {
  const [imgFailed, setImgFailed] = useState(false);
  if (!text) return null;

  const isBonus = type === 'bonus';
  const showImage = imageSrc && !imgFailed;

  return (
    <div className={`rounded-xl border overflow-hidden mt-3 ${
      isBonus ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
    }`}>
      {/* Show location graphic if available */}
      {showImage && (
        <div className="relative overflow-hidden" style={{ height: 100 }}>
          <img
            src={imageSrc}
            alt={imageAlt}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        </div>
      )}
      <div className="px-3.5 py-3">
        <div className={`text-xs font-bold mb-1.5 ${
          isBonus ? 'text-green-700' : 'text-blue-700'
        }`}>
          {isBonus ? 'Did You Know?' : 'The Story Behind It'}
        </div>
        <div className="text-gray-700 text-[13px] leading-relaxed">{text}</div>
      </div>
    </div>
  );
}
