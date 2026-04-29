-- Adiciona limite mensal de visitas (cenário conservador) por plano
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS monthly_visits_limit INTEGER;

UPDATE public.subscription_plans SET monthly_visits_limit = CASE tier
  WHEN 'basico'        THEN 3000
  WHEN 'imob_basico'   THEN 3000
  WHEN 'const_basico'  THEN 3000
  WHEN 'start'         THEN 30000
  WHEN 'premium'       THEN 80000
  WHEN 'prime'         THEN 200000
  WHEN 'imob_start'    THEN 200000
  WHEN 'const_start'   THEN 300000
  WHEN 'imob_pro'      THEN 500000
  WHEN 'const_pro'     THEN 800000
  WHEN 'imob_elite'    THEN 1500000
  WHEN 'const_master'  THEN 3000000
  ELSE monthly_visits_limit
END
WHERE tier IN ('basico','imob_basico','const_basico','start','premium','prime',
               'imob_start','const_start','imob_pro','const_pro','imob_elite','const_master');

COMMENT ON COLUMN public.subscription_plans.monthly_visits_limit IS
  'Limite conservador de visitas/mês ao perfil público para garantir margem de ~50% sobre o preço pago.';