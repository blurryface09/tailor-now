-- Onboarding v2: deeper creative profile fields for trust
ALTER TABLE tailor_profiles
  ADD COLUMN IF NOT EXISTS years_experience TEXT,
  ADD COLUMN IF NOT EXISTS gov_id_url        TEXT,
  ADD COLUMN IF NOT EXISTS turnaround_days   TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url     TEXT,
  ADD COLUMN IF NOT EXISTS pledge_signed_at  TIMESTAMPTZ;
