-- Run this in Supabase SQL Editor to add score/level tracking

-- Add score columns to tailor_profiles
ALTER TABLE tailor_profiles
  ADD COLUMN IF NOT EXISTS profile_views  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_likes  integer NOT NULL DEFAULT 0;

-- Table for deduplicating creative likes
CREATE TABLE IF NOT EXISTS creative_likes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_id uuid REFERENCES tailor_profiles(id) ON DELETE CASCADE NOT NULL,
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(creative_id, user_id)
);

ALTER TABLE creative_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creative_likes_public_read"  ON creative_likes FOR SELECT USING (true);
CREATE POLICY "creative_likes_owner_insert" ON creative_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "creative_likes_owner_delete" ON creative_likes FOR DELETE USING (auth.uid() = user_id);
