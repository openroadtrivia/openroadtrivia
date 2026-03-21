'use client';
import { ReactNode } from 'react';
import { PlayerProvider } from '@/lib/player-context';
import SoundProvider from '@/components/SoundProvider';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <PlayerProvider>
      <SoundProvider>
        {children}
      </SoundProvider>
    </PlayerProvider>
  );
}
