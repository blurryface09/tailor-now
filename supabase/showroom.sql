-- Showroom: a curated section for unreleased/pending pieces ("brands" showing
-- what's coming before it's orderable). Unlike is_available (any tailor can
-- flip that on their own post), showroom placement is staff-only — a tailor
-- can only *request* it; the TailorNow team decides what gets featured.
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_showroom boolean NOT NULL DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS showroom_requested boolean NOT NULL DEFAULT false;

-- Customers join a per-post waitlist to be notified the moment a showroom
-- piece becomes available for order.
CREATE TABLE IF NOT EXISTS product_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE product_waitlist ENABLE ROW LEVEL SECURITY;

-- Safe to re-run: drop before create since Postgres has no
-- "CREATE POLICY IF NOT EXISTS".
DROP POLICY IF EXISTS "waitlist_owner_read"   ON product_waitlist;
DROP POLICY IF EXISTS "waitlist_owner_insert" ON product_waitlist;
DROP POLICY IF EXISTS "waitlist_owner_delete" ON product_waitlist;

CREATE POLICY "waitlist_owner_read"   ON product_waitlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "waitlist_owner_insert" ON product_waitlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "waitlist_owner_delete" ON product_waitlist FOR DELETE USING (auth.uid() = user_id);
