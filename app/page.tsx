'use client';

import Game from '@/components/Game';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function HomePage() {
  return (
    <ErrorBoundary>
      <Game />
    </ErrorBoundary>
  );
}
