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
const lightningPool: RawQuestion[] = (lightningData as any).questions || [];

export function getLightningQuestions(count: number = 10): RawQuestion[] {
  // Shuffle and return `count` random questions
  const shuffled = [...lightningPool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
