-- Run this in Supabase SQL Editor to enable automatic per-tailor payouts via Paystack Transaction Splits
ALTER TABLE tailor_profiles ADD COLUMN IF NOT EXISTS bank_code text;
ALTER TABLE tailor_profiles ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE tailor_profiles ADD COLUMN IF NOT EXISTS account_number text;
ALTER TABLE tailor_profiles ADD COLUMN IF NOT EXISTS account_name text;
ALTER TABLE tailor_profiles ADD COLUMN IF NOT EXISTS paystack_subaccount_code text;

ALTER TABLE payouts ADD COLUMN IF NOT EXISTS method text NOT NULL DEFAULT 'manual' CHECK (method IN ('manual', 'split'));
