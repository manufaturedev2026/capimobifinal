
-- Add logos to previous test brokers
UPDATE profiles SET logo_url = 'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=200&h=200&fit=crop' WHERE slug = 'ana-imoveis';
UPDATE profiles SET logo_url = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop' WHERE slug = 'carlos-vip';
UPDATE profiles SET logo_url = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop' WHERE slug = 'maria-start';
UPDATE profiles SET logo_url = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop' WHERE slug = 'pedro-exclusive';
UPDATE profiles SET logo_url = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop' WHERE slug = 'luana-prime';

-- Add photos to items of previous brokers
UPDATE seller_items SET photos = ARRAY['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200']
WHERE seller_id IN (SELECT id FROM profiles WHERE slug IN ('ana-imoveis','carlos-vip','maria-start','pedro-exclusive','luana-prime'))
AND (photos IS NULL OR array_length(photos, 1) IS NULL OR array_length(photos, 1) = 0);

-- Set different themes/layouts for previous brokers
UPDATE profiles SET store_layout = 'showcase', store_theme = 'dark' WHERE slug = 'ana-imoveis';
UPDATE profiles SET store_layout = 'gallery', store_theme = 'neon-red' WHERE slug = 'carlos-vip';
UPDATE profiles SET store_layout = 'netflix', store_theme = 'luxury' WHERE slug = 'maria-start';
UPDATE profiles SET store_layout = 'elegant', store_theme = 'rose' WHERE slug = 'pedro-exclusive';
UPDATE profiles SET store_layout = 'magazine', store_theme = 'ocean' WHERE slug = 'luana-prime';
