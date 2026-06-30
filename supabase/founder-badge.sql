-- Run this in Supabase SQL Editor to add the founder badge column
ALTER TABLE tailor_profiles ADD COLUMN IF NOT EXISTS is_founder boolean NOT NULL DEFAULT false;
