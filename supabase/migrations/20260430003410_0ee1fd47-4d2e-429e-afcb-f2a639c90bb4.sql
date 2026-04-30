
-- 1. Adicionar coluna de preço mensal opcional
ALTER TABLE public.founder_lots
  ADD COLUMN IF NOT EXISTS monthly_price numeric;

-- 2. Remover constraints restritivas antigas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'founder_lots_category_check') THEN
    ALTER TABLE public.founder_lots DROP CONSTRAINT founder_lots_category_check;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'founder_lots_inherited_tier_check') THEN
    ALTER TABLE public.founder_lots DROP CONSTRAINT founder_lots_inherited_tier_check;
  END IF;
END $$;

-- 3. Recriar constraint de categoria com construtora
ALTER TABLE public.founder_lots
  ADD CONSTRAINT founder_lots_category_check
  CHECK (category IN ('individual','enterprise','construtora'));

-- 4. Garantir founder_settings ativo
INSERT INTO public.founder_settings (id, is_enabled, default_slots, price_increment, loop_enabled)
VALUES (1, true, 500, 30, true)
ON CONFLICT (id) DO UPDATE SET is_enabled = true;

-- 5. Atualizar função de créditos IA
CREATE OR REPLACE FUNCTION public.get_ai_monthly_credits_for_tier(p_tier text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE COALESCE(p_tier, 'basico')
    WHEN 'basico' THEN 25
    WHEN 'start' THEN 250
    WHEN 'premium' THEN 600
    WHEN 'prime' THEN 1500
    WHEN 'vip' THEN 1000
    WHEN 'imob_basico' THEN 25
    WHEN 'imob_start' THEN 1500
    WHEN 'imob_pro' THEN 3000
    WHEN 'imob_elite' THEN 6000
    WHEN 'const_basico' THEN 25
    WHEN 'const_start' THEN 2000
    WHEN 'const_pro' THEN 4500
    WHEN 'const_master' THEN 10000
    WHEN 'essencial_empresa' THEN 2000
    WHEN 'premium_empresa' THEN 2000
    WHEN 'prime_empresa' THEN 3500
    WHEN 'fundador_corretor' THEN 500
    WHEN 'fundador_empresa' THEN 1750
    WHEN 'fundador_construtora' THEN 2500
    ELSE 25
  END
$function$;

-- 6. Criar 3 lotes iniciais
INSERT INTO public.founder_lots (category, lot_number, price, monthly_price, total_slots, used_slots, is_active, inherited_tier, ia_credits)
SELECT * FROM (VALUES
  ('individual',  1,  97::numeric, 19.90::numeric, 500, 0, true, 'premium',       500),
  ('enterprise',  1, 297::numeric, 49.90::numeric, 500, 0, true, 'prime_empresa', 1750),
  ('construtora', 1, 397::numeric, 69.90::numeric, 500, 0, true, 'const_pro',     2500)
) AS v(category, lot_number, price, monthly_price, total_slots, used_slots, is_active, inherited_tier, ia_credits)
WHERE NOT EXISTS (SELECT 1 FROM public.founder_lots);
