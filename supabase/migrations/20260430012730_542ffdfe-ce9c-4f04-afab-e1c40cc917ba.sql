-- Seed default account manager Gabriel (idempotent)
INSERT INTO public.account_managers (name, phone, photo_url, email, is_active)
SELECT 
  'Gabriel',
  '5527995055993',
  'https://lzjwmpwoybtdisenuzec.supabase.co/storage/v1/object/public/seller-assets/managers%2Fgabriel.jpg',
  'gabriel@capimobi.com.br',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.account_managers WHERE name = 'Gabriel' AND phone = '5527995055993'
);

-- Make sure his data is current even if the row already exists
UPDATE public.account_managers
SET 
  phone = '5527995055993',
  photo_url = 'https://lzjwmpwoybtdisenuzec.supabase.co/storage/v1/object/public/seller-assets/managers%2Fgabriel.jpg',
  is_active = true
WHERE name = 'Gabriel';