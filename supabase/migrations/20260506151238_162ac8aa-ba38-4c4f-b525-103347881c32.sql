CREATE OR REPLACE FUNCTION public.get_ai_monthly_credits_for_tier(p_tier text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE COALESCE(p_tier, 'basico')
    WHEN 'basico' THEN 25
    WHEN 'start' THEN 120
    WHEN 'premium' THEN 240
    WHEN 'prime' THEN 480
    WHEN 'vip' THEN 240
    WHEN 'imob_basico' THEN 25
    WHEN 'imob_start' THEN 120
    WHEN 'imob_pro' THEN 240
    WHEN 'imob_elite' THEN 480
    WHEN 'const_basico' THEN 25
    WHEN 'const_start' THEN 120
    WHEN 'const_pro' THEN 240
    WHEN 'const_master' THEN 480
    WHEN 'essencial_empresa' THEN 1600
    WHEN 'premium_empresa' THEN 1200
    WHEN 'prime_empresa' THEN 2000
    WHEN 'fundador_corretor' THEN 240
    WHEN 'fundador_empresa' THEN 240
    WHEN 'fundador_construtora' THEN 240
    ELSE 25
  END
$function$;

UPDATE public.subscription_plans SET ai_credits_per_month = CASE tier
  WHEN 'basico' THEN 25
  WHEN 'start' THEN 120
  WHEN 'premium' THEN 240
  WHEN 'prime' THEN 480
  WHEN 'imob_basico' THEN 25
  WHEN 'imob_start' THEN 120
  WHEN 'imob_pro' THEN 240
  WHEN 'imob_elite' THEN 480
  WHEN 'const_basico' THEN 25
  WHEN 'const_start' THEN 120
  WHEN 'const_pro' THEN 240
  WHEN 'const_master' THEN 480
  WHEN 'fundador_corretor' THEN 240
  WHEN 'fundador_empresa' THEN 240
  WHEN 'fundador_construtora' THEN 240
  ELSE ai_credits_per_month
END
WHERE tier IN ('basico','start','premium','prime','imob_basico','imob_start','imob_pro','imob_elite','const_basico','const_start','const_pro','const_master','fundador_corretor','fundador_empresa','fundador_construtora');