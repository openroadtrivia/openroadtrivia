'use client';

import Game from '@/components/Game';
import ErrorBoundary from '@/components/ErrorBoundary';
import AuthScreen from '@/components/AuthScreen';
import { usePlayer } from '@/lib/player-context';

export default function HomePage() {
  const { isSignedIn, isGuest, isLoading } = usePlayer();

  if (isLoading) {
    return (
      <div className="min-h-screen game-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-2">🛣️</div>
          <div className="text-gray-400 text-sm font-mono">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isSignedIn && !isGuest) {
    return <AuthScreen />;
  }

  return (
    <ErrorBoundary>
      <Game />
    </ErrorBoundary>
  );
}
