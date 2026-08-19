-- Adds a 'support' role: staff who can engage creatives, send broadcasts,
-- moderate feed posts, approve new creatives, and respond to disputes —
-- but cannot touch payouts or promote/demote other accounts.
-- Run this once in the Supabase SQL editor.

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('customer', 'tailor', 'admin', 'support'));
