-- Run this in your Supabase SQL Editor to set up Storage buckets and policies.
-- Go to: https://supabase.com/dashboard/project/<your-project>/sql/new

-- ─── Create buckets ────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('portfolio', 'portfolio', true,  5242880, ARRAY['image/jpeg','image/jpg','image/png','image/webp']),
  ('order-refs', 'order-refs', true, 5242880, ARRAY['image/jpeg','image/jpg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ─── Portfolio bucket policies (public read, auth write) ───────────────────────

CREATE POLICY "portfolio_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio');

CREATE POLICY "portfolio_auth_insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'portfolio' AND auth.role() = 'authenticated');

CREATE POLICY "portfolio_owner_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'portfolio'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ─── Order-refs bucket policies (auth read/write) ──────────────────────────────

CREATE POLICY "order_refs_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-refs');

CREATE POLICY "order_refs_auth_insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'order-refs' AND auth.role() = 'authenticated');

CREATE POLICY "order_refs_owner_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'order-refs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
