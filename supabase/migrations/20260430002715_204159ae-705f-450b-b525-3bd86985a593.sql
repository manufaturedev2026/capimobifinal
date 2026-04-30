
-- 1. Corrigir Básico Corretor: 3 -> 5 anúncios para bater com PACKAGE_CONFIG
UPDATE public.subscription_plans
SET max_items = 5
WHERE tier = 'basico';

-- 2. Inserir planos faltantes do PACKAGE_CONFIG
INSERT INTO public.subscription_plans
  (tier, name, price, max_items, max_photos_per_listing, ai_credits_per_month, storage_mb, monthly_visits_limit, category, is_active, sort_order)
VALUES
  -- Básico Empresa (grátis para empresas)
  ('basico_empresa', 'Básico Empresa', 0, 5, 5, 25, 30, 5000, 'empresa', true, 50),
  -- Exclusive (essencial_empresa)
  ('essencial_empresa', 'Exclusive', 399.99, 9999, 20, 3000, 5000, 600000, 'empresa', true, 60),
  -- Prime Empresa (premium_empresa)
  ('premium_empresa', 'Prime Empresa', 699.99, 9999, 25, 6000, 12000, 1500000, 'empresa', true, 70),
  -- Black (prime_empresa)
  ('prime_empresa', 'Black', 1199.99, 9999, 30, 12000, 30000, 3000000, 'empresa', true, 80),
  -- Fundador Corretor (equivalente VIP/Premium)
  ('fundador_corretor', 'Fundador', 97, 75, 10, 600, 380, 80000, 'fundador', true, 90),
  -- Fundador Empresa (equivalente Black)
  ('fundador_empresa', 'Fundador Empresa', 97, 9999, 30, 12000, 30000, 3000000, 'fundador', true, 91)
ON CONFLICT (tier) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  max_items = EXCLUDED.max_items,
  max_photos_per_listing = EXCLUDED.max_photos_per_listing,
  ai_credits_per_month = EXCLUDED.ai_credits_per_month,
  storage_mb = EXCLUDED.storage_mb,
  monthly_visits_limit = EXCLUDED.monthly_visits_limit,
  category = EXCLUDED.category,
  is_active = true,
  updated_at = now();
