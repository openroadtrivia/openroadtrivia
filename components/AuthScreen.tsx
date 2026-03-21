'use client';
import { useState } from 'react';
import { usePlayer } from '@/lib/player-context';

export default function AuthScreen() {
  const { signUp, signIn, signInWithGoogle, playAsGuest } = usePlayer();
  const [mode, setMode] = useState<'welcome' | 'signin' | 'signup'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!email || !password || !name) { setError('All fields are required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    const err = await signUp(email, password, name);
    if (err) setError(err);
    setLoading(false);
  }

  async function handleSignIn() {
    if (!email || !password) { setError('Email and password are required'); return; }
    setLoading(true);
    setError('');
    const err = await signIn(email, password);
    if (err) setError(err);
    setLoading(false);
  }

  async function handleGoogle() {
    setLoading(true);
    setError('');
    const err = await signInWithGoogle();
    if (err) setError(err);
    setLoading(false);
  }

  if (mode === 'welcome') {
    return (
      <div className="min-h-screen game-bg flex items-center justify-center p-4">
        <div className="card p-6 w-full max-w-sm text-center">
          <div className="text-amber-500 font-mono text-[9px] tracking-[5px] mb-2">OPEN ROAD TRIVIA</div>
          <h1 className="text-gray-900 text-2xl font-bold">Route 66 Edition</h1>
          <p className="text-gray-500 text-sm mt-2 mb-6">Chicago to Santa Monica · 2,448 miles</p>

          <div className="space-y-3">
            <button onClick={() => setMode('signup')} className="btn-primary w-full py-3 text-base">
              Create Account
            </button>
            <button onClick={() => setMode('signin')} className="btn-outline w-full py-3 text-base">
              Sign In
            </button>
            <button onClick={handleGoogle} className="w-full py-3 text-base rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Continue with Google
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <button onClick={playAsGuest} className="btn-outline w-full py-3 text-base">
              Play as Guest
            </button>
            <p className="text-gray-300 text-[10px] mt-1 text-center">Guest progress saves to this device only</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen game-bg flex items-center justify-center p-4">
      <div className="card p-6 w-full max-w-sm">
        <button onClick={() => { setMode('welcome'); setError(''); }} className="text-gray-400 text-sm mb-4">← Back</button>

        <h2 className="text-gray-900 text-xl font-bold mb-4">
          {mode === 'signup' ? 'Create Account' : 'Sign In'}
        </h2>

        <div className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="text-gray-500 text-xs font-mono block mb-1">DISPLAY NAME</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Road Warrior Dan"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          )}
          <div>
            <label className="text-gray-500 text-xs font-mono block mb-1">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="text-gray-500 text-xs font-mono block mb-1">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          {error && (
            <div className="text-red-500 text-xs bg-red-50 p-2 rounded-lg">{error}</div>
          )}

          <button
            onClick={mode === 'signup' ? handleSignUp : handleSignIn}
            disabled={loading}
            className="btn-primary w-full py-3 text-base"
          >
            {loading ? 'Loading...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </div>

        <div className="text-center mt-4">
          <button
            onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); }}
            className="text-amber-600 text-sm"
          >
            {mode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
