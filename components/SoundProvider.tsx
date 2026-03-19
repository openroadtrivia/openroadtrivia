'use client';

import { useState, useCallback } from 'react';
import { setAudioMuted, audio } from '@/lib/audio';
import SoundToggle from '@/components/SoundToggle';

export default function SoundProvider({ children }: { children: React.ReactNode }) {
  const [soundOn, setSoundOn] = useState(true);

  const toggleSound = useCallback(() => {
    const newState = !soundOn;
    setSoundOn(newState);
    setAudioMuted(!newState);
    if (newState) audio.init();
  }, [soundOn]);

  return (
    <>
      {children}
      <SoundToggle soundOn={soundOn} onToggle={toggleSound} />
    </>
  );
}
