'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Types
interface PlayerProfile {
  id: string;
  display_name: string;
  email: string;
  avatar_url: string;
  player_skill: number;
  total_points: number;
  trips_completed: number;
  cities_mastered: number;
  postcards_earned: number;
  best_streak: number;
  total_questions: number;
  total_correct: number;
}

export interface GameSaveData {
  currentNode: number;
  points: number;
  miles: number;
  qAnswered: number;
  qCorrect: number;
  streak: number;
  bestStreak: number;
  playerSkill: number;
  visited: number[];
  postcards: string[];
  masteredCities: number[];
  perfectCities: number[];
  usedQuestions: string[];
  restedNodes: number[];
  visitedDetours: string[];
  tripMinutes: number;
  dayMinutes: number;
  lastRegion: string;
  currentLane: string;
}

export interface LeaderboardEntry {
  id: string;
  player_id: string;
  display_name: string;
  edition: string;
  score: number;
  accuracy_pct: number;
  completion_time: string;
  posted_at: string;
}

interface PlayerContextType {
  // Auth state
  isSignedIn: boolean;
  isGuest: boolean;
  isLoading: boolean;
  player: PlayerProfile | null;

  // Auth actions
  signUp: (email: string, password: string, displayName: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  playAsGuest: () => void;
  signOut: () => Promise<void>;

  // Save/Load
  saveGame: (data: GameSaveData) => Promise<void>;
  loadGame: () => Promise<GameSaveData | null>;
  clearSave: () => Promise<void>;

  // Career stats
  recordTripComplete: (data: {
    finalPoints: number;
    finalMiles: number;
    accuracyPct: number;
    postcardsEarned: number;
    citiesMastered: number;
    citiesPerfect: number;
    bestStreak: number;
    tripTimeDisplay: string;
    starRating: number;
  }) => Promise<void>;

  // Leaderboard
  getLeaderboard: (edition: string, limit?: number) => Promise<LeaderboardEntry[]>;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [player, setPlayer] = useState<PlayerProfile | null>(null);

  // Check auth state on mount
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // No Supabase — default to guest mode
      setIsGuest(true);
      setIsLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadPlayerProfile(session.user.id);
          setIsSignedIn(true);
        } else {
          // Check if they were a guest before
          const guestFlag = localStorage.getItem('ort_guest');
          if (guestFlag) setIsGuest(true);
        }
      } catch (e) {
        console.error('Auth check failed:', e);
      }
      setIsLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadPlayerProfile(session.user.id);
        setIsSignedIn(true);
        setIsGuest(false);
      } else if (event === 'SIGNED_OUT') {
        setIsSignedIn(false);
        setPlayer(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load player profile from Supabase
  async function loadPlayerProfile(userId: string) {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setPlayer(data as PlayerProfile);
    } else if (error?.code === 'PGRST116') {
      // No profile yet — will be created on first save
    }
  }

  // Create player profile in Supabase
  async function createPlayerProfile(userId: string, displayName: string, email: string) {
    const profile: Partial<PlayerProfile> = {
      id: userId,
      display_name: displayName,
      email: email,
      avatar_url: '',
      player_skill: 0,
      total_points: 0,
      trips_completed: 0,
      cities_mastered: 0,
      postcards_earned: 0,
      best_streak: 0,
      total_questions: 0,
      total_correct: 0,
    };

    const { data, error } = await supabase.from('players').insert(profile).select().single();
    if (data) setPlayer(data as PlayerProfile);
    return error?.message || null;
  }

  // ---- AUTH ACTIONS ----

  const signUp = async (email: string, password: string, displayName: string): Promise<string | null> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return error.message;
    if (data.user) {
      await createPlayerProfile(data.user.id, displayName, email);
      // Migrate localStorage save if it exists
      await migrateLocalStorage(data.user.id);
    }
    return null;
  };

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message || null;
  };

  const signInWithGoogle = async (): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    return error?.message || null;
  };

  const playAsGuest = () => {
    localStorage.setItem('ort_guest', 'true');
    setIsGuest(true);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsSignedIn(false);
    setPlayer(null);
    setIsGuest(false);
    localStorage.removeItem('ort_guest');
  };

  // ---- SAVE / LOAD ----

  const saveGame = useCallback(async (data: GameSaveData) => {
    // Always save to localStorage as backup
    localStorage.setItem('ort_save', JSON.stringify(data));

    // If signed in, also save to Supabase
    if (isSignedIn && player) {
      try {
        await supabase.from('trip_saves').upsert({
          player_id: player.id,
          edition: 'route66',
          current_node: data.currentNode,
          points: data.points,
          miles: data.miles,
          q_answered: data.qAnswered,
          q_correct: data.qCorrect,
          streak: data.streak,
          best_streak: data.bestStreak,
          player_skill: data.playerSkill,
          visited_nodes: data.visited,
          postcards: data.postcards,
          mastered_cities: data.masteredCities,
          perfect_cities: data.perfectCities,
          used_questions: data.usedQuestions,
          rested_nodes: data.restedNodes,
          visited_detours: data.visitedDetours,
          trip_minutes: data.tripMinutes,
          day_minutes: data.dayMinutes,
          last_region: data.lastRegion,
          current_lane: data.currentLane,
          saved_at: new Date().toISOString(),
        }, { onConflict: 'player_id,edition' });
      } catch (e) {
        console.error('Supabase save failed, localStorage backup intact:', e);
      }
    }
  }, [isSignedIn, player]);

  const loadGame = useCallback(async (): Promise<GameSaveData | null> => {
    // If signed in, try Supabase first
    if (isSignedIn && player) {
      try {
        const { data } = await supabase
          .from('trip_saves')
          .select('*')
          .eq('player_id', player.id)
          .eq('edition', 'route66')
          .single();

        if (data) {
          return {
            currentNode: data.current_node,
            points: data.points,
            miles: data.miles,
            qAnswered: data.q_answered,
            qCorrect: data.q_correct,
            streak: data.streak,
            bestStreak: data.best_streak,
            playerSkill: data.player_skill,
            visited: data.visited_nodes || [],
            postcards: data.postcards || [],
            masteredCities: data.mastered_cities || [],
            perfectCities: data.perfect_cities || [],
            usedQuestions: data.used_questions || [],
            restedNodes: data.rested_nodes || [],
            visitedDetours: data.visited_detours || [],
            tripMinutes: data.trip_minutes || 0,
            dayMinutes: data.day_minutes || 0,
            lastRegion: data.last_region || '',
            currentLane: data.current_lane || '',
          };
        }
      } catch (e) {
        console.error('Supabase load failed, trying localStorage:', e);
      }
    }

    // Fall back to localStorage
    const local = localStorage.getItem('ort_save');
    if (local) {
      try { return JSON.parse(local); } catch { return null; }
    }
    return null;
  }, [isSignedIn, player]);

  const clearSave = useCallback(async () => {
    localStorage.removeItem('ort_save');
    if (isSignedIn && player) {
      await supabase
        .from('trip_saves')
        .delete()
        .eq('player_id', player.id)
        .eq('edition', 'route66');
    }
  }, [isSignedIn, player]);

  // ---- TRIP COMPLETE ----

  const recordTripComplete = useCallback(async (tripData: {
    finalPoints: number;
    finalMiles: number;
    accuracyPct: number;
    postcardsEarned: number;
    citiesMastered: number;
    citiesPerfect: number;
    bestStreak: number;
    tripTimeDisplay: string;
    starRating: number;
  }) => {
    if (!isSignedIn || !player) return;

    // Write trip history
    await supabase.from('trip_history').insert({
      player_id: player.id,
      edition: 'route66',
      final_points: tripData.finalPoints,
      final_miles: tripData.finalMiles,
      accuracy_pct: tripData.accuracyPct,
      postcards_earned: tripData.postcardsEarned,
      cities_mastered: tripData.citiesMastered,
      cities_perfect: tripData.citiesPerfect,
      best_streak: tripData.bestStreak,
      trip_time_display: tripData.tripTimeDisplay,
      star_rating: tripData.starRating,
      completed_at: new Date().toISOString(),
    });

    // Update career stats
    await supabase.from('players').update({
      total_points: (player.total_points || 0) + tripData.finalPoints,
      trips_completed: (player.trips_completed || 0) + 1,
      cities_mastered: (player.cities_mastered || 0) + tripData.citiesMastered,
      postcards_earned: (player.postcards_earned || 0) + tripData.postcardsEarned,
      best_streak: Math.max(player.best_streak || 0, tripData.bestStreak),
      last_played: new Date().toISOString(),
    }).eq('id', player.id);

    // Post to leaderboard
    await supabase.from('leaderboards').insert({
      player_id: player.id,
      display_name: player.display_name,
      edition: 'route66',
      score: tripData.finalPoints,
      accuracy_pct: tripData.accuracyPct,
      completion_time: tripData.tripTimeDisplay,
      posted_at: new Date().toISOString(),
    });

    // Clear the save
    await clearSave();
  }, [isSignedIn, player, clearSave]);

  // ---- LEADERBOARD ----

  const getLeaderboard = useCallback(async (edition: string, limit: number = 50): Promise<LeaderboardEntry[]> => {
    if (!isSupabaseConfigured()) return [];
    const { data } = await supabase
      .from('leaderboards')
      .select('*')
      .eq('edition', edition)
      .order('score', { ascending: false })
      .limit(limit);
    return (data || []) as LeaderboardEntry[];
  }, []);

  // ---- MIGRATE LOCALSTORAGE ----

  async function migrateLocalStorage(userId: string) {
    const local = localStorage.getItem('ort_save');
    if (!local) return;
    try {
      const data = JSON.parse(local) as GameSaveData;
      await supabase.from('trip_saves').upsert({
        player_id: userId,
        edition: 'route66',
        current_node: data.currentNode,
        points: data.points,
        miles: data.miles,
        q_answered: data.qAnswered,
        q_correct: data.qCorrect,
        streak: data.streak,
        best_streak: data.bestStreak,
        player_skill: data.playerSkill,
        visited_nodes: data.visited,
        postcards: data.postcards,
        mastered_cities: data.masteredCities,
        perfect_cities: data.perfectCities,
        used_questions: data.usedQuestions,
        rested_nodes: data.restedNodes,
        visited_detours: data.visitedDetours,
        trip_minutes: data.tripMinutes,
        day_minutes: data.dayMinutes,
        last_region: data.lastRegion,
        current_lane: data.currentLane,
        saved_at: new Date().toISOString(),
      }, { onConflict: 'player_id,edition' });
      console.log('[ORT] Migrated localStorage save to Supabase');
    } catch (e) {
      console.error('Migration failed:', e);
    }
  }

  return (
    <PlayerContext.Provider value={{
      isSignedIn, isGuest, isLoading, player,
      signUp, signIn, signInWithGoogle, playAsGuest, signOut,
      saveGame, loadGame, clearSave,
      recordTripComplete,
      getLeaderboard,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}
