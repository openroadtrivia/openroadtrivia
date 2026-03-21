// Question loader - reads from JSON data files
// In production with Supabase, this becomes API calls

import questionsData from '@/data/route66-questions.json';
import exploresData from '@/data/route66-explores.json';
import lightningData from '@/data/route66-lightning.json';

export interface RawQuestion {
  q: string;
  a: string[];
  correct: number;
  bonus: string;
  synopsis: string;
  category?: string;
  region?: string;
  difficulty?: string;
  skill?: number; // 1-5: 1=common knowledge, 2=moderate, 3=solid, 4=deep, 5=expert
}

export interface RawExploreStop {
  name: string;
  type: string;
  explore_type: string;
  desc: string;
  q: string;
  a: string[];
  correct: number;
  bonus: string;
  synopsis: string;
}

// Group questions by region
const questionsByRegion: Record<string, RawQuestion[]> = {};
const allQuestions = (questionsData as any).questions || questionsData;

if (Array.isArray(allQuestions)) {
  for (const q of allQuestions) {
    const region = q.region || 'General';
    if (!questionsByRegion[region]) questionsByRegion[region] = [];
    questionsByRegion[region].push(q);
  }
}

// Region name mapping (JSON regions may differ slightly from game data regions)
const REGION_MAP: Record<string, string> = {
  // Edge region name → Question data region name
  'Chicagoland': 'Chicagoland',
  'Illinois Prairie': 'Illinois Prairie',
  'St. Louis Gateway': 'St. Louis Gateway',
  'St Louis Gateway': 'St. Louis Gateway',
  'Missouri Ozarks': 'Missouri Ozarks',
  'Oklahoma': 'Oklahoma Crossroads',
  'Oklahoma Crossroads': 'Oklahoma Crossroads',
  'Texas Panhandle': 'Texas Panhandle',
  'Eastern New Mexico': 'Eastern New Mexico',
  'New Mexico': 'Eastern New Mexico',
  'Santa Fe': 'Santa Fe',
  'Painted Desert & Canyon Country': 'Painted Desert & Canyon Country',
  'Painted Desert': 'Painted Desert & Canyon Country',
  'Flagstaff & Williams': 'Flagstaff & Williams',
  'Flagstaff': 'Flagstaff & Williams',
  'Kingman & Western Arizona': 'Kingman & Western Arizona',
  'Western Arizona': 'Kingman & Western Arizona',
  'Mojave Crossing': 'Mojave Crossing',
  'Mojave': 'Mojave Crossing',
  'Los Angeles & Santa Monica': 'Los Angeles & Santa Monica',
  'Los Angeles': 'Los Angeles & Santa Monica',
};

export function getQuestionsForRegion(edgeRegion: string): RawQuestion[] {
  // Try direct match first
  if (questionsByRegion[edgeRegion]) return questionsByRegion[edgeRegion];
  
  // Try mapped name
  const mapped = REGION_MAP[edgeRegion];
  if (mapped && questionsByRegion[mapped]) return questionsByRegion[mapped];
  
  // Try reverse mapping
  for (const [key, value] of Object.entries(REGION_MAP)) {
    if (value === edgeRegion && questionsByRegion[key]) return questionsByRegion[key];
  }

  // Fallback: search all regions for partial match
  for (const [region, qs] of Object.entries(questionsByRegion)) {
    if (region.includes(edgeRegion) || edgeRegion.includes(region)) return qs;
  }

  return [];
}

// Group explores by city name
const exploresByCity: Record<string, RawExploreStop[]> = {};

if (typeof exploresData === 'object' && !Array.isArray(exploresData)) {
  const typeMap: Record<string, string> = { d: 'discovery', a: 'attraction', h: 'hotel', r: 'restaurant', museum: 'discovery', landmark: 'discovery' };
  for (const [city, stops] of Object.entries(exploresData as Record<string, any[]>)) {
    exploresByCity[city] = stops.map(s => {
      const rawType = s.type || 'd';
      // Normalize old type names to new codes
      const typeCode = (rawType === 'museum' || rawType === 'landmark') ? 'd' : rawType;
      return {
        name: s.name,
        type: typeCode,
        explore_type: typeMap[rawType] || 'discovery',
        desc: s.desc || '',
        q: s.q,
        a: s.a,
        correct: s.correct || 0,
        bonus: s.bonus || '',
        synopsis: s.synopsis || '',
      };
    });
  }
}

export function getExploresForCity(cityName: string): RawExploreStop[] {
  return exploresByCity[cityName] || [];
}

export function getRestQuestionsForRegion(edgeRegion: string): RawQuestion[] {
  // Use the last 3 questions from the region as rest stop questions
  const pool = getQuestionsForRegion(edgeRegion);
  if (pool.length <= 5) return pool.slice(-2);
  return pool.slice(-3);
}

// Debug: log what we loaded
if (typeof window !== 'undefined') {
  const regionCount = Object.keys(questionsByRegion).length;
  const totalQs = Object.values(questionsByRegion).reduce((sum, qs) => sum + qs.length, 0);
  const cityCount = Object.keys(exploresByCity).length;
  const totalExplores = Object.values(exploresByCity).reduce((sum, s) => sum + s.length, 0);
  console.log(`[ORT] Loaded ${totalQs} questions across ${regionCount} regions, ${totalExplores} explores across ${cityCount} cities`);
}

// Lightning Round questions
// General pool for the opening round (Route 66 general knowledge)
const generalLightningPool: RawQuestion[] = (lightningData as any).questions || [];

// All questions from all regions combined (for opening round skill-filtered draw)
const allQuestionsPool: RawQuestion[] = (() => {
  const all: RawQuestion[] = [];
  const qs = (questionsData as any).questions || questionsData;
  if (Array.isArray(qs)) all.push(...qs);
  return all;
})();

export function getOpeningLightningQuestions(count: number = 10, playerSkill: number = 0): RawQuestion[] {
  // First time (skill 0): draw from skill 1-2 across all regions + general pool
  // Returning player: draw at their level and one above
  const minSkill = playerSkill === 0 ? 1 : playerSkill;
  const maxSkill = playerSkill === 0 ? 2 : Math.min(playerSkill + 1, 5);
  
  // Combine general lightning pool + all questions, filter by skill
  const combined = [...generalLightningPool, ...allQuestionsPool];
  const filtered = combined.filter(q => {
    const s = q.skill || 3;
    return s >= minSkill && s <= maxSkill;
  });
  
  const pool = filtered.length >= count ? filtered : combined;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function getCityLightningQuestions(
  region: string, 
  lane: string | null, 
  miles: number, 
  playerSkill: number,
  usedQs?: Set<string>
): RawQuestion[] {
  // Count: 1 question per 20 miles, minimum 2, maximum 13
  const count = Math.max(2, Math.min(13, Math.round(miles / 20)));
  
  // Get region pool
  let pool = getQuestionsForRegion(region);
  
  // Filter by lane if specified
  if (lane) {
    const lanePool = pool.filter(q => q.category === lane);
    if (lanePool.length >= count) pool = lanePool;
  }
  
  // Filter by skill: player level and one above
  const minSkill = playerSkill;
  const maxSkill = Math.min(playerSkill + 1, 5);
  const skillPool = pool.filter(q => {
    const s = q.skill || 3;
    return s >= minSkill && s <= maxSkill;
  });
  if (skillPool.length >= count) pool = skillPool;
  
  // Filter out used questions
  if (usedQs) {
    const unused = pool.filter((q, i) => !usedQs.has(`r-${region}-${i}`));
    if (unused.length >= count) pool = unused;
  }
  
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Calculate player skill from lightning round performance
export function calculateSkillLevel(correct: number, total: number, currentSkill: number): number {
  const pct = total > 0 ? correct / total : 0;
  if (pct >= 0.8 && currentSkill < 5) return currentSkill + 1;
  if (pct < 0.4 && currentSkill > 1) return currentSkill - 1;
  return currentSkill;
}

// Legacy wrapper for backward compatibility
export function getLightningQuestions(count: number = 10, region?: string, usedQs?: Set<string>): RawQuestion[] {
  if (region) {
    return getCityLightningQuestions(region, null, count * 20, 3, usedQs);
  }
  return getOpeningLightningQuestions(count);
}
