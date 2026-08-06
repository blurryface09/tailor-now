# Database migrations

There is no migration runner. Each `.sql` file here is pasted into the Supabase SQL
editor by hand, and nothing records that it happened.

That has caused two production bugs so far, both invisible until a user hit them:

- `payouts.method` was missing, so recording a payout threw *after* the customer
  had already been charged (fixed in PR #1).
- `posts_post_type_check` still forbade `'editorial'`, so no admin feed post could
  ever be created.

In both cases the code was correct and deployed; only the schema was behind.

## Before trusting a deploy

```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run check:schema
```

Read-only. It probes every table and column the app depends on and names the file
to run for anything missing. Exits non-zero on drift, so it can gate a deploy.

For the fuller picture, paste `verify-schema.sql` into the Supabase SQL editor. It
covers the same columns and tables plus the CHECK constraints, which the Node check
cannot see — PostgREST does not expose them, but the SQL editor does. Use it when
you are unsure whether a particular migration ever ran.

When a new `.sql` file adds something the app reads or writes, add it to
`EXPECTATIONS` in `scripts/check-schema.mjs`. That list is what makes the check
meaningful — a migration absent from it is a migration nobody will notice missing.

## Re-running these files is not safe

Only some are idempotent. Postgres has no `CREATE POLICY IF NOT EXISTS`, so any file
that creates RLS policies fails on a second run with "policy already exists", and
`storage-setup.sql` inserts a bucket row with no `ON CONFLICT`.

A partial failure is the dangerous case: statements before the error are applied and
the rest are not, leaving the schema half-migrated. Run a file once, and if you are
unsure whether it already ran, check with `npm run check:schema` rather than
re-running it.

| File | Safe to re-run |
|---|---|
| `editorial-post-type.sql` | yes — drops the constraint before adding it |
| `paystack-subaccounts-migration.sql` | yes — all `ADD COLUMN IF NOT EXISTS` |
| `founder-badge.sql` | yes |
| `onboarding-upgrade.sql` | yes |
| `marketplace-migration.sql` | yes — guarded columns and idempotent backfills |
| `score-level.sql` | no — creates policies |
| `fabrics-migration.sql` | no — creates policies |
| `social-setup.sql` | no — creates policies |
| `realtime-chat-fix.sql` | no — creates policies |
| `storage-setup.sql` | no — bucket insert has no `ON CONFLICT` |

Making the rest re-runnable means guarding each policy with `DROP POLICY IF EXISTS`
first. Worth doing, but it edits live security rules, so it deserves its own change
and a careful review rather than being folded into unrelated work.

## Rough order, for rebuilding from scratch

`social-setup.sql` → `storage-setup.sql` → `marketplace-migration.sql` →
`realtime-chat-fix.sql` → `onboarding-upgrade.sql` → `score-level.sql` →
`founder-badge.sql` → `fabrics-migration.sql` →
`paystack-subaccounts-migration.sql` → `editorial-post-type.sql`
