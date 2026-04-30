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
    WHEN 'fundador_corretor' THEN 1500
    WHEN 'fundador_empresa' THEN 6000
    WHEN 'fundador_construtora' THEN 4500
    ELSE 25
  END
$function$;