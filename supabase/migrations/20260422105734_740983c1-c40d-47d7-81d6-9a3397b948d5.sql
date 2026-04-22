CREATE OR REPLACE FUNCTION public.get_ai_monthly_credits_for_tier(p_tier text)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT CASE COALESCE(p_tier, 'basico')
    WHEN 'basico' THEN 25
    WHEN 'start' THEN 250
    WHEN 'premium' THEN 600
    WHEN 'vip' THEN 1000
    WHEN 'essencial_empresa' THEN 2000
    WHEN 'premium_empresa' THEN 2000
    WHEN 'prime_empresa' THEN 3500
    WHEN 'black' THEN 6800
    ELSE 25
  END
$function$;