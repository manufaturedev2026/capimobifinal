ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS max_team_members integer NOT NULL DEFAULT 0;

UPDATE public.subscription_plans SET max_team_members = CASE tier
  WHEN 'imob_basico' THEN 1
  WHEN 'imob_start' THEN 5
  WHEN 'imob_pro' THEN 15
  WHEN 'imob_elite' THEN 9999
  WHEN 'const_basico' THEN 1
  WHEN 'const_start' THEN 20
  WHEN 'const_pro' THEN 100
  WHEN 'const_master' THEN 9999
  WHEN 'fundador_empresa' THEN 9999
  WHEN 'fundador_construtora' THEN 9999
  ELSE 0
END;