'use client';

interface SoundToggleProps {
  soundOn: boolean;
  onToggle: () => void;
}

export default function SoundToggle({ soundOn, onToggle }: SoundToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="fixed top-3 right-3 z-50 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 active:bg-gray-100"
      aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
    >
      {soundOn ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="#374151" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="#9ca3af" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      )}
    </button>
  );
}
