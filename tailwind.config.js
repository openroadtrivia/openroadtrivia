/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        deco: {
          gold: '#d4a340',
          light: '#f5d778',
          dark: '#1a1a2e',
          purple: '#2d1f3d',
          cream: '#faf5eb',
          warm: '#c0a870',
          muted: '#8a7a5a',
        },
        game: {
          correct: '#059669',
          wrong: '#ef4444',
          streak: '#f59e0b',
          explore: '#10b981',
          attract: '#e879f9',
          excursion: '#d97706',
          rest: '#2563eb',
          hazard: '#dc2626',
        },
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};
