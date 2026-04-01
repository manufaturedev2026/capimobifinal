INSERT INTO storage.buckets (id, name, public) VALUES ('seller-photos', 'seller-photos', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view seller photos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'seller-photos');
CREATE POLICY "Authenticated users can upload seller photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'seller-photos');
CREATE POLICY "Users can update own seller photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'seller-photos');
CREATE POLICY "Users can delete own seller photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'seller-photos');