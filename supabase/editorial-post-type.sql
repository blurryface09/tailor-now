-- Allow the 'editorial' post type used by the admin feed composer.
--
-- marketplace-migration.sql created posts_post_type_check allowing only
-- ('product', 'inspo'). The admin feed composer (src/app/admin/feed/page.tsx)
-- inserts post_type = 'editorial', so every admin post failed with:
--   new row for relation "posts" violates check constraint "posts_post_type_check"
--
-- The feed renderer already handles the third type: an editorial post shows the
-- admin's chosen content tag as its badge, no price, and no ordering buttons.
-- Only the constraint was left behind.
--
-- Safe to re-run. Existing rows are all 'product' or 'inspo', so widening the
-- constraint cannot fail validation.

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_post_type_check;

ALTER TABLE posts ADD CONSTRAINT posts_post_type_check
  CHECK (post_type IN ('product', 'inspo', 'editorial'));
