// Game engine utilities for Open Road Trivia

import { Question, POINTS, QUESTION_TIME } from './game-data';

export interface ShuffledQuestion {
  a: string[];
  correct: number;
}

export function shuffleAnswers(q: Question): ShuffledQuestion {
  const idx = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return {
    a: [q.a[idx[0]], q.a[idx[1]], q.a[idx[2]], q.a[idx[3]]],
    correct: idx.indexOf(q.correct),
  };
}

export function calculateRoadPoints(
  correct: boolean,
  timeout: boolean,
  timer: number,
  streak: number,
  hintUsed: boolean
): number {
  if (correct) {
    let d = POINTS.ROAD_CORRECT + timer * POINTS.SPEED_BONUS_PER_SEC;
    if (streak >= 4) d += 50;
    if (hintUsed) d = Math.round(d / 2);
    return d;
  }
  if (timeout) return POINTS.ROAD_TIMEOUT;
  return hintUsed ? POINTS.ROAD_WRONG * 2 : POINTS.ROAD_WRONG;
}

export function getSpeedRating(ms: number): { label: string; color: string } {
  if (ms < 3000) return { label: 'Lightning', color: '#d97706' };
  if (ms < 6000) return { label: 'Fast', color: '#059669' };
  if (ms < 12000) return { label: 'Steady', color: '#6b7280' };
  return { label: 'Careful', color: '#9ca3af' };
}

export function getStreakLabel(streak: number): string {
  if (streak >= 10) return 'UNSTOPPABLE x' + streak;
  if (streak >= 5) return 'ON FIRE x' + streak;
  if (streak >= 3) return streak + ' IN A ROW';
  return '';
}

export function getStarRating(points: number): number {
  if (points > 3000) return 5;
  if (points > 2000) return 4;
  if (points > 1000) return 3;
  if (points > 0) return 2;
  return 1;
}

// Local storage persistence
const STORAGE_KEY = 'openroadtrivia_save';

export interface SaveData {
  playerName: string;
  currentNode: number;
  points: number;
  miles: number;
  qAns: number;
  qCorr: number;
  bestStreak: number;
  visited: number[];
  postcards: string[];
  masteredCities: number[];
  perfectCities: number[];
  usedQuestions: string[];
  restedNodes: number[];
  visitedDetours: string[];
  lastRegion: string;
  gameStarted: boolean;
  totalTrips: number;
  tripMinutes: number;
  dayMinutes: number;
  cityMissed: boolean;
}

export function saveGame(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // Storage not available
  }
}

export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
}

// Trip time formatting
// Adds daily life time: breakfast (45min), lunch (60min), dinner (90min), sleep (8hrs) per day
export function formatTripTime(totalMinutes: number): { days: number; hours: number; minutes: number; display: string; withLife: string } {
  // Raw travel + stop time
  const rawHours = totalMinutes / 60;
  
  // Calculate days: assume 10 hours of active travel per day, then overnight
  const activeDays = Math.ceil(rawHours / 10) || 1;
  
  // Daily life adds per day: breakfast 45m + lunch 60m + dinner 90m + sleep 480m = 675m = 11.25 hrs
  const lifeMinutesPerDay = 675;
  const totalWithLife = totalMinutes + (activeDays * lifeMinutesPerDay);
  
  const totalDays = Math.floor(totalWithLife / (24 * 60));
  const remainHours = Math.floor((totalWithLife % (24 * 60)) / 60);
  const remainMin = totalWithLife % 60;
  
  // Simple display for stats bar
  const drivingHrs = Math.floor(totalMinutes / 60);
  const drivingMin = totalMinutes % 60;
  const display = drivingHrs > 0 
    ? `${drivingHrs}h ${drivingMin}m driving`
    : `${drivingMin}m driving`;
  
  // Full display for Game Over
  let withLife = '';
  if (totalDays > 0) {
    withLife = `${totalDays} day${totalDays > 1 ? 's' : ''}, ${remainHours}h ${remainMin}m`;
  } else {
    withLife = `${remainHours}h ${remainMin}m`;
  }
  
  return { days: activeDays, hours: drivingHrs, minutes: drivingMin, display, withLife };
}

// Encouraging feedback messages — never feel like a test
const CORRECT_MESSAGES = [
  "Nice one!",
  "Nailed it!",
  "You got it!",
  "Sharp!",
  "Exactly right!",
  "Spot on!",
  "Knew it!",
  "Road scholar!",
  "That's the one!",
  "Cruising!",
];

const WRONG_MESSAGES = [
  "Close! Most people miss that one.",
  "Tricky one — now you know.",
  "Good guess. That's a tough one.",
  "Not quite — but you'll remember it now.",
  "Almost! Filed away for next time.",
  "That one catches everybody.",
  "Tough call. The road teaches.",
  "No shame — that's a deep cut.",
  "Interesting guess! The answer surprises most people.",
  "Good instinct, wrong turn.",
];

const TIMEOUT_MESSAGES = [
  "Time flies on the open road.",
  "The clock ran out — but the story's worth reading.",
  "No worries. Take a look at the answer.",
  "Ran out of road on that one.",
  "Time's up — but you'll know it next time.",
];

const CORRECT_STREAK_MESSAGES = [
  "On fire!",
  "Unstoppable!",
  "The road knows your name!",
  "Can't miss!",
  "Rolling thunder!",
];

export function getResultMessage(type: 'correct' | 'wrong' | 'timeout', streak?: number): string {
  if (type === 'correct' && streak && streak >= 3) {
    return CORRECT_STREAK_MESSAGES[Math.floor(Math.random() * CORRECT_STREAK_MESSAGES.length)];
  }
  const pool = type === 'correct' ? CORRECT_MESSAGES : type === 'wrong' ? WRONG_MESSAGES : TIMEOUT_MESSAGES;
  return pool[Math.floor(Math.random() * pool.length)];
}
