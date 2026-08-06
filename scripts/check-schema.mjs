#!/usr/bin/env node
/**
 * Verifies that the live Supabase schema has everything the app code depends on.
 *
 * There is no migration runner in this project: the files in supabase/ are pasted
 * into the Supabase SQL editor by hand. Twice now, code has shipped ahead of its
 * migration and failed silently in production — a missing payouts.method column
 * broke payment recording, and a stale posts_post_type_check meant no admin feed
 * post could ever be created. Both were invisible until a user hit them.
 *
 * This script is read-only. It probes each expected table and column with a
 * zero-row select and reports anything missing, naming the file to run. It writes
 * nothing and cannot alter the database.
 *
 *   node scripts/check-schema.mjs
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment
 * (the service role bypasses RLS, so a missing column is not confused with a row
 * that policy hid).
 */

import { createClient } from '@supabase/supabase-js'

// Columns and tables the code reads or writes, and the migration that adds each.
// Add a row here whenever a new supabase/*.sql file introduces something the app
// depends on — that is what keeps this check honest.
const EXPECTATIONS = [
  { table: 'posts',           columns: ['post_type', 'price', 'title', 'is_available'], file: 'marketplace-migration.sql' },
  { table: 'payouts',         columns: ['method'],                                      file: 'paystack-subaccounts-migration.sql' },
  { table: 'tailor_profiles', columns: ['bank_code', 'bank_name', 'account_number', 'account_name', 'paystack_subaccount_code'], file: 'paystack-subaccounts-migration.sql' },
  { table: 'tailor_profiles', columns: ['is_founder'],                                  file: 'founder-badge.sql' },
  { table: 'tailor_profiles', columns: ['profile_views', 'profile_likes'],              file: 'score-level.sql' },
  { table: 'tailor_profiles', columns: ['years_experience', 'gov_id_url', 'turnaround_days', 'instagram_url', 'pledge_signed_at'], file: 'onboarding-upgrade.sql' },
  { table: 'creative_likes',  columns: ['id'],                                          file: 'score-level.sql' },
  { table: 'fabrics',         columns: ['id'],                                          file: 'fabrics-migration.sql' },
  { table: 'posts',           columns: ['id'],                                          file: 'social-setup.sql' },
  { table: 'post_comments',   columns: ['id'],                                          file: 'social-setup.sql' },
  { table: 'notifications',   columns: ['id'],                                          file: 'social-setup.sql' },
]

// CHECK constraints cannot be inspected through PostgREST, so they cannot be
// probed from here. supabase/verify-schema.sql checks them as real SQL; these are
// listed so they are not silently forgotten if that file is not run.
const UNPROBEABLE = [
  {
    what: "posts_post_type_check must allow 'editorial'",
    file: 'editorial-post-type.sql',
    verify: "insert an admin post from /admin/feed — a violation names posts_post_type_check",
  },
  {
    what: "payouts.method CHECK must allow 'split'",
    file: 'paystack-subaccounts-migration.sql',
    verify: 'covered indirectly: the column probe above fails if the migration never ran',
  },
]

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('✗ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.')
  process.exit(2)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

const missing = []

for (const { table, columns, file } of EXPECTATIONS) {
  // limit(0) asks PostgREST to resolve the column list without returning rows.
  const { error } = await supabase.from(table).select(columns.join(',')).limit(0)
  if (error) {
    missing.push({ table, columns, file, reason: error.message })
    console.log(`✗ ${table} (${columns.join(', ')})  →  run supabase/${file}`)
  } else {
    console.log(`✓ ${table} (${columns.join(', ')})`)
  }
}

console.log('\nNot checkable automatically — confirm by hand:')
for (const u of UNPROBEABLE) {
  console.log(`  · ${u.what}\n      file:   supabase/${u.file}\n      verify: ${u.verify}`)
}

if (missing.length) {
  console.error(`\n✗ ${missing.length} expectation(s) unmet. The app will fail at runtime where these are used.`)
  for (const m of missing) console.error(`    ${m.table}: ${m.reason}`)
  process.exit(1)
}

console.log('\n✓ Every probeable expectation is present.')
