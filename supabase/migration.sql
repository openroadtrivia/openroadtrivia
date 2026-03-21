-- Open Road Trivia — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- 1. Players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT DEFAULT '',
  player_skill INT DEFAULT 0 CHECK (player_skill >= 0 AND player_skill <= 5),
  total_points BIGINT DEFAULT 0,
  trips_completed INT DEFAULT 0,
  cities_mastered INT DEFAULT 0,
  postcards_earned INT DEFAULT 0,
  best_streak INT DEFAULT 0,
  total_questions INT DEFAULT 0,
  total_correct INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_played TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Trip saves (current game in progress)
CREATE TABLE IF NOT EXISTS trip_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  edition TEXT NOT NULL DEFAULT 'route66',
  current_node INT DEFAULT 0,
  points INT DEFAULT 0,
  miles INT DEFAULT 0,
  q_answered INT DEFAULT 0,
  q_correct INT DEFAULT 0,
  streak INT DEFAULT 0,
  best_streak INT DEFAULT 0,
  player_skill INT DEFAULT 2,
  visited_nodes INT[] DEFAULT '{}',
  postcards TEXT[] DEFAULT '{}',
  mastered_cities INT[] DEFAULT '{}',
  perfect_cities INT[] DEFAULT '{}',
  used_questions TEXT[] DEFAULT '{}',
  rested_nodes INT[] DEFAULT '{}',
  visited_detours TEXT[] DEFAULT '{}',
  trip_minutes INT DEFAULT 0,
  day_minutes INT DEFAULT 0,
  last_region TEXT DEFAULT '',
  current_lane TEXT DEFAULT '',
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, edition)
);

-- 3. Trip history (completed trips)
CREATE TABLE IF NOT EXISTS trip_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  edition TEXT NOT NULL DEFAULT 'route66',
  final_points INT DEFAULT 0,
  final_miles INT DEFAULT 0,
  accuracy_pct INT DEFAULT 0,
  postcards_earned INT DEFAULT 0,
  cities_mastered INT DEFAULT 0,
  cities_perfect INT DEFAULT 0,
  best_streak INT DEFAULT 0,
  trip_time_display TEXT DEFAULT '',
  star_rating INT DEFAULT 0 CHECK (star_rating >= 0 AND star_rating <= 5),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Leaderboards
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  edition TEXT NOT NULL DEFAULT 'route66',
  score INT DEFAULT 0,
  accuracy_pct INT DEFAULT 0,
  completion_time TEXT DEFAULT '',
  posted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trip_saves_player ON trip_saves(player_id, edition);
CREATE INDEX IF NOT EXISTS idx_trip_history_player ON trip_history(player_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_edition_score ON leaderboards(edition, score DESC);

-- Row Level Security (RLS)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

-- Players: users can read/update their own profile
CREATE POLICY "Users can read own profile" ON players FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON players FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON players FOR INSERT WITH CHECK (auth.uid() = id);

-- Trip saves: users can manage their own saves
CREATE POLICY "Users can read own saves" ON trip_saves FOR SELECT USING (auth.uid() = player_id);
CREATE POLICY "Users can insert own saves" ON trip_saves FOR INSERT WITH CHECK (auth.uid() = player_id);
CREATE POLICY "Users can update own saves" ON trip_saves FOR UPDATE USING (auth.uid() = player_id);
CREATE POLICY "Users can delete own saves" ON trip_saves FOR DELETE USING (auth.uid() = player_id);

-- Trip history: users can read/insert their own history
CREATE POLICY "Users can read own history" ON trip_history FOR SELECT USING (auth.uid() = player_id);
CREATE POLICY "Users can insert own history" ON trip_history FOR INSERT WITH CHECK (auth.uid() = player_id);

-- Leaderboards: everyone can read, users can insert their own
CREATE POLICY "Anyone can read leaderboards" ON leaderboards FOR SELECT USING (true);
CREATE POLICY "Users can insert own scores" ON leaderboards FOR INSERT WITH CHECK (auth.uid() = player_id);
