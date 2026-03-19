'use client';

import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
          <div className="text-center max-w-sm">
            <div className="text-4xl mb-3">🛣️</div>
            <h2 className="text-gray-900 text-lg font-bold mb-2">Road Closed</h2>
            <p className="text-gray-500 text-sm mb-4">
              Something went wrong. Your progress is saved — try refreshing the page.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-amber-500 text-white font-bold py-2.5 px-6 rounded-xl text-sm">
              Refresh
            </button>
            <div className="mt-4 text-gray-400 text-[10px] font-mono">
              {this.state.error?.message}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
