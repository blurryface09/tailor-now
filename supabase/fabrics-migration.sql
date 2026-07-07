-- Fabric catalogue
CREATE TABLE IF NOT EXISTS fabrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  fabric_type text NOT NULL,
  colors text[] DEFAULT '{}',
  pattern text DEFAULT 'solid',
  image_urls text[] DEFAULT '{}',
  price_per_yard numeric(10,2) NOT NULL DEFAULT 0,
  yards_in_stock numeric(10,2) DEFAULT 0,
  min_yards numeric(10,2) DEFAULT 2,
  is_available boolean DEFAULT true,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE fabrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fabrics_read" ON fabrics FOR SELECT USING (true);
CREATE POLICY "fabrics_admin_all" ON fabrics FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Add fabric fields to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fabric_id uuid REFERENCES fabrics(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fabric_source text DEFAULT 'customer_own'
  CHECK (fabric_source IN ('tailornow', 'customer_own'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fabric_yards numeric(10,2);
