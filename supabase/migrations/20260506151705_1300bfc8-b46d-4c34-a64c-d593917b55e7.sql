CREATE OR REPLACE FUNCTION public.get_ai_monthly_credits_for_tier(p_tier text)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT ai_credits_per_month FROM public.subscription_plans WHERE tier = COALESCE(p_tier, 'basico') LIMIT 1),
    25
  )
$function$;