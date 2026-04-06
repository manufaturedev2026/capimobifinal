INSERT INTO storage.buckets (id, name, public) VALUES ('seller-assets', 'seller-assets', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'seller-assets');
CREATE POLICY "Authenticated upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'seller-assets');
CREATE POLICY "Owner update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'seller-assets');
CREATE POLICY "Owner delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'seller-assets');