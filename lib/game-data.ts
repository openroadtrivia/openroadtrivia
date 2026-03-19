// Game data types and constants for Open Road Trivia

export interface Node {
  id: number;
  name: string;
  state: string;
  lat: number;
  lng: number;
  isCity: boolean;
  scene: string;
  desc: string;
}

export interface Edge {
  from: number;
  to: number;
  route: string;
  miles: number;
  difficulty: number;
  region: string;
  avgSpeed: number; // mph: 70 for Interstate, 55 for US highway, 45 for historic/scenic, 35 for town roads
}

export interface Question {
  q: string;
  a: string[];
  correct: number;
  bonus: string;
  synopsis: string;
  category?: string;
  difficulty?: string;
}

export interface ExploreStop {
  name: string;
  type: 'd' | 'a' | 'h' | 'r'; // discovery, attraction, hotel, restaurant
  question: Question;
}

// Time added per stop type (in minutes)
export const STOP_TIME: Record<string, number> = {
  d: 120,      // Discovery: 2 hours
  a: 30,       // Attraction: 30 min photo stop
  h: 600,      // Hotel: 10 hours (dinner + sleep + breakfast)
  r: 60,       // Restaurant: 1 hour meal
  excursion: 240, // Excursion: 4 hours round trip
  rest: 30,    // Rest Stop: 30 minutes
};

// Display labels per stop type
export const STOP_LABELS: Record<string, { label: string; color: string; dotColor: string; bgColor: string; borderColor: string }> = {
  d: { label: 'DISCOVERY', color: 'text-green-500', dotColor: '#10b981', bgColor: '#bbf7d060', borderColor: 'border-green-200' },
  a: { label: 'ATTRACTIONS', color: 'text-fuchsia-400', dotColor: '#e879f9', bgColor: '#f5d0fe60', borderColor: 'border-fuchsia-200' },
  h: { label: 'HOTELS', color: 'text-indigo-400', dotColor: '#818cf8', bgColor: '#c7d2fe60', borderColor: 'border-indigo-200' },
  r: { label: 'RESTAURANTS', color: 'text-orange-500', dotColor: '#f97316', bgColor: '#fed7aa60', borderColor: 'border-orange-200' },
};

// Fatigue system
export const FATIGUE = {
  SUNSET_HOURS: 8,       // Hours before sunset warning appears
  TIRED_HOURS: 10,       // Hours before timer penalty starts
  EXHAUSTED_HOURS: 12,   // Hours before severe penalty
  TIMER_PENALTY_TIRED: 5,    // Seconds removed from timer
  TIMER_PENALTY_EXHAUSTED: 10,
  SPEED_BONUS_PENALTY: 0.5,  // Speed bonus multiplied by this when fatigued
};

export interface Excursion {
  name: string;
  dist: string;
  desc: string;
  question: {
    q: string;
    a: string[];
    correct: number;
    bonus: string;
    synopsis: string;
  };
}

export interface HazardQuestion {
  type: string;
  message: string;
  q: string;
  a: string[];
  correct: number;
  synopsis: string;
  penalty: number;
}

export type GamePhase = 
  | 'home' | 'approach' | 'pick_lane' | 'road_q' 
  | 'detour_q' | 'hazard' | 'rest_stop' | 'rest_q' | 'game_over';

export interface GameState {
  phase: GamePhase;
  currentNode: number;
  points: number;
  miles: number;
  qAns: number;
  qCorr: number;
  streak: number;
  bestStreak: number;
  visited: number[];
  postcards: string[];
  masteredCities: number[];
  usedQuestions: Set<string>;
  restedNodes: Set<number>;
  visitedDetours: Set<string>;
  lastRegion: string;
}

export const POINTS = {
  ROAD_CORRECT: 100,
  ROAD_WRONG: -50,
  ROAD_TIMEOUT: -75,
  SPEED_BONUS_PER_SEC: 5,
  DETOUR_CORRECT: 200,
  DETOUR_WRONG: -100,
  REST_CORRECT: 75,
  REST_WRONG: 0,
};

export const QUESTION_TIME = 25;

export const NODES: Node[] = [
  { id: 0, name: "Chicago", state: "IL", lat: 41.88, lng: -87.63, isCity: true, scene: "city", desc: "Adams Street. Route 66 Begin sign." },
  { id: 1, name: "Joliet", state: "IL", lat: 41.52, lng: -88.08, isCity: false, scene: "industrial", desc: "Old prison limestone. Canal corridor." },
  { id: 2, name: "Springfield", state: "IL", lat: 39.78, lng: -89.65, isCity: true, scene: "town", desc: "Land of Lincoln. Capitol dome in afternoon light." },
  { id: 3, name: "St. Louis", state: "MO", lat: 38.63, lng: -90.20, isCity: true, scene: "city", desc: "The Gateway Arch. 630 feet of steel." },
  { id: 4, name: "Rolla", state: "MO", lat: 37.95, lng: -91.77, isCity: false, scene: "forest", desc: "Ozark ridges and cave country." },
  { id: 5, name: "Joplin", state: "MO", lat: 37.08, lng: -94.51, isCity: true, scene: "town", desc: "Mining heritage and rebuilding." },
  { id: 6, name: "Oklahoma City", state: "OK", lat: 35.47, lng: -97.52, isCity: true, scene: "city", desc: "168 empty chairs. A city that rebuilt." },
  { id: 7, name: "Tulsa", state: "OK", lat: 36.15, lng: -95.99, isCity: true, scene: "city", desc: "Art Deco towers on oil money." },
  { id: 8, name: "Amarillo", state: "TX", lat: 35.22, lng: -101.83, isCity: true, scene: "desert", desc: "Cadillacs nose-down in a field." },
  { id: 9, name: "Tucumcari", state: "NM", lat: 35.17, lng: -103.73, isCity: false, scene: "desert", desc: "Neon for 2,000 motel rooms." },
  { id: 10, name: "Albuquerque", state: "NM", lat: 35.08, lng: -106.65, isCity: true, scene: "desert", desc: "Central Avenue. 18 miles of Route 66." },
  { id: 11, name: "Santa Fe", state: "NM", lat: 35.69, lng: -105.94, isCity: true, scene: "town", desc: "Adobe and turquoise. Oldest state capital." },
  { id: 12, name: "Gallup", state: "NM", lat: 35.53, lng: -108.74, isCity: false, scene: "desert", desc: "El Rancho Hotel. Hollywood filmed here." },
  { id: 13, name: "Winslow", state: "AZ", lat: 35.02, lng: -110.70, isCity: false, scene: "desert", desc: "Standing on the corner." },
  { id: 14, name: "Flagstaff", state: "AZ", lat: 35.20, lng: -111.65, isCity: true, scene: "mountain", desc: "Ponderosa pines and dark skies." },
  { id: 15, name: "Kingman", state: "AZ", lat: 35.19, lng: -114.05, isCity: true, scene: "desert", desc: "The Powerhouse museum. Sitgreaves Pass ahead." },
  { id: 16, name: "Oatman", state: "AZ", lat: 35.03, lng: -114.38, isCity: false, scene: "desert", desc: "Burros in the street. Ghost town." },
  { id: 17, name: "Needles", state: "CA", lat: 34.85, lng: -114.61, isCity: false, scene: "desert", desc: "California border. Colorado River." },
  { id: 18, name: "Barstow", state: "CA", lat: 34.90, lng: -117.02, isCity: true, scene: "desert", desc: "Mojave crossroads. Freight trains." },
  { id: 19, name: "Santa Monica", state: "CA", lat: 34.02, lng: -118.50, isCity: true, scene: "city", desc: "The pier. The Pacific. End of the Trail." },
];

export const EDGES: Edge[] = [
  { from: 0, to: 1, route: "Route 66", miles: 45, difficulty: 1, region: "Chicagoland", avgSpeed: 40 },
  { from: 0, to: 2, route: "I-55 Express", miles: 200, difficulty: 2, region: "Illinois Prairie", avgSpeed: 70 },
  { from: 1, to: 2, route: "Route 66", miles: 157, difficulty: 2, region: "Illinois Prairie", avgSpeed: 50 },
  { from: 2, to: 3, route: "Route 66", miles: 98, difficulty: 2, region: "St. Louis Gateway", avgSpeed: 55 },
  { from: 3, to: 4, route: "Route 66", miles: 110, difficulty: 2, region: "Missouri Ozarks", avgSpeed: 45 },
  { from: 3, to: 5, route: "I-44 Express", miles: 265, difficulty: 3, region: "Missouri Ozarks", avgSpeed: 70 },
  { from: 4, to: 5, route: "Route 66", miles: 155, difficulty: 3, region: "Missouri Ozarks", avgSpeed: 45 },
  { from: 5, to: 7, route: "Route 66", miles: 115, difficulty: 2, region: "Oklahoma", avgSpeed: 55 },
  { from: 7, to: 6, route: "Route 66", miles: 107, difficulty: 2, region: "Oklahoma", avgSpeed: 55 },
  { from: 6, to: 8, route: "Route 66", miles: 263, difficulty: 3, region: "Texas Panhandle", avgSpeed: 55 },
  { from: 8, to: 9, route: "Route 66", miles: 113, difficulty: 2, region: "Eastern New Mexico", avgSpeed: 55 },
  { from: 8, to: 10, route: "I-40 Express", miles: 290, difficulty: 3, region: "Eastern New Mexico", avgSpeed: 70 },
  { from: 9, to: 10, route: "Route 66", miles: 175, difficulty: 2, region: "Eastern New Mexico", avgSpeed: 55 },
  { from: 10, to: 12, route: "Route 66", miles: 138, difficulty: 2, region: "Eastern New Mexico", avgSpeed: 55 },
  { from: 10, to: 11, route: "Pre-1937 Alignment", miles: 65, difficulty: 3, region: "Santa Fe", avgSpeed: 45 },
  { from: 11, to: 12, route: "Pre-1937 Alignment", miles: 155, difficulty: 3, region: "Santa Fe", avgSpeed: 45 },
  { from: 12, to: 13, route: "Route 66", miles: 165, difficulty: 2, region: "Painted Desert & Canyon Country", avgSpeed: 55 },
  { from: 13, to: 14, route: "Route 66", miles: 58, difficulty: 2, region: "Flagstaff & Williams", avgSpeed: 50 },
  { from: 14, to: 15, route: "Route 66", miles: 148, difficulty: 3, region: "Kingman & Western Arizona", avgSpeed: 55 },
  { from: 15, to: 16, route: "Route 66 (Sitgreaves Pass)", miles: 28, difficulty: 3, region: "Kingman & Western Arizona", avgSpeed: 25 },
  { from: 15, to: 17, route: "Route 66", miles: 59, difficulty: 2, region: "Mojave Crossing", avgSpeed: 55 },
  { from: 16, to: 17, route: "Route 66", miles: 31, difficulty: 2, region: "Mojave Crossing", avgSpeed: 35 },
  { from: 17, to: 18, route: "Route 66", miles: 148, difficulty: 3, region: "Mojave Crossing", avgSpeed: 55 },
  { from: 18, to: 19, route: "Route 66 / I-15", miles: 134, difficulty: 2, region: "Los Angeles & Santa Monica", avgSpeed: 50 },
];

export const HAZARD_QUESTIONS: HazardQuestion[] = [
  { type: "Construction Zone", message: "Orange cones for miles.", q: "Route 66 was decommissioned in what year?", a: ["1985", "1970", "1926", "2000"], correct: 0, synopsis: "Every segment had been bypassed by the Interstate.", penalty: 120 },
  { type: "Speed Trap", message: "Lights in the mirror.", q: "What was a motor court?", a: ["Cabins around a parking area", "A gas station with rooms", "A campground with tents", "A restaurant with cots"], correct: 0, synopsis: "Motor courts let travelers park directly in front of their cabin.", penalty: 100 },
  { type: "Flat Tire", message: "Thump thump thump.", q: "On Black Sunday 1935, what hit the Texas Panhandle?", a: ["A dust storm over a mile high", "A tornado", "A flash flood", "A blizzard"], correct: 0, synopsis: "The storm turned day into night. Families packed onto Route 66.", penalty: 150 },
  { type: "Construction Zone", message: "Detour ahead. 12 miles.", q: "What did John Steinbeck call Route 66 in The Grapes of Wrath?", a: ["The Mother Road", "The Freedom Highway", "The Dust Trail", "The Western Way"], correct: 0, synopsis: "The phrase that saved the road from being forgotten.", penalty: 120 },
  { type: "Speed Trap", message: "Slow down. Radar ahead.", q: "How many states does Route 66 pass through?", a: ["8", "6", "10", "5"], correct: 0, synopsis: "Illinois, Missouri, Kansas, Oklahoma, Texas, New Mexico, Arizona, California.", penalty: 80 },
  { type: "Flat Tire", message: "Shoulder gravel. Careful.", q: "What 1946 song made Route 66 famous?", a: ["Get Your Kicks on Route 66 by Bobby Troup", "King of the Road by Roger Miller", "On the Road Again by Willie Nelson", "Born to Run by Springsteen"], correct: 0, synopsis: "Written on a drive from Pennsylvania to LA.", penalty: 100 },
  { type: "Weather Delay", message: "Storm rolling in.", q: "The Dust Bowl migration sent thousands of families west on Route 66 to which state?", a: ["California", "Arizona", "Nevada", "Oregon"], correct: 0, synopsis: "200,000 refugees. One road west.", penalty: 130 },
];

export const EXCURSIONS: Record<number, Excursion[]> = {
  3: [
    { name: "Cahokia Mounds", dist: "15 min east", desc: "Largest pre-Columbian settlement north of Mexico. UNESCO World Heritage Site.", question: { q: "Cahokia Mounds was the largest city in North America before European contact. At its peak around 1100 AD, approximately how many people lived there?", a: ["Up to 20,000", "About 2,000", "About 50,000", "About 500"], correct: 0, bonus: "Monks Mound at Cahokia is the largest earthen structure in the Americas, larger at its base than the Great Pyramid of Giza.", synopsis: "Cahokia was a sophisticated urban center with plazas, wooden palisade walls, and a network of earthen mounds." } },
  ],
  6: [
    { name: "Oklahoma City National Memorial", dist: "Downtown", desc: "168 empty chairs on the footprint of the Murrah Building.", question: { q: "The 168 empty chairs at the Oklahoma City National Memorial each represent a victim. The chairs are arranged in how many rows?", a: ["Nine rows, one for each floor of the building", "Five rows by age group", "Two rows facing each other", "One single curved row"], correct: 0, bonus: "The chairs are bronze and stone, lit from below at night. Smaller chairs represent the 19 children killed.", synopsis: "The memorial sits on the footprint of the Alfred P. Murrah Federal Building, destroyed in the 1995 bombing." } },
  ],
  8: [
    { name: "Palo Duro Canyon", dist: "25 min south", desc: "Second-largest canyon in the US. 800 feet deep.", question: { q: "Palo Duro Canyon in Texas is the second-largest canyon in the United States. What is its approximate depth?", a: ["About 800 feet", "About 2,000 feet", "About 400 feet", "About 1,500 feet"], correct: 0, bonus: "The canyon stretches 120 miles long and up to 20 miles wide. Its name means 'hard wood' in Spanish, referring to the juniper trees.", synopsis: "Palo Duro Canyon State Park is often called the Grand Canyon of Texas and hosts an outdoor musical drama each summer." } },
  ],
  10: [
    { name: "Sandia Peak Tramway", dist: "20 min east", desc: "Longest aerial tramway in the Americas. 10,378 feet.", question: { q: "The Sandia Peak Tramway near Albuquerque travels 2.7 miles to reach what elevation?", a: ["10,378 feet", "8,200 feet", "12,500 feet", "7,000 feet"], correct: 0, bonus: "On a clear day, the view from the top spans 11,000 square miles across New Mexico.", synopsis: "The tramway is the longest aerial tram in the Americas, ascending the Sandia Mountains east of Albuquerque." } },
    { name: "Acoma Pueblo (Sky City)", dist: "60 min west", desc: "Oldest continuously inhabited settlement in the US.", question: { q: "Acoma Pueblo, known as Sky City, sits atop a sandstone mesa. How high above the valley floor is it?", a: ["367 feet", "150 feet", "600 feet", "50 feet"], correct: 0, bonus: "People have lived continuously at Acoma since at least 1150 AD, making it one of the oldest communities in North America.", synopsis: "Sky City is accessible only by a steep trail carved into the rock face or a modern road built in the 1950s." } },
  ],
  11: [
    { name: "Bandelier National Monument", dist: "45 min NW", desc: "Ancestral Pueblo cliff dwellings carved into volcanic rock.", question: { q: "The cliff dwellings at Bandelier National Monument were carved from what type of volcanic rock?", a: ["Tuff (compressed volcanic ash)", "Basalt", "Obsidian", "Granite"], correct: 0, bonus: "Visitors can climb wooden ladders into the alcove dwellings. The largest ceremonial cave sits 140 feet above the canyon floor.", synopsis: "Ancestral Pueblo people lived in these canyon dwellings from approximately 1150 to 1550 AD." } },
    { name: "Los Alamos", dist: "35 min NW", desc: "Secret Manhattan Project laboratory. Where the atomic age began.", question: { q: "Los Alamos was the secret headquarters of what World War II program?", a: ["The Manhattan Project", "The Enigma Program", "Operation Overlord", "The Tuskegee Project"], correct: 0, bonus: "The town was so secret it had no official address. Mail was sent to PO Box 1663, Santa Fe.", synopsis: "Scientists including J. Robert Oppenheimer lived and worked at Los Alamos to develop the first nuclear weapons." } },
  ],
  14: [
    { name: "Grand Canyon South Rim", dist: "80 min north", desc: "One of the seven natural wonders. 277 miles long.", question: { q: "The Grand Canyon is carved by the Colorado River. Approximately how deep is the canyon at its deepest point?", a: ["Over 6,000 feet (more than a mile)", "About 3,000 feet", "About 800 feet", "Over 10,000 feet"], correct: 0, bonus: "The rocks at the bottom of the Grand Canyon are nearly 2 billion years old, among the oldest exposed rock on Earth.", synopsis: "The Grand Canyon stretches 277 miles long and up to 18 miles wide across northern Arizona." } },
    { name: "Meteor Crater", dist: "40 min east", desc: "Best-preserved impact crater on Earth. Nearly a mile wide.", question: { q: "Meteor Crater in Arizona was formed approximately how many years ago?", a: ["About 50,000 years ago", "About 500,000 years ago", "About 5 million years ago", "About 5,000 years ago"], correct: 0, bonus: "The meteorite that created the crater was only about 150 feet across but was traveling at 26,000 miles per hour.", synopsis: "Meteor Crater is nearly a mile wide and 550 feet deep, and was used by NASA to train Apollo astronauts." } },
  ],
  15: [
    { name: "Hoover Dam", dist: "75 min NW", desc: "726 feet of concrete holding back Lake Mead.", question: { q: "How tall is Hoover Dam?", a: ["726 feet", "520 feet", "900 feet", "350 feet"], correct: 0, bonus: "The dam contains enough concrete to pave a two-lane highway from San Francisco to New York City.", synopsis: "Hoover Dam was built during the Great Depression between 1931 and 1936, employing thousands of workers." } },
  ],
  18: [
    { name: "Mojave National Preserve", dist: "45 min north", desc: "Singing sand dunes, volcanic cinder cones, Joshua trees.", question: { q: "The Kelso Dunes in Mojave National Preserve are famous for producing what unusual phenomenon?", a: ["A deep booming sound when sand slides", "A visible electrical glow at night", "Steam vents from underground heat", "A sweet floral scent at dawn"], correct: 0, bonus: "The 'singing' or 'booming' dunes produce low-frequency sounds when sand grains avalanche down the steep slip face.", synopsis: "Mojave National Preserve covers 1.6 million acres of desert wilderness between Los Angeles and Las Vegas." } },
  ],
  19: [
    { name: "Getty Center", dist: "15 min north", desc: "World-class art museum with free admission.", question: { q: "The Getty Center in Los Angeles was designed by which architect and opened in what year?", a: ["Richard Meier, 1997", "Frank Gehry, 2000", "I.M. Pei, 1995", "Renzo Piano, 2002"], correct: 0, bonus: "The Getty Center cost $1.3 billion to build and sits on a hilltop with panoramic views of Los Angeles.", synopsis: "Admission to the Getty Center is always free. The museum houses European paintings, sculptures, and photographs." } },
    { name: "Griffith Observatory", dist: "20 min east", desc: "Free observatory overlooking Hollywood. City lights to the horizon.", question: { q: "Griffith Observatory has been featured in many films. Which 1955 classic starring James Dean used it as a key filming location?", a: ["Rebel Without a Cause", "East of Eden", "Giant", "The Wild One"], correct: 0, bonus: "The observatory was built in 1935 with funds from Griffith J. Griffith, who wanted every person to have access to a telescope.", synopsis: "Griffith Observatory sits on the south slope of Mount Hollywood and offers free admission and free telescope viewing." } },
  ],
};

export const TRIP_ROSTER = [
  { name: "Route 66 Edition", route: "Chicago to Santa Monica", miles: 2448, status: "active" as const },
  { name: "Pacific Coast Highway", route: "San Diego to Olympic Peninsula", miles: 1650, status: "coming" as const },
  { name: "Blue Ridge Parkway", route: "Virginia to North Carolina", miles: 469, status: "coming" as const },
  { name: "New England", route: "Boston to Maine", miles: 800, status: "coming" as const },
  { name: "Mississippi River", route: "Source to Mouth", miles: 2340, status: "coming" as const },
];
