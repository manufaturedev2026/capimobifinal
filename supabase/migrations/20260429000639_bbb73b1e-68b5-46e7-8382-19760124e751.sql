CREATE OR REPLACE FUNCTION public.get_ai_monthly_credits_for_tier(p_tier text)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT CASE COALESCE(p_tier, 'basico')
    WHEN 'basico' THEN 50
    WHEN 'basico_empresa' THEN 50
    WHEN 'start' THEN 500
    WHEN 'premium' THEN 1200
    WHEN 'vip' THEN 2000
    WHEN 'essencial_empresa' THEN 4000
    WHEN 'premium_empresa' THEN 4000
    WHEN 'prime_empresa' THEN 7000
    ELSE 50
  END
$function$;