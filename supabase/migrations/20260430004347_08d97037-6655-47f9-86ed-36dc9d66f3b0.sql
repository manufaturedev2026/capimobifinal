-- Remove constraint antiga
ALTER TABLE public.founder_lots
DROP CONSTRAINT IF EXISTS founder_lots_category_check;

-- Normaliza categorias antigas
UPDATE public.founder_lots SET category = 'corretor' WHERE category = 'individual';
UPDATE public.founder_lots SET category = 'empresa' WHERE category = 'enterprise';

-- Recria constraint com as 3 categorias atuais
ALTER TABLE public.founder_lots
ADD CONSTRAINT founder_lots_category_check
CHECK (category IN ('corretor', 'empresa', 'construtora'));

-- Garante configuração padrão do sistema Fundador
INSERT INTO public.founder_settings (id, is_enabled, loop_enabled, default_slots, price_increment)
VALUES (1, true, true, 500, 30)
ON CONFLICT (id) DO NOTHING;

-- Lote inicial: Corretor Fundador
INSERT INTO public.founder_lots (
  category, lot_number, price, monthly_price, total_slots, used_slots,
  is_active, inherited_tier, ia_credits
)
SELECT 'corretor', 1, 97.00, 19.90, 500, 0, true, 'premium', 500
WHERE NOT EXISTS (
  SELECT 1 FROM public.founder_lots WHERE category = 'corretor'
);

-- Lote inicial: Empresa Fundadora
INSERT INTO public.founder_lots (
  category, lot_number, price, monthly_price, total_slots, used_slots,
  is_active, inherited_tier, ia_credits
)
SELECT 'empresa', 1, 297.00, 49.90, 500, 0, true, 'prime_empresa', 1750
WHERE NOT EXISTS (
  SELECT 1 FROM public.founder_lots WHERE category = 'empresa'
);

-- Lote inicial: Construtora Fundadora
INSERT INTO public.founder_lots (
  category, lot_number, price, monthly_price, total_slots, used_slots,
  is_active, inherited_tier, ia_credits
)
SELECT 'construtora', 1, 397.00, 69.90, 500, 0, true, 'const_master', 2500
WHERE NOT EXISTS (
  SELECT 1 FROM public.founder_lots WHERE category = 'construtora'
);