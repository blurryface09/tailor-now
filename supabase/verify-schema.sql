-- Read-only schema verification. Paste into the Supabase SQL editor whenever you
-- are unsure which migrations have actually been applied. Changes nothing.
--
-- Companion to `npm run check:schema`, which probes through PostgREST and so
-- cannot see CHECK constraints. This runs as real SQL and can, which is why the
-- constraint query below exists.

-- ── 1. Columns the app depends on ───────────────────────────────────────────────
-- Expect 19 rows. A missing row means that migration never ran; the `source`
-- column names the file to paste.
SELECT
  c.table_name,
  c.column_name,
  e.source
FROM (VALUES
  ('payouts',         'method',                   'paystack-subaccounts-migration.sql'),
  ('tailor_profiles', 'bank_code',                'paystack-subaccounts-migration.sql'),
  ('tailor_profiles', 'bank_name',                'paystack-subaccounts-migration.sql'),
  ('tailor_profiles', 'account_number',           'paystack-subaccounts-migration.sql'),
  ('tailor_profiles', 'account_name',             'paystack-subaccounts-migration.sql'),
  ('tailor_profiles', 'paystack_subaccount_code', 'paystack-subaccounts-migration.sql'),
  ('tailor_profiles', 'is_founder',               'founder-badge.sql'),
  ('tailor_profiles', 'profile_views',            'score-level.sql'),
  ('tailor_profiles', 'profile_likes',            'score-level.sql'),
  ('tailor_profiles', 'years_experience',         'onboarding-upgrade.sql'),
  ('tailor_profiles', 'gov_id_url',               'onboarding-upgrade.sql'),
  ('tailor_profiles', 'turnaround_days',          'onboarding-upgrade.sql'),
  ('tailor_profiles', 'instagram_url',            'onboarding-upgrade.sql'),
  ('tailor_profiles', 'pledge_signed_at',         'onboarding-upgrade.sql'),
  ('posts',           'post_type',                'marketplace-migration.sql'),
  ('posts',           'price',                    'marketplace-migration.sql'),
  ('posts',           'title',                    'marketplace-migration.sql'),
  ('posts',           'is_available',             'marketplace-migration.sql')
) AS e(table_name, column_name, source)
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name   = e.table_name
 AND c.column_name  = e.column_name
ORDER BY e.source, e.table_name, e.column_name;
-- Rows where table_name and column_name are NULL are the ones that are MISSING.

-- ── 2. Tables the app depends on ────────────────────────────────────────────────
SELECT
  e.expected_table,
  t.table_name AS found,
  e.source
FROM (VALUES
  ('posts',          'social-setup.sql'),
  ('post_comments',  'social-setup.sql'),
  ('notifications',  'social-setup.sql'),
  ('follows',        'social-setup.sql'),
  ('creative_likes', 'score-level.sql'),
  ('fabrics',        'fabrics-migration.sql'),
  ('payouts',        'social-setup.sql')
) AS e(expected_table, source)
LEFT JOIN information_schema.tables t
  ON t.table_schema = 'public' AND t.table_name = e.expected_table
ORDER BY e.source, e.expected_table;
-- A NULL in `found` means that table does not exist.

-- ── 3. CHECK constraints ────────────────────────────────────────────────────────
-- posts_post_type_check must list 'editorial' or no admin feed post can be
-- created. The payouts method check must list 'split' or automatic payouts fail.
SELECT
  conrelid::regclass AS table_name,
  conname,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid IN ('posts'::regclass, 'payouts'::regclass)
  AND contype = 'c'
ORDER BY table_name, conname;
