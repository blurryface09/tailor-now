-- Marketplace: add product fields to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_type text DEFAULT 'product'
  CHECK (post_type IN ('product', 'inspo'));
ALTER TABLE posts ADD COLUMN IF NOT EXISTS price numeric(10,2) DEFAULT NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS title text DEFAULT NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;

-- Back-fill: admin/TailorNow posts stay as product; no-creative posts become inspo
UPDATE posts SET post_type = 'product' WHERE creative_id IS NOT NULL AND post_type IS NULL;
UPDATE posts SET post_type = 'inspo'   WHERE creative_id IS NULL AND post_type IS NULL;
